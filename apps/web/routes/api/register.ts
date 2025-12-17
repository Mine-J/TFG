import { query } from "../../../../packages/database/connection.ts"; // tu conexión
import { FreshContext, Handlers } from "$fresh/server.ts";
// deno-lint-ignore no-unversioned-import
import Axios from "npm:axios";
import type { Farmacia, Usuario } from "../../../../packages/shared/types.ts";
import { generarToken } from "../../../../packages/shared/jwt.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

export const handler: Handlers = {
  POST: async (req: Request, ctx: FreshContext) => {
    try {
      const body = await req.json();
      const api_Key = Deno.env.get("API_KEY");
      if (!api_Key) {
        console.warn("No se encontró API_KEY en .env");
        return new Response(JSON.stringify("Configuración faltante"), { status: 500 });
      }

      if (body.tipo === "usuario") {
        const email = body.email.toLowerCase();
        const row = await query(`SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1`, [
          email,
        ]);

        if (row.length > 0) {
          // ya existe un usuario con ese gmail
          console.log("Usuario ya registrado con ese Email");
          return new Response(JSON.stringify("Usuario ya registrado con ese Email"), {
            status: 409,
          });
        }

        const responseTelefono = await (Axios.get(
          "https://api.api-ninjas.com/v1/validatephone?number=" + body.telefono,
          { headers: { "X-Api-Key": api_Key } },
        ));
        console.log(responseTelefono.data.error);
        if (!responseTelefono.data.is_valid) {
          console.log("El número de teléfono no es válido");
          return new Response(JSON.stringify("El número de teléfono no es válido"), {
            status: 400,
          });
        }

        // Hashear la contraseña
        const passwordHash = await bcrypt.hash(body.password);

        const insertResult: Usuario[] = await query(
          `INSERT INTO usuarios (email, password_hash, nombre, apellidos, telefono, direccion, codigo_postal) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [
            email,
            passwordHash,
            body.nombre,
            body.apellidos,
            body.telefono,
            body.direccion,
            body.cp,
          ],
        );

        if (insertResult.length > 0) {
          console.log("Usuario añadido con exito");
          const usuarioId = insertResult[0].id!;

          // Generar JWT
          const token = await generarToken({ id: String(usuarioId), tipo: "usuario" });
          const maxAge = 60 * 60 * 24 * 7; // 7 días
          const cookie =
            `auth_token=${token}; Path=/; HttpOnly; Max-Age=${maxAge}; SameSite=Strict`;

          return new Response(JSON.stringify("Usuario añadido con exito"), {
            status: 201,
            headers: { "Set-Cookie": cookie },
          });
        } else {
          console.warn("Error con la insercion");
        }

        // si no existe, continúa con el registro
      } else if (body.tipo === "farmacia") {
        const cif = body.cif;
        const rowCif = await query(`SELECT id FROM farmacias WHERE cif = '${cif}' LIMIT 1`);

        if (rowCif.length > 0) {
          // ya existe una farmacia con ese cif
          return new Response(JSON.stringify("Farmacia ya registrada"), { status: 409 });
        }

        const responseTelefono = await (Axios.get(
          "https://api.api-ninjas.com/v1/validatephone?number=" + body.telefono,
          { headers: { "X-Api-Key": api_Key } },
        ));

        if (!responseTelefono.data.is_valid) {
          console.log("El número de teléfono no es válido");
          return new Response(JSON.stringify("El número de teléfono no es válido"), {
            status: 400,
          });
        }

        // Hashear la contraseña
        const passwordHash = await bcrypt.hash(body.password);

        const insertResultFarmacia: Farmacia[] = await query(
          `INSERT INTO farmacias (cif, password_hash, direccion, codigo_postal, telefono) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [body.cif, passwordHash, body.direccion, body.cp, body.telefono],
        );

        if (insertResultFarmacia.length > 0) {
          console.log("Farmacia añadida con exito");
          const farmaciaId = insertResultFarmacia[0].id!;

          // Generar JWT
          const token = await generarToken({ id: String(farmaciaId), tipo: "farmacia" });
          const maxAge = 60 * 60 * 24 * 7; // 7 días
          const cookie =
            `auth_token=${token}; Path=/; HttpOnly; Max-Age=${maxAge}; SameSite=Strict`;

          return new Response(JSON.stringify("Farmacia añadida con exito"), {
            status: 201,
            headers: {
              "Set-Cookie": cookie,
              "Content-Type": "application/json",
            },
          });
        } else {
          console.warn("Error con la insercion de farmacia");
        }
      }

      ctx.state.payload = body;
    } catch (err) {
      console.error("Error:", err);
      return new Response("Error al procesar la solicitud", { status: 400 });
    }

    return new Response(JSON.stringify({ error: "Tipo no válido" }), { status: 400 });
  },
};
