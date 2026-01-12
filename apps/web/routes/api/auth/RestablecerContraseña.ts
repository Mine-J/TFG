import { FreshContext, Handlers } from "$fresh/server.ts";
import { query } from "@tfg/database/connection";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

export const handler: Handlers = {
  POST: async (req: Request, _ctx: FreshContext) => {
    try {
      const { token, nuevaContraseña } = await req.json();

      if (!token || !nuevaContraseña) {
        return new Response(
          JSON.stringify({ error: "Token y contraseña son obligatorios" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Verificar JWT
      const JWT_SECRET = Deno.env.get("JWT_SECRET");
      if (!JWT_SECRET) {
        throw new Error("JWT_SECRET no configurado");
      }

      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(JWT_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"],
      );

      let payload;
      try {
        payload = await verify(token, key);
      } catch (_error) {
        return new Response(
          JSON.stringify({ error: "Token inválido o expirado" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      // Verificar que es un token de recuperación
      if (payload.tipo !== "recuperacion") {
        return new Response(
          JSON.stringify({ error: "Token no válido para esta operación" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      // Hashear nueva contraseña
      const password_hash = await bcrypt.hash(nuevaContraseña);

      // Actualizar contraseña en la BD
      await query(
        `UPDATE usuarios SET password_hash = $1 WHERE id = $2`,
        [password_hash, payload.id],
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: "Contraseña actualizada correctamente",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      console.error("Error al restablecer contraseña:", error);
      return new Response(
        JSON.stringify({ error: "Error al procesar la solicitud" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
