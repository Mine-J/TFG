import { FreshContext, Handlers } from "$fresh/server.ts";
import { Cesta, CestaProducto, Pedido } from "@shared/types.ts";
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

    const pedido = await query<Pedido>(
      `SELECT * FROM pedidos WHERE id = $1 AND usuario_id = $2 LIMIT 1`,
      [body.pedido_id, payload.id],
    );

    if (pedido.length === 0) {
      return new Response(JSON.stringify({ error: "Pedido no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const productosPedido = pedido[0].productos || [];
    if (!Array.isArray(productosPedido) || productosPedido.length === 0) {
      return new Response(JSON.stringify({ error: "El pedido no tiene productos" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cestaActual = await query<Cesta>(
      `SELECT * FROM cesta WHERE usuario_id = $1 LIMIT 1`,
      [payload.id],
    );

    if (cestaActual.length > 0) {
      const productosActuales = cestaActual[0].productos || [];
      const mapaCantidades = new Map<string, number>();

      productosActuales.forEach((p: CestaProducto) => {
        mapaCantidades.set(p.nregistro, (mapaCantidades.get(p.nregistro) || 0) + p.cantidad);
      });

      productosPedido.forEach((p: CestaProducto) => {
        mapaCantidades.set(p.nregistro, (mapaCantidades.get(p.nregistro) || 0) + p.cantidad);
      });

      const productosFusionados: CestaProducto[] = Array.from(mapaCantidades.entries()).map((
        [nregistro, cantidad],
      ) => ({
        nregistro,
        cantidad,
      }));

      await query(
        `UPDATE cesta SET productos = $1 WHERE usuario_id = $2`,
        [JSON.stringify(productosFusionados), payload.id],
      );
    } else {
      await query(
        `INSERT INTO cesta (usuario_id, productos) VALUES ($1, $2)`,
        [payload.id, JSON.stringify(productosPedido)],
      );
    }

    return new Response(JSON.stringify({ mensaje: "Pedido repetido en la cesta" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
