import { FreshContext, Handlers } from "$fresh/server.ts";
import { query } from "@tfg/database/connection";
import { JWTHeader } from "@shared/types.ts";

export const handler: Handlers = {
    POST: async (req: Request, ctx: FreshContext<JWTHeader>) => { 
        const user = ctx.state.auth;
        if (!user || user.tipo !== "farmacia") {
            return new Response("No autorizado", { status: 401 });
        }
        const { id_pedido } = await req.json();
        const finalizado = await query(`UPDATE pedidos SET estado = 'Finalizado' WHERE id = $1 RETURNING id`, [id_pedido]);
        if (finalizado.length === 0) {
            return new Response("Error al finalizar el pedido", { status: 500 });
        }
        return new Response(JSON.stringify({ success: true, message: "Pedido finalizado correctamente" }), {
            headers: { "Content-Type": "application/json" },
        });
    }
}