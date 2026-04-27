import { FreshContext, Handlers } from "$fresh/server.ts";
import { query } from "@tfg/database/connection";
import type { Farmacia, Usuario } from "@shared/types.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
function generarTokenSeguro() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return toHex(hash);
}

export const handler: Handlers = {
  POST: async (req: Request, _ctx: FreshContext) => {
    try {
      const { email } = await req.json();

      const userUsuarios = await query<Usuario>(
        `SELECT id, email, nombre FROM usuarios WHERE email = $1 LIMIT 1`,
        [email],
      );

      const userFarmacias = await query<Farmacia>(
        `SELECT id, email, cif FROM farmacias WHERE email = $1 LIMIT 1`,
        [email],
      );

      if (userUsuarios.length === 0 && userFarmacias.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Si el correo existe, recibirás un enlace de recuperación",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      let user;
      let tipo: "usuarios" | "farmacias" = "usuarios";
      if (userFarmacias.length > 0) {
        user = userFarmacias[0];
        tipo = "farmacias";
      } else {
        user = userUsuarios[0];
      }

      const token = generarTokenSeguro();
      const tokenHasheado = await sha256(token);

      const id = tipo === "farmacias" ? "farmacia_id" : "usuario_id";

      await query(
        `
        INSERT INTO tokens_resetear_password (
          ${id},
          tipo_usuario,
          token_hasheado,
          expires_at
        ) VALUES (
          $1,
          $2,
          $3,
          CURRENT_TIMESTAMP + INTERVAL '15 minutes'
        )
      `,
        [user.id, tipo, tokenHasheado],
      );

      const enlaceRecuperacion =
        `http://localhost:8000/auth/restablecer-contraseña?token=${tokenHasheado}`;

      // Enviar email con Gmail SMTP
      const GMAIL_USER = Deno.env.get("GMAIL_USER"); // farmafinder@gmail.com
      const GMAIL_PASSWORD = Deno.env.get("GMAIL_PASSWORD"); // Contraseña de aplicación

      if (GMAIL_USER && GMAIL_PASSWORD) {
        try {
          const client = new SMTPClient({
            connection: {
              hostname: "smtp.gmail.com",
              port: 465,
              tls: true,
              auth: {
                username: GMAIL_USER,
                password: GMAIL_PASSWORD,
              },
            },
          });

          await client.send({
            from: GMAIL_USER,
            to: email,
            subject: "Recuperación de contraseña - FarmaFinder",
            content: "auto",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #007bff;">Hola ${
              tipo === "usuarios" ? userUsuarios[0].nombre : userFarmacias[0].email
            },</h2>
                <p>Has solicitado restablecer tu contraseña en FarmaFinder.</p>
                <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${enlaceRecuperacion}" 
                     style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
                            color: white;
                            padding: 14px 28px;
                            text-decoration: none;
                            border-radius: 8px;
                            display: inline-block;
                            font-weight: bold;">
                    Restablecer contraseña
                  </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                  Este enlace expirará en 15 minutos.
                </p>
                <p style="color: #666; font-size: 14px;">
                  Si no solicitaste este cambio, puedes ignorar este correo.
                </p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">
                  Saludos,<br>
                  El equipo de FarmaFinder
                </p>
              </div>
            `,
          });

          await client.close();
          console.log("Email enviado exitosamente");
        } catch (emailError) {
          console.error("Error al enviar email:", emailError);
          // Continuamos aunque falle el email
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Se ha enviado un enlace de recuperación a tu correo",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      console.error("Error en recuperación de contraseña:", error);
      return new Response(
        JSON.stringify({ error: "Error al procesar la solicitud" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
