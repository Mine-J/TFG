import { Handlers } from "$fresh/server.ts";
import { query } from "@tfg/database/connection";
import { Cesta, Farmacia, Pedido } from "@shared/types.ts";

function calcularDistancia(
  lngUsuario: number,
  latUsuario: number,
  lngFarmacia: number,
  latFarmacia: number,
): number {
  // formula = raiz(latFarmacia - latUsuario)^2 + (lngFarmacia - lngUsuario)^2
  const latDiff = latFarmacia - latUsuario;
  const lngDiff = lngFarmacia - lngUsuario;
  const distancia = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

  // Convertir a kilómetros (aproximadamente, 1 grado ~ 111 km)
  return distancia * 111;
}

export const handler: Handlers = {
  POST: async (req: Request) => {
    const body: {
      usuario_id: string;
      usuarioLat: number;
      usuarioLon: number;
      distancia_maxima: number;
    } = await req.json();

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

    // Obtener todas las farmacias con coordenadas
    const farmacias = await query<Farmacia>(
      `SELECT id, email, cif, direccion, telefono, lat, lng FROM farmacias WHERE lat IS NOT NULL AND lng IS NOT NULL`,
    );

    const farmaciasConDistancia = farmacias.map((farmacia) => {
      const distancia = calcularDistancia(
        body.usuarioLon,
        body.usuarioLat,
        farmacia.lng,
          farmacia.lat,
        );

      if (distancia === null) return null;
        return {
          ...farmacia,
          distancia,
        };
      })

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
