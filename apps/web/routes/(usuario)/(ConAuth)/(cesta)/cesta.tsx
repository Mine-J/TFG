import { FreshContext, PageProps } from "$fresh/server.ts";
import { CestaComponent } from "../../../../islands/CestaComponent.tsx";
import type { JWTHeader, UsuarioHeader } from "@shared/types.ts";

type CestaPageData = { datosUsuario: UsuarioHeader };

export function handler(_req: Request, ctx: FreshContext<JWTHeader, CestaPageData>) {
  const auth = ctx.state.auth;
  if (!auth || auth.tipo !== "usuario") return ctx.render();

  return ctx.render({ datosUsuario: auth });
}

export default function Home({ data }: PageProps<CestaPageData>) {
  return <CestaComponent datosUsuario={data.datosUsuario} />;
}
