import { query } from "../../../../../packages/database/connection.ts"; // tu conexión
import { FreshContext, Handlers } from "$fresh/server.ts";
import type { Farmacia, Usuario } from "../../../../../packages/shared/types.ts";
import { generarToken } from "../../../../../packages/shared/jwt.ts";
import bcryptjs from "bcryptjs";

export const handler: Handlers = {
  POST: async (req: Request, _ctx: FreshContext) => {
    try {
      const body = await req.json();
      if (body.tipo === "farmacia") {
        const { nif, password } = body;

        const result = (await query(
          `SELECT * FROM farmacias WHERE nif = $1 LIMIT 1`,
          [nif],
        )) as Farmacia[];
        const farmacia: Farmacia | null = result[0] ?? null;

        if (!farmacia) {
          return new Response(JSON.stringify("Farmacia no encontrada"), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        const passwordMatch = await bcryptjs.compare(password, farmacia.password_hash);
        if (!passwordMatch) {
          return new Response(JSON.stringify("Contraseña incorrecta"), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const farmaciaId = result[0].id!;
        const token = await generarToken({ id: String(farmaciaId), tipo: "farmacia" });
        const maxAge = 60 * 60 * 24 * 7; // 7 días
        const cookie = `auth_token=${token}; Path=/; HttpOnly; Max-Age=${maxAge}; SameSite=Strict`;

        return new Response(JSON.stringify("Inicio de sesión exitoso"), {
          status: 200,
          headers: { "Set-Cookie": cookie, "Content-Type": "application/json" },
        });
      } else if (body.tipo === "usuario") {
        const { email, password } = body;

        const result = (await query(
          `SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          [email],
        )) as Usuario[];
        const user = result[0] ?? null;

        if (!user) {
          return new Response(JSON.stringify("Usuario no encontrado"), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        const passwordMatch = await bcryptjs.compare(password, user.password_hash);
        if (!passwordMatch) {
          return new Response(JSON.stringify("Contraseña incorrecta"), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const usuarioId = result[0].id!;
        const token = await generarToken({ id: String(usuarioId), tipo: "usuario" });
        const maxAge = 60 * 60 * 24 * 7; // 7 días
        const cookie = `auth_token=${token}; Path=/; HttpOnly; Max-Age=${maxAge}; SameSite=Strict`;

        return new Response(JSON.stringify("Inicio de sesión exitoso"), {
          status: 200,
          headers: { "Set-Cookie": cookie, "Content-Type": "application/json" },
        });
      }

      return new Response("Tipo de usuario no válido", { status: 400 });
    } catch (err) {
      console.error("Failed to parse JSON body:", err);
      return new Response("Invalid JSON", { status: 400 });
    }
  },
};
