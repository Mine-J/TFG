import { FreshContext, Handlers } from "$fresh/server.ts";
import Axios from "npm:axios@^1.6.0";
import { RespuestaAPIProducto } from "@shared/types.ts";

export const handler: Handlers = {
  GET: async (_req: Request, ctx: FreshContext) => {
    const id = ctx.params.id;

    const respuesta = await Axios.get<RespuestaAPIProducto>(
      `https://cima.aemps.es/cima/rest/medicamentos?nregistro=${id}`,
    );

    // Devolver el primer producto del array de resultados
    const producto = respuesta.data.resultados?.[0] || null;

    return new Response(JSON.stringify(producto), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
