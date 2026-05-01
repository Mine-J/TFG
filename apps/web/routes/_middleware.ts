import { FreshContext } from "$fresh/server.ts";
import { query } from "@tfg/database/connection";
import { verificarToken } from "../../../packages/shared/jwt.ts";
import type { JWTHeader, UsuarioHeader } from "@shared/types.ts";

export async function handler(req: Request, ctx: FreshContext<JWTHeader>) {
  const path = new URL(req.url).pathname;

  // Permitir archivos estáticos sin restricción
  if (
    path.startsWith("/styles.") ||
    path.startsWith("/static/") ||
    path.startsWith("/_fresh/") ||
    /\.(png|jpg|jpeg|svg|ico|webp|gif|css|js|map|woff|woff2|ttf|eot)$/i.test(path)
  ) {
    return ctx.next();
  }

  const esAuth = path.startsWith("/auth/") || path.startsWith("/api/");

  const cookie = req.headers.get("Cookie");
  const authToken = cookie?.split(";")
    .find((c) => c.trim().startsWith("auth_token="))
    ?.split("=")[1];

  if (authToken) {
    const payload = await verificarToken(authToken);
    const tieneSesion = payload !== null;

    if (tieneSesion) {
      if (
        payload?.tipo === "farmacia" && !path.startsWith("/farmacia/") &&
        !path.startsWith("/api/") && !path.startsWith("/modificar-datos") && !path.startsWith("/preguntas-frecuentes")
      ) {
        const headers = new Headers();
        headers.set("location", "/farmacia/solicitudes");
        return new Response(null, {
          status: 303,
          headers,
        });
      } else if (payload?.tipo === "usuario" && path.startsWith("/farmacia/")) {
        const headers = new Headers();
        headers.set("location", "/");
        return new Response(null, {
          status: 303,
          headers,
        });
      }
      let user: UsuarioHeader[] = [];
      if (payload?.tipo === "farmacia") {
        user = await query<UsuarioHeader>(
          `select id, nif, email, codigo_postal, direccion, lat, lng, telefono, horario, $1 as tipo from farmacias where id = $2 limit 1`,
          [payload.tipo, payload.id],
        );
      } else if (payload?.tipo === "usuario") {
        user = await query<UsuarioHeader>(
          `select id, nombre, apellidos, email, codigo_postal, direccion, lat, lng, telefono, $1 as tipo from usuarios where id = $2 limit 1`,
          [payload.tipo, payload.id],
        );

        const numeroProductosCesta = await query<{ total: number }>(
          `SELECT COALESCE(SUM(jsonb_array_length(productos::jsonb)), 0) AS total
           FROM cesta
           WHERE usuario_id = $1`,
          [payload.id],
        );

        ctx.state.numeroProductosCesta = Number(numeroProductosCesta[0]?.total ?? 0);
      }
      ctx.state.auth = user[0] as UsuarioHeader;
      return await ctx.next();
    } else if (!esAuth) {
      const headers = new Headers();
      headers.set("location", "/auth/register");
      return new Response(null, {
        status: 303,
        headers,
      });
    }
  }

  return ctx.next();
}
