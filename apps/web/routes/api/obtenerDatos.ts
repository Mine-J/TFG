import { query } from "../../../../packages/database/connection.ts"; // tu conexión
import { FreshContext, Handlers } from "$fresh/server.ts";
import type { Usuario } from "../../../../packages/shared/types.ts";
import { verificarToken } from "../../../../packages/shared/jwt.ts";

export const handler: Handlers = {
  GET: async (req: Request, _ctx: FreshContext) => {
    const cookie = req.headers.get("Cookie");
    const cookies = cookie?.split(";");
    const authToken = cookies?.find((c) => c.trim().startsWith("auth_token="))?.split("=")[1];

    if (!authToken) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = await verificarToken(authToken);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await query(`SELECT * FROM usuarios WHERE id = $1 LIMIT 1`, [
      payload.id,
    ]);
    const user = result[0] as Usuario;

    return new Response(JSON.stringify(user), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
