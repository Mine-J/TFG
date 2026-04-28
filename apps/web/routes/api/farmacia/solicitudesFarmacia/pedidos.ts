import { FreshContext, Handlers } from "$fresh/server.ts";
import {
  JWTHeader,
  Pedido,
  PedidoConDetalle,
  ProductoConDetalle,
  ProductoInfo,
} from "@shared/types.ts";
import { query } from "@tfg/database/connection";

export const handler: Handlers = {
  GET: async (req: Request, ctx: FreshContext<JWTHeader>) => {
    const user = ctx.state.auth;
    if (!user || user.tipo !== "farmacia") {
      return new Response("No autorizado", { status: 401 });
    }

    const url = new URL(req.url);
    const tipoPedidos = url.searchParams.get("tipo") || "Pendiente";

    const pedidos: Pedido[] = await query<Pedido>(
      `WITH pedidos_ordenados AS (
         SELECT
           id,
           productos,
           estado,
           farmacias_ids,
           farmacias_rechazadas,
           fecha_creacion,
           ROW_NUMBER() OVER (ORDER BY fecha_creacion ASC, id ASC) AS numero_pedido
         FROM pedidos
       )
       SELECT id, productos, numero_pedido
       FROM pedidos_ordenados
       WHERE estado = $1 AND $2 = ANY(farmacias_ids)
       AND NOT ($2 = ANY(farmacias_rechazadas))
       ORDER BY fecha_creacion DESC`,
      [tipoPedidos, user.id],
    );

    if (pedidos.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extraer todos los nregistro de todos los pedidos
    const registros = [
      ...new Set(pedidos.flatMap((p) => p.productos.map((prod) => prod.nregistro))),
    ];

    // Obtener detalles en una sola query
    const productosBD: ProductoInfo[] = await query(
      `SELECT * FROM productos WHERE nregistro = ANY($1::varchar[])`,
      [registros],
    );

    const mapaProductos = new Map(
      productosBD.map((p) => [p.nregistro, p]),
    );

    // Mapear cada pedido con sus productos enriquecidos
    const pedidosConDetalle: PedidoConDetalle[] = pedidos.map((pedido) => ({
      id: String(pedido.id),
      numero_pedido: Number(pedido.numero_pedido),
      productos: pedido.productos.map((prod) => ({
        bioequivalente: prod.bioequivalente,
        nregistro: prod.nregistro,
        cantidad: prod.cantidad,
        detalle: mapaProductos.get(prod.nregistro) ?? null,
      })) as ProductoConDetalle[],
    }));

    return new Response(JSON.stringify(pedidosConDetalle), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
