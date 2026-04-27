import { FreshContext, Handlers } from "$fresh/server.ts";
import { query } from "@tfg/database/connection";
import { verificarToken } from "../../../../../packages/shared/jwt.ts";
import Axios from "npm:axios@^1.6.0";

type DireccionYCp = {
  direccion: string;
  codigo_postal: string;
  lat: number;
  lng: number;
}[];

export const handler: Handlers = {
  POST: async (req: Request, _ctx: FreshContext) => {
    const cookie = req.headers.get("Cookie");
    const authToken = cookie?.split(";")
      .find((c) => c.trim().startsWith("auth_token="))
      ?.split("=")[1];

    if (!authToken) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = await verificarToken(authToken);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.json();
      const { id, cif, nombre, apellidos, email, telefono, direccion, codigo_postal, tipo } = body;

      const tipoBBDD = tipo === "farmacia" ? "farmacias" : "usuarios";

      // Verificar si el email ya existe en otro usuario
      const emailExistente = await query(
        `SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1) AND id != $2
         UNION
         SELECT id FROM farmacias WHERE LOWER(email) = LOWER($1) AND id != $2
         LIMIT 1`,
        [email, id],
      );

      if (emailExistente.length > 0) {
        return new Response(
          JSON.stringify({ error: "El email ya está en uso" }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const cifExistente = await query(
        `SELECT id FROM farmacias WHERE cif = $1 AND id != $2 LIMIT 1`,
        [cif, id],
      );

      if (cifExistente.length > 0) {
        return new Response(
          JSON.stringify({ error: "El CIF ya está en uso" }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Obtener datos actuales del usuario
      const datosActuales: DireccionYCp = tipoBBDD === "usuarios"
        ? await query(
          `SELECT direccion, codigo_postal, lat, lng FROM usuarios WHERE id = $1`,
          [id],
        )
        : await query(
          `SELECT direccion, codigo_postal, lat, lng FROM farmacias WHERE id = $1`,
          [id],
        );

      if (datosActuales.length === 0) {
        return new Response(
          JSON.stringify({ error: "Usuario no encontrado" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      let lat, lng;

      // Solo hacer geocoding si cambia la dirección o el código postal
      if (
        datosActuales.length > 0 &&
        (datosActuales[0].direccion !== direccion ||
          datosActuales[0].codigo_postal !== codigo_postal)
      ) {
        const resultadoGeocoding = await Axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${direccion} ${codigo_postal}.json?access_token=${
            Deno.env.get("MAPBOX_API_KEY")
          }`,
        );
        lat = resultadoGeocoding.data.features[0].center[1];
        lng = resultadoGeocoding.data.features[0].center[0];
      } else {
        // Mantener las coordenadas actuales
        lat = datosActuales[0].lat;
        lng = datosActuales[0].lng;
      }
      if (!telefono.startsWith("+")) {
        return new Response(
          JSON.stringify({ error: "El teléfono debe incluir el código de país (ej. +34)" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      const api_Key = Deno.env.get("API_KEY");
      const responseTelefono = await (Axios.get(
          "https://api.api-ninjas.com/v1/validatephone?number=" + body.telefono,
          { headers: { "X-Api-Key": api_Key } },
        ));
        if (!responseTelefono.data.is_valid) {
          return new Response(JSON.stringify({ error: "El número de teléfono no es válido" }), {
            status: 400,
          });
        }

      // Actualizar los datos del usuario
      if (tipoBBDD === "usuarios") {
        await query(
          `UPDATE usuarios 
           SET nombre = $1, apellidos = $2, email = $3, telefono = $4, direccion = $5, codigo_postal = $6, updated_at = CURRENT_TIMESTAMP, lat = $8, lng = $9
           WHERE id = $7`,
          [
            nombre,
            apellidos,
            email,
            telefono,
            direccion,
            codigo_postal,
            id,
            lat,
            lng,
          ],
        );
      } else {
        await query(
          `UPDATE farmacias 
           SET cif = $1, email = $2, telefono = $3, direccion = $4, codigo_postal = $5, updated_at = CURRENT_TIMESTAMP, lat = $7, lng = $8
           WHERE id = $6`,
          [
            cif,
            email,
            telefono,
            direccion,
            codigo_postal,
            id,
            lat,
            lng,
          ],
        );
      }

      return new Response(
        JSON.stringify({ mensaje: "Datos actualizados correctamente" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Error al actualizar datos:", error);
      return new Response(
        JSON.stringify({ error: "Error al actualizar los datos" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
