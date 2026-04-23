import { query } from "../../../../../packages/database/connection.ts";
import { FreshContext, Handlers } from "$fresh/server.ts";
import { verificarToken } from "../../../../../packages/shared/jwt.ts";

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

    const tabla = payload.tipo === "farmacia" ? "farmacias" : "usuarios";
    const result = await query<Record<string, unknown>>(
      `SELECT * FROM ${tabla} WHERE id = $1 LIMIT 1`,
      [payload.id],
    );

    if (result.length === 0) {
      return new Response(JSON.stringify({ error: "Cuenta no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ...result[0],
        tipo: payload.tipo,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  },
};
