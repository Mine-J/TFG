import { FreshContext, Handlers } from "$fresh/server.ts";
import Axios from "npm:axios@^1.6.0";
import { RespuestaAPIProducto } from "@shared/types.ts";

export const handler: Handlers = {
  GET: async (req: Request, _ctx: FreshContext) => {
    const url = new URL(req.url);
    const page = url.searchParams.get("page") || "1";
    const name = url.searchParams.get("name") || "";
    const respuesta = await Axios.get<RespuestaAPIProducto>(
      `https://cima.aemps.es/cima/rest/medicamentos?pagina=${page}&nombre=${name}`,
    );
    
    const producto = respuesta.data || null;

    return new Response(JSON.stringify(producto), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
