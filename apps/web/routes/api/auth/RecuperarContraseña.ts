import { FreshContext, Handlers } from "$fresh/server.ts";
import { query } from "@tfg/database/connection";
import type { Usuario } from "@shared/types.ts";
import { create } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

export const handler: Handlers = {
  POST: async (req: Request, _ctx: FreshContext) => {
    try {
      const { email } = await req.json();

      const usuarios = await query<Usuario>(
        `SELECT id, email, nombre FROM usuarios WHERE email = $1 LIMIT 1`,
        [email],
      );

      if (usuarios.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Si el correo existe, recibirás un enlace de recuperación",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      const usuario = usuarios[0];

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

      const jwt = await create(
        { alg: "HS256", typ: "JWT" },
        {
          id: usuario.id,
          tipo: "recuperacion",
          exp: Math.floor(Date.now() / 1000) + (60 * 15),
        },
        key,
      );

      // Generar enlace de recuperación
      const enlaceRecuperacion = `http://localhost:8000/auth/restablecer-contraseña?token=${jwt}`;

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
                <h2 style="color: #007bff;">Hola ${usuario.nombre},</h2>
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
