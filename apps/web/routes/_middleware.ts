import { FreshContext } from "$fresh/server.ts";
import { verificarToken } from "../../../packages/shared/jwt.ts";

export async function handler(req: Request, ctx: FreshContext) {
  const path = new URL(req.url).pathname;

  // Permitir archivos estáticos sin restricción
  if (
    path.startsWith("/styles.") ||
    path.startsWith("/static/") ||
    path.startsWith("/_frsh/")
  ) {
    return ctx.next();
  }

  const esAuth = path.startsWith("/auth/") || path.startsWith("/api/");

  const cookie = req.headers.get("Cookie");
  const authToken = cookie?.split(";")
    .find((c) => c.trim().startsWith("auth_token="))
    ?.split("=")[1];

  let tieneSesion = false;
  if (authToken) {
    const payload = await verificarToken(authToken);
    tieneSesion = payload !== null;
  }

  if (tieneSesion) {
    return await ctx.next();
  } else if (!esAuth) {
    const headers = new Headers();
    headers.set("location", "/auth/register");
    return new Response(null, {
      status: 303,
      headers,
    });
  }

  return ctx.next();
}
