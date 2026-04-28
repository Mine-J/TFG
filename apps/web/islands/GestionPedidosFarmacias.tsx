import { useEffect, useState } from "preact/hooks";
import { PedidoConDetalle } from "@shared/types.ts";
import { FunctionalComponent } from "preact/src/index.d.ts";

export type path = {
  tipo: string;
};

export const GestionPedidosFarmacias: FunctionalComponent<path> = ({ tipo }) => {
  const [pedidos, setPedidos] = useState<PedidoConDetalle[]>([]);
  const [pedidoEnAccion, setPedidoEnAccion] = useState<string | null>(null);

  const cargarPedidos = async () => {
    const data: PedidoConDetalle[] = await fetch(
      `/api/farmacia/solicitudesFarmacia/pedidos?tipo=${tipo}`,
    ).then((res) => res.json());
    setPedidos(data);
  };

  const gestionarPedido = async (
    idPedido: string,
    accion: "aceptar" | "rechazar" | "finalizar",
    numeroPedido?: number,
  ) => {
    try {
      setPedidoEnAccion(idPedido);
      console.log(numeroPedido);
      const respuesta = await fetch(`/api/farmacia/solicitudesFarmacia/${accion}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_pedido: idPedido, numero_pedido: numeroPedido }),
      });

      if (!respuesta.ok) {
        const mensaje = await respuesta.text();
        throw new Error(mensaje || `No se pudo ${accion} el pedido`);
      }

      await cargarPedidos();
    } catch (error) {
      console.error(`Error al ${accion} pedido:`, error);
    } finally {
      setPedidoEnAccion(null);
    }
  };

  useEffect(() => {
    const eventSource = new EventSource("/api/farmacia/solicitudesFarmacia/SEE");

    eventSource.addEventListener("conectado", (event) => {
      console.log("SSE conectado", (event as MessageEvent).data);
    });

    eventSource.addEventListener("solicitudes_actualizadas", async (event) => {
      console.log("Pedidos actualizados", (event as MessageEvent).data);
      await cargarPedidos();
    });

    eventSource.addEventListener("error", (event) => {
      console.log("Error SSE", event);
    });

    cargarPedidos();

    return () => eventSource.close();
  }, []);

  return (
    <div class="contenedor-tarjetas">
      <h1>
        {tipo === "Pendiente"
          ? "Pedidos Pendientes"
          : tipo === "Aceptado"
          ? "Pedidos Aceptados"
          : "Pedidos Finalizados"}
      </h1>

      {pedidos.length === 0 && (
        <p class="tarjeta-vacia">
          No hay pedidos{" "}
          {tipo === "Pendiente" ? "pendientes" : tipo === "Aceptado" ? "aceptados" : "finalizados"}
        </p>
      )}

      {pedidos.map((pedido) => (
        <div key={pedido.id} class="tarjeta">
          <h2>Pedido #{pedido.numero_pedido}</h2>
          <div class="tarjeta-acciones">
            {tipo === "Pendiente" && (
              <>
                <button
                  type="button"
                  class="btn-accion btn-exito"
                  disabled={pedidoEnAccion === pedido.id}
                  onClick={() => gestionarPedido(pedido.id, "aceptar", pedido.numero_pedido)}
                >
                  {pedidoEnAccion === pedido.id ? "Procesando..." : "Aceptar"}
                </button>
                <button
                  type="button"
                  class="btn-accion btn-peligro"
                  disabled={pedidoEnAccion === pedido.id}
                  onClick={() => gestionarPedido(pedido.id, "rechazar", pedido.numero_pedido)}
                >
                  {pedidoEnAccion === pedido.id ? "Procesando..." : "Rechazar"}
                </button>
              </>
            )}
            {tipo === "Aceptado" && (
              <>
                <button
                  type="button"
                  class="btn-accion btn-info"
                  disabled={pedidoEnAccion === pedido.id}
                  onClick={() => gestionarPedido(pedido.id, "finalizar")}
                >
                  {pedidoEnAccion === pedido.id ? "Procesando..." : "Finalizar"}
                </button>
              </>
            )}
          </div>

          {pedido.productos.map((producto) => {
            const detalle = producto.detalle;
            if (!detalle) {
              return (
                <div key={producto.nregistro} class="tarjeta-item">
                  <p>Producto {producto.nregistro} sin detalle disponible.</p>
                </div>
              );
            }

            return (
              <div key={producto.nregistro} class="tarjeta-item">
                <p>
                  <strong>Nombre:</strong> {detalle.nombre}
                </p>
                <p>
                  <strong>Laboratorio titular:</strong> {detalle.labtitular}
                </p>
                <p>
                  <strong>Codigo Nacional:</strong> {detalle.presentaciones?.length
                    ? detalle.presentaciones[0].cn
                    : "No disponible"}
                </p>
                <p>
                  <strong>Cantidad:</strong> {producto.cantidad}
                </p>
                <p>
                  <strong>Bioequivalente solicitado por usuario:</strong>{" "}
                  <span
                    class={producto.bioequivalente
                      ? "insignia insignia-exito"
                      : "insignia insignia-peligro"}
                  >
                    {producto.bioequivalente ? "Sí" : "No"}
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
