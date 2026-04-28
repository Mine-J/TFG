import { FreshContext, Handlers } from "$fresh/server.ts";
import { PedidoConDirecciones } from "@shared/types.ts";
import { verificarToken } from "@shared/jwt.ts";
import { query } from "@tfg/database/connection";

export const handler: Handlers = {
  GET: async (req: Request, _ctx: FreshContext) => {
    const cookies = req.headers.get("cookie");
    const userCoockie = cookies?.split("; ").find((c) => c.startsWith("auth_token="))?.split(
      "=",
    )[1];
    if (!userCoockie) {
      return new Response(JSON.stringify({ error: "Ausencia de token de autenticación" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const payload = await verificarToken(userCoockie);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const respuesta = await query<PedidoConDirecciones>(
      `SELECT
             row_to_json(p) AS pedido,
         ARRAY(
           SELECT f.direccion
           FROM farmacias f
               WHERE f.id = ANY(p.farmacias_ids)
         ) AS direcciones_farmacias
           FROM (
             SELECT
               p.*,
               ROW_NUMBER() OVER (
                 ORDER BY p.fecha_creacion ASC, p.id ASC
               ) AS numero_pedido
             FROM pedidos p
           ) p
       WHERE p.usuario_id = $1
       ORDER BY p.fecha_creacion DESC`,
      [payload.id],
    );

    return new Response(JSON.stringify(respuesta), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
