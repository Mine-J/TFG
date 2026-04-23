import { FreshContext, PageProps } from "$fresh/server.ts";
import { JWTHeader, UsuarioHeader } from "@shared/types.ts";
import MapaFarmacias from "../islands/MapaFarmacias.tsx";
type HomeData = { datosUsuario: UsuarioHeader | null };

export function handler(_req: Request, ctx: FreshContext<JWTHeader>) {
  const auth = ctx.state.auth ?? null;

  return ctx.render({ datosUsuario: auth });
}

export default function Home({ data }: PageProps<HomeData>) {
  return <MapaFarmacias datosUsuario={data?.datosUsuario ?? null} />;
}
