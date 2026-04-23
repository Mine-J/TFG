import { FreshContext, Handlers } from "$fresh/server.ts";
import { query } from "@tfg/database/connection";
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
      const token_valido: { entidad_id: string; tipo_usuario: string }[] = await query(
        `SELECT entidad_id, tipo_usuario FROM tokens_resetear_password WHERE token_hasheado = $1 AND expires_at > CURRENT_TIMESTAMP`,
        [token],
      );

      if (token_valido.length === 0) {
        return new Response(
          JSON.stringify({ error: "Token inválido o expirado" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      // Hashear nueva contraseña
      const password_hash = await bcrypt.hash(nuevaContraseña);

      // Actualizar contraseña en la BD
      const actualizado = await query(
        `UPDATE ${token_valido[0].tipo_usuario} SET password_hash = $1 WHERE id = $2 RETURNING *`,
        [password_hash, token_valido[0].entidad_id],
      );

      if (actualizado.length === 0) {
        return new Response(
          JSON.stringify({ error: "Error al actualizar la contraseña" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
      await query(
        `UPDATE tokens_resetear_password SET used_at = CURRENT_TIMESTAMP WHERE token_hasheado = $1`,
        [token],
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
