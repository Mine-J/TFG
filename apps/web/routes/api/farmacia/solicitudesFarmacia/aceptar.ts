import { FreshContext, Handlers } from "$fresh/server.ts";
import { query } from "@tfg/database/connection";
import { JWTHeader } from "@shared/types.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const enviarCorreoAceptacion = async (
  correoUsuario: string,
  numeroPedido: string | number,
  direccionFarmacia: string,
  telefonoFarmacia: string,
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
      subject: `Tu pedido #${numeroPedido} ha sido aceptado - FarmaFinder`,
      content: "auto",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">Tu pedido ha sido aceptado</h2>
          <p>Tu pedido número <strong>#${numeroPedido}</strong> ha sido aceptado por la farmacia:</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 4px 0;"><strong>Calle:</strong> ${direccionFarmacia}</p>
            <p style="margin: 4px 0;"><strong>Teléfono:</strong> ${telefonoFarmacia}</p>
          </div>
          <p>Puedes consultar el estado del pedido desde tu cuenta.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
          <p style="color: #666; font-size: 12px;">Saludos,<br>El equipo de FarmaFinder</p>
        </div>
      `,
    });

    await client.close();

    return true;
  } catch (error) {
    console.error("Error al enviar correo:", error);
    // No lanzar error, el pedido se acepta aunque falle el correo
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
    const aceptado: { id: string; usuario_id: string }[] = await query(
      `UPDATE pedidos SET estado = 'Aceptado', fecha_aceptacion = CURRENT_TIMESTAMP, farmacia_aceptadora_id = $2 WHERE id = $1 RETURNING id, usuario_id`,
      [id_pedido, user.id],
    );
    if (aceptado.length === 0) {
      return new Response("Error al aceptar el pedido", { status: 500 });
    }

    const usuario_id = aceptado[0].usuario_id;
    const usuario: { email: string }[] = await query(`SELECT email FROM usuarios WHERE id = $1`, [
      usuario_id,
    ]);
    if (usuario.length === 0) {
      return new Response("Error al obtener el correo del usuario", { status: 500 });
    }

    const correo = usuario[0].email;

    const direccionCompleta = user.direccion ?? "Dirección no disponible";
    const telefono = user.telefono ?? "No disponible";
    const numeroPedido = numero_pedido ?? numero_pedido;

    // Enviar correo
    await enviarCorreoAceptacion(
      correo,
      numeroPedido,
      direccionCompleta,
      telefono,
    );

    return new Response(
      JSON.stringify({ success: true, message: "Pedido aceptado correctamente" }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  },
};
