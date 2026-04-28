import { FreshContext, Handlers } from "$fresh/server.ts";
import { JWTHeader, PedidoSSE } from "@shared/types.ts";
import { query } from "@tfg/database/connection";

export const handler: Handlers = {
  GET: (_req: Request, ctx: FreshContext<JWTHeader>) => {
    const user = ctx.state.auth;
    if (!user || user.tipo !== "farmacia") {
      return new Response("No autorizado", { status: 401 });
    }
    const farmaciaId = user.id;

    let intervalo: number | null = null;
    let estaAbierto = true;
    let ultimosPedidos = "";
    const encoder = new TextEncoder();

    const SSE = new ReadableStream({
      async start(controller) {
        const enviarEvento = (nombreEvento: string, data: unknown) => {
          if (!estaAbierto) return;
          controller.enqueue(
            encoder.encode(
              `event: ${nombreEvento}\n` +
                `data: ${JSON.stringify(data)}\n\n`,
            ),
          );
        };

        const revisarCambios = async () => {
          try {
            const pedidos = await query<PedidoSSE>(
              `
              SELECT
                id,
                estado,
                fecha_creacion,
                fecha_aceptacion,
                farmacia_aceptadora_id
              FROM pedidos
              WHERE
                (
                  estado = 'Pendiente'
                  AND $1 = ANY(farmacias_ids)
                )
                OR
                (
                  farmacia_aceptadora_id = $1
                  AND estado IN ('Aceptado', 'Finalizado')
                )
              ORDER BY fecha_creacion DESC
              `,
              [farmaciaId],
            );

            const actualesPedidos = JSON.stringify(pedidos.map((p) => ({
              id: p.id,
              estado: p.estado,
              fecha_creacion: p.fecha_creacion,
              fecha_aceptacion: p.fecha_aceptacion,
              farmacia_aceptadora_id: p.farmacia_aceptadora_id,
            })));

            if (actualesPedidos !== ultimosPedidos) {
              ultimosPedidos = actualesPedidos;
              enviarEvento("solicitudes_actualizadas", {
                ok: true,
              });
            }
          } catch (error) {
            console.error("Error en SSE solicitudes:", error);

            enviarEvento("error", {
              mensaje: "Error comprobando solicitudes",
            });
          }
        };

        if (!estaAbierto) return;
        enviarEvento("conectado", {
          ok: true,
          mensaje: "SSE conectado",
        });

        await revisarCambios();

        intervalo = setInterval(async () => {
          if (!estaAbierto) return;
          controller.enqueue(encoder.encode(`: Activo\n\n`));
          await revisarCambios();
        }, 3000) as unknown as number;
      },

      cancel() {
        estaAbierto = false;
        if (intervalo !== null) {
          clearInterval(intervalo);
        }
      },
    });

    return new Response(SSE, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  },
};
