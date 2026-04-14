import { FreshContext, Handlers } from "$fresh/server.ts";
import { query } from "@tfg/database/connection";
import { verificarToken } from "../../../../../packages/shared/jwt.ts";
import axios from "npm:axios@^1.6.0";

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
      const { nombre, apellidos, email, telefono, direccion, codigo_postal } = body;

      // Verificar si el email ya existe en otro usuario
      const emailExistente = await query(
        `SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1) AND id != $2 LIMIT 1`,
        [email, payload.id],
      );

      if (emailExistente.length > 0) {
        return new Response(
          JSON.stringify({ error: "El email ya está en uso por otro usuario" }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      // Obtener datos actuales del usuario
      const datosActuales: DireccionYCp = await query(
        `SELECT direccion, codigo_postal, lat, lng FROM usuarios WHERE id = $1`,
        [payload.id],
      );

      let lat, lng;

      // Solo hacer geocoding si cambia la dirección o el código postal
      if (
        datosActuales.length > 0 &&
        (datosActuales[0].direccion !== direccion ||
          datosActuales[0].codigo_postal !== codigo_postal)
      ) {
        const resultadoGeocoding = await axios.get(
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

      // Actualizar los datos del usuario
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
          payload.id,
          lat,
          lng,
        ],
      );

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
