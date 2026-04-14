import { FreshContext } from "$fresh/server.ts";
import { query } from "@tfg/database/connection";
import { verificarToken } from "../../../../../packages/shared/jwt.ts";

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

  const cookie = req.headers.get("Cookie");
  const authToken = cookie?.split(";")
    .find((c) => c.trim().startsWith("auth_token="))
    ?.split("=")[1];

  if (!authToken) {
    const headers = new Headers();
    headers.set("location", "/auth/login");
    return new Response(null, {
      status: 303,
      headers,
    });
  }

  const payload = await verificarToken(authToken);
  if (!payload) {
    const headers = new Headers();
    headers.set("location", "/auth/login");
    return new Response(null, {
      status: 303,
      headers,
    });
  }

  const cesta = await query(`SELECT * FROM cesta WHERE usuario_id = $1 LIMIT 1`, [
    payload.id,
  ]);

  if (cesta.length === 0 && path === "/cesta") {
    const headers = new Headers();
    headers.set("location", "/");
    return new Response(null, {
      status: 303,
      headers,
    });
  }

  return ctx.next();
}
