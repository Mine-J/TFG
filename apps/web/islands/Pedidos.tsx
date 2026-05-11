import { useEffect, useState } from "preact/hooks";
import { FunctionalComponent } from "preact/src/index.d.ts";
import { EstadoPedido, PedidoConDirecciones, ProductoInfo } from "@shared/types.ts";

export const Pedidos: FunctionalComponent = () => {
  const [pedidos, setPedidos] = useState<PedidoConDirecciones[]>([]);
  const [pedidoExpandidoId, setPedidoExpandidoId] = useState<string | null>(null);
  const [detallesPedidoSeleccionado, setDetallesPedidoSeleccionado] = useState<ProductoInfo[]>([]);

  const cargarPedidos = async () => {
    try {
      const res = await fetch("/api/pedidos/obtenerPedidos");
      const data = await res.json();
      setPedidos(data);
    } catch (err) {
      console.error("Error al obtener pedidos:", err);
    }
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const getEstadoClase = (estado?: EstadoPedido) => {
    const estadoNormalizado = (estado || "Pendiente").toLowerCase();
    if (estadoNormalizado === "aceptado") return "estado-aceptado";
    if (estadoNormalizado === "finalizado") return "estado-finalizado";
    if (estadoNormalizado === "cancelado") return "estado-cancelado";
    return "estado-pendiente";
  };

  const cancelarPedido = async (pedidoId: string) => {
    try {
      await fetch("/api/pedidos/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido_id: pedidoId }),
      });

      setPedidos((prev) =>
        prev.map((pedido) =>
          pedido.pedido.id === pedidoId
            ? { ...pedido, pedido: { ...pedido.pedido, estado: "Cancelado" } }
            : pedido
        )
      );
    } catch (err) {
      console.error("Error al cancelar pedido:", err);
    }
  };

  const repetirPedido = async (pedidoId: string) => {
    try {
      await fetch("/api/pedidos/repetir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido_id: pedidoId }),
      });

      globalThis.location.href = "/cesta";
    } catch (err) {
      console.error("Error al repetir pedido:", err);
    }
  };

  const getDireccionFarmaciaAceptada = (pedido: PedidoConDirecciones) => {
    if (!pedido.pedido.farmacia_aceptadora_id) return null;
    const index = pedido.pedido.farmacias_ids.findIndex((id) =>
      id === pedido.pedido.farmacia_aceptadora_id
    );
    return pedido.direcciones_farmacias?.[index];
  };

  const mostrarDetalles = async (pedido: PedidoConDirecciones) => {
    // esto es para ocultar los detalles
    if (pedidoExpandidoId === pedido.pedido.id) {
      setPedidoExpandidoId(null);
      setDetallesPedidoSeleccionado([]);
      return;
    }

    setPedidoExpandidoId(pedido.pedido.id);

    const resultados = await Promise.all(
      pedido.pedido.productos.map(async (productoPedido) => {
        try {
          const res = await fetch(`/api/producto/${productoPedido.nregistro}`);
          if (!res.ok) return null;
          const detalle: ProductoInfo = await res.json();
          return detalle;
        } catch (err) {
          console.error(`Error cargando detalle ${productoPedido.nregistro}:`, err);
          return null;
        }
      }),
    );
    const productosConDetalle = resultados.filter((res): res is ProductoInfo => res !== null);
    setDetallesPedidoSeleccionado(productosConDetalle);
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  const pedidoSeleccionado = pedidos.find((p) => p.pedido.id === pedidoExpandidoId) || null;

  return (
    <div class="cesta-contenedor">
      <h1>Mis pedidos</h1>

      <div class="pedidos-layout">
        {pedidoSeleccionado && (
          <div class="pedido-detalles-global">
            <div class="pedido-detalles">
              {(pedidoSeleccionado.pedido.estado === "Aceptado" || pedidoSeleccionado.pedido.estado === "Finalizado") && (
                <div class="pedido-detalles-farmacias pedido-detalles-aceptada">
                  <h4>Farmacia aceptada</h4>
                  <p class="pedido-farmacia-aceptada">
                    {getDireccionFarmaciaAceptada(pedidoSeleccionado)}
                  </p>
                </div>
              )}

              <div class="pedido-detalles-farmacias">
                <h4>Farmacias solicitadas</h4>
                {pedidoSeleccionado.direcciones_farmacias &&
                  (
                    <ul>
                      {pedidoSeleccionado.direcciones_farmacias.map((direccion, index) => (
                        <li key={`${pedidoSeleccionado.pedido.id}-farmacia-${index}`}>
                          {direccion}
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
            </div>
          </div>
        )}
        <div class="cesta-productos">
          {pedidos && (
            <div class="cesta-lista">
              {pedidos.map((pedido) => {
                const estado = pedido.pedido.estado;
                const farmaciasSolicitadas = pedido.direcciones_farmacias.length;

                return (
                  <div key={pedido.pedido.id} class="pedido-bloque">
                    <div class="cesta-item pedido-item">
                      <div class="pedido-item-contenido">
                        <div class="cesta-item-info pedido-item-info">
                          <h3>Pedido #{pedido.pedido.numero_pedido}</h3>
                          <p>Creado: {formatearFecha(pedido.pedido.fecha_creacion)}</p>
                          <p>
                            Estado:{" "}
                            <span class={`pedido-estado ${getEstadoClase(estado)}`}>{estado}</span>
                          </p>
                          <p>Solicitado a {farmaciasSolicitadas} farmacias</p>
                        </div>

                        <div class="pedido-item-acciones">
                          <button
                            type="button"
                            class="pedido-btn pedido-btn-repetir"
                            onClick={() => repetirPedido(pedido.pedido.id)}
                          >
                            Repetir pedido
                          </button>
                          <button
                            type="button"
                            class="pedido-btn pedido-btn-cancelar"
                            onClick={() => cancelarPedido(pedido.pedido.id)}
                            disabled={estado === "Cancelado" || estado === "Finalizado"}
                          >
                            Cancelar pedido
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        class="pedido-btn pedido-btn-mostrar"
                        onClick={() => mostrarDetalles(pedido)}
                      >
                        {pedidoExpandidoId === pedido.pedido.id
                          ? "Ocultar detalles"
                          : "Mostrar detalles"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {pedidoSeleccionado && (
          <div class="pedido-detalles-global">
            <div class="pedido-detalles">
              <div class="pedido-detalles-productos">
                <h4>Productos del pedido</h4>
                {
                  <div class="pedido-productos-lista">
                    {detallesPedidoSeleccionado.map((producto) => {
                      const cantidad = pedidoSeleccionado.pedido.productos.find((p) =>
                        p.nregistro === producto.nregistro
                      )?.cantidad;

                      return (
                        <a
                          key={`${pedidoSeleccionado.pedido.id}-${producto.nregistro}`}
                          href={`/producto/${producto.nregistro}`}
                          class="pedido-producto-card"
                        >
                          <img
                            src={producto.fotos?.[0]?.url}
                            alt={producto.nombre}
                            class="pedido-producto-img"
                          />
                          <div class="pedido-producto-info">
                            <h5>{producto.nombre}</h5>
                            <p>Cantidad pedida: {cantidad}</p>
                            <p>
                              {producto.formaFarmaceutica?.nombre} {producto.dosis}
                            </p>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
