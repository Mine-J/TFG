/** @jsxImportSource preact */
import { useEffect, useRef, useState } from "preact/hooks";
declare const mapboxgl: typeof import("npm:mapbox-gl");
import {
  PedidoConDirecciones,
  ProductoInfo,
  RespuestaMapaFarmacias,
  UsuarioHeader,
} from "@shared/types.ts";

export default function MapaFarmacias(Props: { datosUsuario: UsuarioHeader | null }) {
  const [tiempoCoche, setTiempoCoche] = useState<string | null>(null);
  const [tiempoAndando, setTiempoAndando] = useState<string | null>(null);
  const [pedidoRutaActivoId, setPedidoRutaActivoId] = useState<string | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [datosUsuario] = useState<UsuarioHeader | null>(Props.datosUsuario);
  const [estadoMapa, setEstadoMapa] = useState<RespuestaMapaFarmacias>({
    token: "",
    farmacias: [],
  });
  const [centroMapa, setCentroMapa] = useState<[number, number]>([-3.7038, 40.4168]);
  const [zoom, setZoom] = useState<number>(14);
  const [pedidosAceptadosoPendientes, setPedidosAceptadosoPendientes] = useState<
    PedidoConDirecciones[]
  >([]);
  const [pedidoExpandidoId, setPedidoExpandidoId] = useState<string | null>(null);
  const [detallesPedidoSeleccionado, setDetallesPedidoSeleccionado] = useState<ProductoInfo[]>([]);

  const getEstadoClase = (estado: string) => {
    const estadoNormalizado = estado.toLowerCase();
    if (estadoNormalizado === "aceptado") return "estado-aceptado";
    if (estadoNormalizado === "finalizado") return "estado-finalizado";
    if (estadoNormalizado === "cancelado") return "estado-cancelado";
    return "estado-pendiente";
  };

  const mostrarDetalles = async (pedido: PedidoConDirecciones) => {
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
    const cargarDatosMapa = async () => {
      try {
        const datosFarmacias: RespuestaMapaFarmacias = await fetch("/api/mapa/farmacias").then((
          res,
        ) => res.json());
        setEstadoMapa(datosFarmacias);

        if (datosUsuario) {
          setCentroMapa([datosUsuario.lng, datosUsuario.lat]);
        }
      } catch (error) {
        console.error("Error cargando datos del mapa:", error);
      }
    };
    fetch("/api/pedidos/obtenerPedidos")
      .then((res) => res.json())
      .then((data: PedidoConDirecciones[]) => {
        const pedidosAceptadosoPendientes = data
          .filter(
            (pedido) => pedido.pedido.estado === "Aceptado" || pedido.pedido.estado === "Pendiente",
          )
          .sort((a, b) => {
            if (a.pedido.estado === "Aceptado" && b.pedido.estado === "Pendiente") return -1;
            if (a.pedido.estado === "Pendiente" && b.pedido.estado === "Aceptado") return 1;
            return 0;
          });

        setPedidosAceptadosoPendientes(pedidosAceptadosoPendientes);
      });
    cargarDatosMapa();
  }, [datosUsuario]);

  useEffect(() => {
    const mapContainer = document.getElementById("mapa-farmacias");

    if (!mapContainer) return;
    if (!estadoMapa.token) return;

    const mapbox = mapboxgl as typeof mapboxgl & { accessToken: string };
    mapbox.accessToken = estadoMapa.token;

    const map = new mapboxgl.Map({
      container: mapContainer,
      style: "mapbox://styles/mapbox/streets-v12",
      center: centroMapa,
      zoom: zoom,
    });

    mapRef.current = map;

    const puntosFarmacias: mapboxgl.Marker[] = [];
    const farmaciasAceptadasIds = new Set(
      pedidosAceptadosoPendientes
        .filter((pedido) => pedido.pedido.estado === "Aceptado")
        .map((pedido) => pedido.pedido.farmacia_aceptadora_id)
        .filter((id): id is string => Boolean(id)),
    );

    map.on("load", () => {
      estadoMapa.farmacias.forEach((farmacia) => {
        const markerElement = document.createElement("div");
        const esFarmaciaAceptada = farmaciasAceptadasIds.has(farmacia.id);
        markerElement.style.fontSize = esFarmaciaAceptada ? "24px" : "20px";
        markerElement.style.cursor = "pointer";
        markerElement.textContent = esFarmaciaAceptada ? "⚕️" : "📍";

        const info = `
        <div style="font-size: 12px;">
        📍 ${farmacia.direccion}<br/>
        📞 ${farmacia.telefono}<br/>
        📫 ${farmacia.codigo_postal}<br/>
        🕧 ${farmacia.horario}
        </div>
      `;

        const localizacionFarmacia = new mapboxgl.Marker({ element: markerElement })
          .setLngLat([farmacia.lng, farmacia.lat])
          .setPopup(new mapboxgl.Popup({ offset: 20 }).setHTML(info))
          .addTo(map);

        puntosFarmacias.push(localizacionFarmacia);
      });

      if (datosUsuario) {
        const markerElement = document.createElement("div");
        markerElement.style.fontSize = "24px";
        markerElement.style.cursor = "pointer";
        markerElement.textContent = "🏠";

        const localizacionFarmacia = new mapboxgl.Marker({ element: markerElement })
          .setLngLat([datosUsuario.lng, datosUsuario.lat])
          .addTo(map);

        puntosFarmacias.push(localizacionFarmacia);
      }
    });

    return () => {
      puntosFarmacias.forEach((punto) => punto.remove());
      map.remove();
      mapRef.current = null;
    };
  }, [estadoMapa, centroMapa, zoom, pedidosAceptadosoPendientes]);

  const PedidoFiltradoMapa = (id: string) => {
    const pedidoSeleccionado = pedidosAceptadosoPendientes.find((p) => p.pedido.id === id);

    if (pedidoSeleccionado?.pedido.estado === "Aceptado") {
      const farmacia = estadoMapa.farmacias.find(
        (f) => f.id === pedidoSeleccionado.pedido.farmacia_aceptadora_id,
      );

      if (farmacia) {
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [farmacia.lng, farmacia.lat],
            zoom: 16,
            essential: true,
          });
          return;
        }

        setCentroMapa([farmacia.lng, farmacia.lat]);
        setZoom(16);
      }
    }
  };
  const mostrarRuta = async (pedidoId: string, id: string, movilidad: string) => {
    const farmacia = estadoMapa.farmacias.find((f) => f.id === id);
    if (!farmacia) return;
    const { ruta, tiempo } = await fetch(
      `/api/mapa/ruta?latFarmacia=${farmacia?.lat}&lngFarmacia=${farmacia?.lng}&latUsuario=${datosUsuario?.lat}&lngUsuario=${datosUsuario?.lng}&movilidad=${movilidad}`,
    ).then((res) => res.json());

    if (!ruta || !tiempo) {
      console.error("Error obteniendo informacion de la ruta");
      return;
    }
    setPedidoRutaActivoId(pedidoId);
    let tiempoEnHoras = 0;
    if (movilidad === "driving") {
      tiempoEnHoras = tiempo / 60;
      const horas = Math.floor(tiempoEnHoras);
      const minutos = Math.round((tiempoEnHoras - horas) * 60);
      setTiempoCoche(horas > 0 ? `${horas}h ${minutos}m` : `${minutos} min`);
      setTiempoAndando(null);
    } else if (movilidad === "walking") {
      tiempoEnHoras = tiempo / 60;
      const horas = Math.floor(tiempoEnHoras);
      const minutos = Math.round((tiempoEnHoras - horas) * 60);
      setTiempoAndando(horas > 0 ? `${horas}h ${minutos}m` : `${minutos} min`);
      setTiempoCoche(null);
    }
    if (mapRef.current) {
      const source = mapRef.current.getSource("ruta");
      if (source && "setData" in source) {
        (source as mapboxgl.GeoJSONSource).setData(ruta);
      } else {
        mapRef.current.addSource("ruta", {
          type: "geojson",
          data: ruta,
        });

        mapRef.current.addLayer({
          id: "ruta",
          type: "line",
          source: "ruta",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#0074D9",
            "line-width": 4,
            "line-dasharray": [2, 2],
          },
        });
      }
    }
  };

  return (
    <div class="mapa-farmacias-contenedor">
      {pedidosAceptadosoPendientes.length > 0 && (
        <div class="pedidos-aceptadoso-pendientes">
          <h1>Pedidos</h1>
          {pedidosAceptadosoPendientes.map((pedido) => (
            <div
              class="pedido-aceptado"
              key={pedido.pedido.id}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest("button")) return;
                PedidoFiltradoMapa(pedido.pedido.id);
              }}
            >
              <p>
                <strong>Pedido #{pedido.pedido.numero_pedido}</strong> -{" "}
                <span class={`pedido-estado ${getEstadoClase(pedido.pedido.estado)}`}>
                  {pedido.pedido.estado}
                </span>
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  mostrarDetalles(pedido);
                }}
              >
                {pedidoExpandidoId === pedido.pedido.id ? "Ocultar detalles" : "Mostrar detalles"}
              </button>
              {pedido.pedido.estado === "Aceptado" && (
                <div class="contenedor-botones-ruta">
                  <div class="ruta-opcion">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        mostrarRuta(
                          pedido.pedido.id,
                          pedido.pedido.farmacia_aceptadora_id || "",
                          "driving",
                        );
                      }}
                    >
                      🚗
                    </button>
                    {pedidoRutaActivoId === pedido.pedido.id && tiempoCoche !== null && (
                      <span class="tiempo-ruta">{tiempoCoche}</span>
                    )}
                  </div>
                  <div class="ruta-opcion">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        mostrarRuta(
                          pedido.pedido.id,
                          pedido.pedido.farmacia_aceptadora_id || "",
                          "walking",
                        );
                      }}
                    >
                      🚶
                    </button>
                    {pedidoRutaActivoId === pedido.pedido.id && tiempoAndando !== null && (
                      <span class="tiempo-ruta">{tiempoAndando}</span>
                    )}
                  </div>
                </div>
              )}
              {pedidoExpandidoId && detallesPedidoSeleccionado.length > 0 && (
                <ul>
                  {pedidoExpandidoId === pedido.pedido.id &&
                    detallesPedidoSeleccionado.map((producto) => (
                      <li key={producto.nregistro}>{producto.nombre}</li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        id="mapa-farmacias"
        class="mapa-farmacias"
      />
    </div>
  );
}
