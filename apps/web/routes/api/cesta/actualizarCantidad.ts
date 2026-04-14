import { FreshContext, Handlers } from "$fresh/server.ts";
import { Cesta, CestaProducto } from "@shared/types.ts";
import { query } from "@tfg/database/connection";

export const handler: Handlers = {
  POST: async (req: Request, _ctx: FreshContext) => {
    const body: { usuario_id: string; nregistro: string; cambio: number } = await req.json();

    try {
      const existente = await query<Cesta>(
        `SELECT * FROM cesta WHERE usuario_id = $1 LIMIT 1`,
        [body.usuario_id],
      );

      if (existente.length === 0) {
        return new Response(JSON.stringify({ error: "Cesta no encontrada" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const cestaActual = existente[0];
      const productosActuales: CestaProducto[] = cestaActual.productos;

      const indexProducto = productosActuales.findIndex((p) => p.nregistro === body.nregistro);

      productosActuales[indexProducto].cantidad += body.cambio;

      const actualizado = await query<Cesta>(
        `UPDATE cesta SET productos = $1 WHERE usuario_id = $2 RETURNING *`,
        [JSON.stringify(productosActuales), body.usuario_id],
      );

      return new Response(JSON.stringify(actualizado[0]), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al actualizar cantidad:", error);
      return new Response(JSON.stringify({ error: "Error al actualizar cantidad" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
