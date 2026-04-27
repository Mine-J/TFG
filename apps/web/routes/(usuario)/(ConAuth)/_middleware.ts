import { FreshContext } from "$fresh/server.ts";
import { query } from "@tfg/database/connection";
import type { JWTHeader } from "@shared/types.ts";

export async function handler(req: Request, ctx: FreshContext<JWTHeader>) {
  const path = new URL(req.url).pathname;

  // Permitir archivos estáticos sin restricción
  if (
    path.startsWith("/styles.") ||
    path.startsWith("/static/") ||
    path.startsWith("/_frsh/")
  ) {
    return ctx.next();
  }

  const authUser = ctx.state.auth;
  if (!authUser) {
    const headers = new Headers();
    headers.set("location", "/auth/login");
    return new Response(null, {
      status: 303,
      headers,
    });
  }

  if (path === "/cesta") {
    const cesta = await query(`SELECT * FROM cesta WHERE usuario_id = $1 LIMIT 1`, [
      authUser.id,
    ]);
    if (cesta.length === 0) {
      const headers = new Headers();
      headers.set("location", "/");
      return new Response(null, {
        status: 303,
        headers,
      });
    }
  } else if (path === "/pedidos") {
    const pedidos = await query(`SELECT * FROM pedidos WHERE usuario_id = $1`, [
      authUser.id,
    ]);

    if (pedidos.length === 0) {
      const headers = new Headers();
      headers.set("location", "/");
      return new Response(null, {
        status: 303,
        headers,
      });
    }
  } else if (path === "/modificar-datos") {
    const usuario = await query(
      `SELECT id FROM usuarios u WHERE u.id = $1
       UNION
       SELECT id FROM farmacias f WHERE f.id = $1`,
      [authUser.id]
    );
    if (usuario.length === 0) {
      const headers = new Headers();
      headers.set("location", "/");
      return new Response(null, {
        status: 303,
        headers,
      });
    }
  }

  return ctx.next();
}
