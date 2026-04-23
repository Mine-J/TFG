import { FreshContext, Handlers } from "$fresh/server.ts";
import { RespuestaMapaFarmacias } from "@shared/types.ts";
import { query } from "@tfg/database/connection";

export const handler: Handlers = {
  GET: async (_req: Request, _ctx: FreshContext) => {
    const farmacias = await query<RespuestaMapaFarmacias["farmacias"][number]>(
      `SELECT id, direccion, lat, lng, codigo_postal, horario, telefono
       FROM farmacias
       WHERE lat IS NOT NULL AND lng IS NOT NULL`,
    );

    const respuesta: RespuestaMapaFarmacias = {
      token: Deno.env.get("MAPBOX_API_KEY") || "",
      farmacias,
    };

    return new Response(JSON.stringify(respuesta), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
