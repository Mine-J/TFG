import { FreshContext, Handlers } from "$fresh/server.ts";
import { verificarToken } from "@shared/jwt.ts";
import { query } from "@tfg/database/connection";

export const handler: Handlers = {
  POST: async (req: Request, _ctx: FreshContext) => {
    const cookies = req.headers.get("cookie");
    const authToken = cookies?.split("; ").find((c) => c.startsWith("auth_token="))?.split("=")[1];

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

    const body: { pedido_id: string } = await req.json();
    if (!body.pedido_id) {
      return new Response(JSON.stringify({ error: "pedido_id es obligatorio" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const actualizado = await query<{ id: string }>(
      `UPDATE pedidos
       SET estado = 'Cancelado'
       WHERE id = $1
         AND usuario_id = $2
         AND COALESCE(estado, 'Pendiente') NOT IN ('Cancelado', 'Finalizado')
       RETURNING id`,
      [body.pedido_id, payload.id],
    );

    if (actualizado.length === 0) {
      return new Response(JSON.stringify({ error: "No se pudo cancelar el pedido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ mensaje: "Pedido cancelado" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
