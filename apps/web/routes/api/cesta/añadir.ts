import { FreshContext, Handlers } from "$fresh/server.ts";
import { Cesta, CestaProducto, ProductoInfo } from "@shared/types.ts";
import { query } from "@tfg/database/connection";
import Axios from "npm:axios@^1.6.0";

export const handler: Handlers = {
  POST: async (req: Request, _ctx: FreshContext) => {
    const body: { usuario_id: string; producto: CestaProducto } = await req.json();

    const existeEnProductos = await query(
      `SELECT 1 FROM productos WHERE nregistro = $1`,
      [body.producto.nregistro],
    );

    if (existeEnProductos.length === 0) {
      const respuesta = await Axios.get<ProductoInfo>(
        `https://cima.aemps.es/cima/rest/medicamento?nregistro=${body.producto.nregistro}`,
      );

      const producto: ProductoInfo | null = respuesta.data || null;
      if (!producto) {
        return new Response(JSON.stringify({ error: "Producto no encontrado" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      await query(
        `INSERT INTO productos (
          nregistro,
          nombre,
          pactivos,
          labtitular,
          labcomercializador,
          cpresc,
          estado,
          comerc,
          receta,
          generico,
          conduc,
          triangulo,
          huerfano,
          biosimilar,
          nosustituible,
          psum,
          notas,
          materialesinf,
          ema,
          docs,
          fotos,
          "viasAdministracion",
          atcs,
          "principiosActivos",
          excipientes,
          presentaciones,
          "formaFarmaceutica",
          "formaFarmaceuticaSimplificada",
          vtm,
          dosis
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25,
          $26, $27, $28, $29, $30
        )
        ON CONFLICT (nregistro) DO NOTHING`,
        [
          producto.nregistro,
          producto.nombre,
          producto.pactivos,
          producto.labtitular,
          producto.labcomercializador,
          producto.cpresc,
          JSON.stringify(producto.estado),
          producto.comerc,
          producto.receta,
          producto.generico,
          producto.conduc,
          producto.triangulo,
          producto.huerfano,
          producto.biosimilar,
          JSON.stringify(producto.nosustituible),
          producto.psum,
          producto.notas,
          producto.materialesInf,
          producto.ema,
          JSON.stringify(producto.docs),
          JSON.stringify(producto.fotos),
          JSON.stringify(producto.viasAdministracion),
          JSON.stringify(producto.atcs),
          JSON.stringify(producto.principiosActivos),
          JSON.stringify(producto.excipientes),
          JSON.stringify(producto.presentaciones),
          JSON.stringify(producto.formaFarmaceutica),
          JSON.stringify(producto.formaFarmaceuticaSimplificada),
          JSON.stringify(producto.vtm),
          producto.dosis,
        ],
      );
    }

    const existente = await query<Cesta>(
      `SELECT * FROM cesta WHERE usuario_id = $1 LIMIT 1`,
      [body.usuario_id],
    );

    if (existente.length > 0) {
      const cestaActual = existente[0];
      const productosActuales: CestaProducto[] = cestaActual.productos;

      const indexExistente = productosActuales.findIndex((p) =>
        p.nregistro === body.producto.nregistro
      );

      if (indexExistente >= 0) {
        productosActuales.splice(indexExistente, 1);
      } else {
        productosActuales.push(body.producto);
      }

      if (productosActuales.length === 0) {
        await query(
          `DELETE FROM cesta WHERE usuario_id = $1`,
          [body.usuario_id],
        );
        return new Response(JSON.stringify({ productos: [] }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const actualizado = await query<Cesta>(
        `UPDATE cesta SET productos = $1 WHERE usuario_id = $2 RETURNING *`,
        [JSON.stringify(productosActuales), body.usuario_id],
      );

      return new Response(JSON.stringify(actualizado[0]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const añadido = await query<Cesta>(
      `INSERT INTO cesta (usuario_id, productos) VALUES ($1, $2) RETURNING *`,
      [body.usuario_id, JSON.stringify([body.producto])],
    );

    return new Response(JSON.stringify(añadido[0]), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
