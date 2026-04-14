import { FreshContext, Handlers } from "$fresh/server.ts";
import { Cesta, CestaProducto } from "@shared/types.ts";
import { query } from "@tfg/database/connection";

export const handler: Handlers = {
  POST: async (req: Request, _ctx: FreshContext) => {
    const body: { usuario_id: string; producto: CestaProducto } = await req.json();

    const existente = await query<Cesta>(
      `SELECT * FROM cesta WHERE usuario_id = $1 LIMIT 1`,
      [body.usuario_id],
    );

    if (existente.length > 0) {
      const cestaActual = existente[0];
      const productosActuales: CestaProducto[] = cestaActual.productos;

      const indexExistente = productosActuales.findIndex((p) =>
        p.nregistro === body.producto.nregistro
      );

      if (indexExistente >= 0) {
        productosActuales.splice(indexExistente, 1);
      } else {
        productosActuales.push(body.producto);
      }

      if (productosActuales.length === 0) {
        await query(
          `DELETE FROM cesta WHERE usuario_id = $1`,
          [body.usuario_id],
        );
        return new Response(JSON.stringify({ productos: [] }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const actualizado = await query<Cesta>(
        `UPDATE cesta SET productos = $1 WHERE usuario_id = $2 RETURNING *`,
        [JSON.stringify(productosActuales), body.usuario_id],
      );

      return new Response(JSON.stringify(actualizado[0]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const añadido = await query<Cesta>(
      `INSERT INTO cesta (usuario_id, productos) VALUES ($1, $2) RETURNING *`,
      [body.usuario_id, JSON.stringify([body.producto])],
    );

    return new Response(JSON.stringify(añadido[0]), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
