import { FreshContext, Handlers } from "$fresh/server.ts";
import { query } from "@tfg/database/connection";
import { JWTHeader } from "@shared/types.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const enviarCorreoRechazo = async (
  correoUsuario: string,
  numeroPedido: string | number,
) => {
  try {
    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_PASSWORD = Deno.env.get("GMAIL_PASSWORD");

    if (!GMAIL_USER || !GMAIL_PASSWORD) {
      console.error("Faltan variables de entorno GMAIL_USER/GMAIL_PASSWORD");
      return false;
    }

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
      to: correoUsuario,
      subject: `Tu pedido #${numeroPedido} no ha podido ser aceptado - FarmaFinder`,
      content: "auto",
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc3545;">No se ha podido aceptar tu pedido</h2>
                    <p>Tu pedido número <strong>#${numeroPedido}</strong> ha sido rechazado por todas las farmacias disponibles en el rango señalado.</p>
                    <p>Puedes intentarlo de nuevo más tarde o modificar el pedido para ampliar opciones.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
                    <p style="color: #666; font-size: 12px;">Saludos,<br>El equipo de FarmaFinder</p>
                </div>
            `,
    });

    await client.close();
    return true;
  } catch (error) {
    console.error("Error al enviar correo de rechazo:", error);
    return false;
  }
};

export const handler: Handlers = {
  POST: async (req: Request, ctx: FreshContext<JWTHeader>) => {
    const user = ctx.state.auth;
    if (!user || user.tipo !== "farmacia") {
      return new Response("No autorizado", { status: 401 });
    }

    const { id_pedido, numero_pedido } = await req.json();

    const rechazado: {
      id: string;
      usuario_id: string;
      farmacias_ids: string[] | null;
      farmacias_rechazadas: string[] | null;
    }[] = await query(
      `UPDATE pedidos
             SET farmacias_rechazadas = CASE
                 WHEN NOT ($1::uuid = ANY(farmacias_rechazadas)) THEN array_append(farmacias_rechazadas, $1::uuid)
                 ELSE farmacias_rechazadas
             END
             WHERE id = $2
             RETURNING id, usuario_id, farmacias_ids, farmacias_rechazadas`,
      [user.id, id_pedido],
    );

    if (rechazado.length === 0) {
      return new Response("Error al rechazar el pedido", { status: 500 });
    }

    const pedido = rechazado[0];

    if (pedido.farmacias_ids?.length === pedido.farmacias_rechazadas?.length) {
      await query(
        `UPDATE pedidos
             SET estado = 'Finalizado'
             WHERE id = $1
             RETURNING id, usuario_id, farmacias_ids, farmacias_rechazadas`,
        [id_pedido],
      );

      const usuario: { email: string }[] = await query(
        `SELECT email FROM usuarios WHERE id = $1`,
        [pedido.usuario_id],
      );

      if (usuario.length > 0) {
        const correo = usuario[0].email;
        const numeroPedido = numero_pedido ?? id_pedido;
        await enviarCorreoRechazo(correo, numeroPedido);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Pedido rechazado correctamente" }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  },
};
