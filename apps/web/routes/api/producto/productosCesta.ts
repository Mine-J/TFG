import { query } from "@tfg/database/connection";
import { FreshContext, Handlers } from "$fresh/src/server/mod.ts";
import { Cesta, JWTHeader, ProductoConDetalle, ProductoInfo } from "@shared/types.ts";

export const handler: Handlers = {
  GET: async (_req: Request, ctx: FreshContext<JWTHeader>) => {
    const user = ctx.state.auth;
    if (!user || user.tipo !== "usuario") {
      return new Response("No autorizado", { status: 401 });
    }
    const cestaUsuario: Cesta[] = await query(
      `SELECT * FROM cesta WHERE usuario_id = $1 LIMIT 1`,
      [user.id],
    );

    if (cestaUsuario.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const cesta = cestaUsuario[0];

    const registros = cesta.productos.map((producto) => producto.nregistro);
    const productosBD: ProductoInfo[] = await query(
      `SELECT * FROM productos WHERE nregistro = ANY($1::varchar[])`,
      [registros],
    );
    

    const mapaProductos = new Map(productosBD.map((producto) => [producto.nregistro, producto]));

    const productosConDetalle: ProductoConDetalle[] = cesta.productos.map((producto) => ({
      bioequivalente: producto.bioequivalente,
      nregistro: producto.nregistro,
      cantidad: producto.cantidad,
      detalle: mapaProductos.get(producto.nregistro) ?? null,
    }));

    return new Response(JSON.stringify(productosConDetalle), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
