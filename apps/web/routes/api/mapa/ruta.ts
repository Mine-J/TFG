import { FreshContext, Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET: async (req: Request, _ctx: FreshContext) => {
    const url = new URL(req.url);
    const latFarmacia = url.searchParams.get("latFarmacia");
    const lngFarmacia = url.searchParams.get("lngFarmacia");
    const latUsuario = url.searchParams.get("latUsuario");
    const lngUsuario = url.searchParams.get("lngUsuario");
    const modo = url.searchParams.get("movilidad") || "walking";

    const token_mapbox = Deno.env.get("MAPBOX_API_KEY");
    if (!token_mapbox) {
      return new Response(JSON.stringify({ error: "Token de Mapbox no encontrado" }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }
    const url_Api =
      `https://api.mapbox.com/directions/v5/mapbox/${modo}/${lngUsuario},${latUsuario};${lngFarmacia},${latFarmacia}?geometries=geojson&access_token=${token_mapbox}`;

    const res = await fetch(url_Api);
    const data = await res.json();

    const ruta = data.routes[0].geometry;
    const tiempo = data.routes[0].duration / 60;
    const datos = { ruta, tiempo };

    return (new Response(JSON.stringify(datos)));
  },
};
