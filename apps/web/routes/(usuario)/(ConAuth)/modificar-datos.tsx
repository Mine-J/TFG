import { FreshContext, PageProps } from "$fresh/src/server/mod.ts";
import { JWTHeader, UsuarioHeader } from "@shared/types.ts";
import { ModificarDatos } from "../../../islands/ModificarDatos.tsx";

type datos = { datosUsuario: UsuarioHeader };

export function handler(_req: Request, ctx: FreshContext<JWTHeader, datos>) {
  const auth = ctx.state.auth;
  if (!auth) return ctx.render();

  return ctx.render({ datosUsuario: auth });
}

export default function Home({ data }: PageProps<datos>) {
  return <ModificarDatos datosUsuario={data.datosUsuario} />;
}
