import { FreshContext, Handlers } from "$fresh/server.ts";
import { Cesta } from "@shared/types.ts";
import { query } from "@tfg/database/connection";

export const handler: Handlers = {
  GET: async (_req: Request, ctx: FreshContext) => {
    const { id } = ctx.params;

    try {
      const cesta = await query<Cesta>(
        `SELECT * FROM cesta WHERE usuario_id = $1 LIMIT 1`,
        [id],
      );

      if (cesta.length === 0) {
        
        return new Response(JSON.stringify({ usuario_id: id, productos: [] }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(cesta[0]), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al obtener cesta:", error);
      return new Response(JSON.stringify({ error: "Error al obtener cesta" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
