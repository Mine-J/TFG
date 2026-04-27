import { FreshContext, Handlers } from "$fresh/server.ts";
import { query } from "@tfg/database/connection";
import { Cesta, CestaProducto, JWTHeader } from "@shared/types.ts";

type CestaProductoConBioequivalente = CestaProducto & {
  bioequivalente?: boolean;
};

export const handler: Handlers = {
  POST: async (req: Request, ctx: FreshContext<JWTHeader>) => {
    const user = ctx.state.auth;
    if (!user || user.tipo !== "usuario") {
      return new Response("No autorizado", { status: 401 });
    }
    const { nregistro, bioequivalente } = await req.json();

    const cesta = await query<Cesta>(
      `SELECT * FROM cesta WHERE usuario_id = $1 LIMIT 1`,
      [user.id],
    );

    if (cesta.length === 0) {
      return new Response(JSON.stringify({ error: "Cesta no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const existeProducto = cesta[0].productos.some((producto) => producto.nregistro === nregistro);

    if (!existeProducto) {
      return new Response(JSON.stringify({ error: "Producto no encontrado en la cesta" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const productosActualizados = (cesta[0].productos as CestaProductoConBioequivalente[]).map((
      producto,
    ) => producto.nregistro === nregistro ? { ...producto, bioequivalente } : producto);

    const actualizado = await query<Cesta>(
      `UPDATE cesta SET productos = $1 WHERE usuario_id = $2 RETURNING *`,
      [JSON.stringify(productosActualizados), user.id],
    );

    if (actualizado.length === 0) {
      return new Response(JSON.stringify({ error: "No se pudo actualizar la cesta" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return (new Response(JSON.stringify(actualizado[0]), {
      headers: { "Content-Type": "application/json" },
    }));
  },
};
