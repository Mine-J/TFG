import { Handlers } from "$fresh/server.ts";
import { query } from "@tfg/database/connection";
import { Cesta, Farmacia, Pedido } from "@shared/types.ts";

// Función para calcular distancia usando Mapbox Directions API
async function calcularDistanciaMapbox(
  lngUsuario: number,
  latUsuario: number,
  lngFarmacia: number,
  latFarmacia: number,
): Promise<number | null> {
  const MAPBOX_TOKEN = Deno.env.get("MAPBOX_API_KEY");
  if (!MAPBOX_TOKEN) {
    console.error("MAPBOX_ACCESS_TOKEN no configurado");
    return null;
  }

  try {
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/walking/${lngUsuario},${latUsuario};${lngFarmacia},${latFarmacia}?access_token=${MAPBOX_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      // Distancia en metros, convertir a km
      return data.routes[0].distance / 1000;
    }
    return null;
  } catch (error) {
    console.error("Error calculando distancia con Mapbox:", error);
    return null;
  }
}

export const handler: Handlers = {
  POST: async (req: Request) => {
    const body: { usuario_id: string; distancia_maxima: number } = await req.json();

    // Obtener la cesta actual antes de borrarla
    const cestaActual = await query<Cesta>(
      `SELECT * FROM cesta WHERE usuario_id = $1 LIMIT 1`,
      [body.usuario_id],
    );

    if (cestaActual.length === 0) {
      return new Response(JSON.stringify({ error: "Cesta no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Obtener las coordenadas del usuario
    const usuario = await query<{ lat: number; lng: number }>(
      `SELECT lat, lng FROM usuarios WHERE id = $1 LIMIT 1`,
      [body.usuario_id],
    );

    if (usuario.length === 0 || !usuario[0].lat || !usuario[0].lng) {
      return new Response(JSON.stringify({ error: "Usuario sin coordenadas configuradas" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { lat: latUsuario, lng: lngUsuario } = usuario[0];

    // Obtener todas las farmacias con coordenadas
    const farmacias = await query<Farmacia>(
      `SELECT id, email, cif, direccion, telefono, lat, lng FROM farmacias WHERE lat IS NOT NULL AND lng IS NOT NULL`,
    );

    // Calcular distancias con Mapbox para cada farmacia
    const farmaciasConDistancia = await Promise.all(
      farmacias.map(async (farmacia) => {
        const distancia = await calcularDistanciaMapbox(
          lngUsuario,
          latUsuario,
          farmacia.lng,
          farmacia.lat,
        );

        if (distancia === null) return null;

        return {
          ...farmacia,
          distancia,
        };
      }),
    );

    // Filtrar farmacias dentro del rango y ordenar por distancia

    const farmaciasEnRango = farmaciasConDistancia
      .filter((f) => f !== null && f.distancia <= body.distancia_maxima)
      .sort((a, b) => a!.distancia - b!.distancia);

    if (farmaciasEnRango.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No hay farmacias en el rango especificado",
          distancia_maxima: body.distancia_maxima,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Extraer los IDs de las farmacias
    const farmaciasIds = farmaciasEnRango.map((f) => f!.id);

    // Guardar el pedido en la tabla pedidos
    const pedidoGuardado = await query<Pedido>(
      `INSERT INTO pedidos (usuario_id, productos, farmacias_ids) 
           VALUES ($1, $2, $3) RETURNING *`,
      [
        body.usuario_id,
        JSON.stringify(cestaActual[0].productos),
        farmaciasIds,
      ],
    );

    await query(
      `DELETE FROM cesta WHERE usuario_id = $1`,
      [body.usuario_id],
    );

    return (
      new Response(
        JSON.stringify({
          mensaje: "Pedido realizado con éxito",
          pedido: pedidoGuardado[0],
          farmacias_disponibles: farmaciasEnRango,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    );
  },
};
