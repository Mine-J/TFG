import { useEffect, useState } from "preact/hooks";
import { ProductoConDetalle, UsuarioHeader } from "@shared/types.ts";
import { FunctionalComponent } from "preact/src/index.d.ts";

type Props = {
  datosUsuario: UsuarioHeader | null;
};

export const CestaComponent: FunctionalComponent<Props> = ({ datosUsuario }: Props) => {
  const [productos, setProductos] = useState<ProductoConDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [user] = useState<UsuarioHeader | null>(datosUsuario);
  const [distancia, setDistancia] = useState<number>(1);
  const [haciendoPedido, setHaciendoPedido] = useState(false);

  const handleHacerPedido = () => {
    setHaciendoPedido(true);
    fetch("/api/cesta/realizarPedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario_id: user?.id,
        usuarioLat: user?.lat,
        usuarioLon: user?.lng,
        distancia_maxima: distancia,
      }),
    })
      .then((res) => {
        if (res.ok) {
          globalThis.location.href = "/";
        } else {
          if (res.status === 404) {
            alert("No hay farmacias en el rango especificado.");
          } else {
            alert("Error al hacer el pedido. Por favor, inténtalo de nuevo.");
          }
          setHaciendoPedido(false);
        }
      })
      .catch((err) => {
        console.error("Error al hacer el pedido:", err);
        setHaciendoPedido(false);
      });
  };

  useEffect(() => {
    const fetchCesta = async () => {
      try {
        if (user?.id) {
          const response = await fetch(`/api/cesta/${user.id}`);
          if (response.ok) {
            // Para cada producto en la cesta, obtener sus detalles
            const productosConDetalle: ProductoConDetalle[] = await fetch(
              `/api/producto/productosCesta`,
            ).then((res) => res.json());

            setProductos(productosConDetalle);
            setCargando(false);
          }
        } else {
          setCargando(false);
        }
      } catch (err) {
        console.error("Error al obtener la cesta:", err);
        setCargando(false);
      }
    };

    fetchCesta();
  }, [user?.id]);

  if (cargando) {
    return <div>Cargando cesta...</div>;
  }

  const eliminarProducto = async (nregistro: string) => {
    try {
      if (user?.id) {
        await fetch("/api/cesta/añadir", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuario_id: user.id,
            producto: { nregistro, cantidad: 1 },
          }),
        });

        globalThis.dispatchEvent(
          new CustomEvent("cesta:actualizada", {
            detail: { delta: -1 },
          }),
        );

        setProductos(productos.filter((p) => p.nregistro !== nregistro));

        if (productos.length === 1) {
          globalThis.location.href = "/";
        }
      }
    } catch (err) {
      console.error("Error al eliminar:", err);
    }
  };

  const cambiarCantidad = async (nregistro: string, cambio: number) => {
    try {
      if (user?.id) {
        await fetch("/api/cesta/actualizarCantidad", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuario_id: user.id,
            nregistro,
            cambio, // +1 o -1
          }),
        });

        setProductos(
          productos.map((p) => {
            if (p.nregistro === nregistro) {
              const nuevaCantidad = p.cantidad + cambio;
              return { ...p, cantidad: nuevaCantidad };
            }
            return p;
          }).filter(Boolean) as ProductoConDetalle[],
        );
      }
    } catch (err) {
      console.error("Error al cambiar cantidad:", err);
    }
  };

  const checkBioequivalente = async (nregistro: string, bioequivalente: boolean) => {
    try {
      if (user?.id) {
        await fetch("/api/cesta/checkBioequivalente", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuario_id: user.id,
            nregistro,
            bioequivalente,
          }),
        });

        setProductos(
          productos.map((p) => {
            if (p.nregistro === nregistro) {
              return { ...p, bioequivalente: !p.bioequivalente };
            }
            return p;
          }).filter(Boolean) as ProductoConDetalle[],
        );
      }
    } catch (err) {
      console.error("Error al cambiar bioequivalente:", err);
    }
  };

  return (
    <div class="cesta-contenedor">
      <h1>Mi Cesta</h1>
      <div class="cesta-layout">
        <div class="cesta-productos">
          {productos.length === 0 ? <p>No hay productos en la cesta</p> : (
            <div class="cesta-lista">
              {productos.map((prod) => {
                if (!prod.detalle) return null;
                {
                  console.log(prod);
                }
                return (
                  <div key={prod.nregistro} class="cesta-item">
                    <img
                      src={prod.detalle.fotos?.[0]?.url}
                      alt={prod.detalle.nombre}
                      class="cesta-item-img"
                    />
                    <div class="cesta-item-info">
                      <h3>{prod.detalle.nombre}</h3>
                      <p>{prod.detalle.formaFarmaceutica.nombre}</p>
                      <p>{prod.detalle.dosis}</p>
                    </div>

                    <div class="cesta-item-controles">
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(prod.nregistro, -1)}
                        class="cesta-item-boton"
                        disabled={prod.cantidad <= 1}
                      >
                        -
                      </button>
                      <span class="cesta-item-cantidad">{prod.cantidad}</span>
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(prod.nregistro, 1)}
                        class="cesta-item-boton"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarProducto(prod.nregistro)}
                      class="cesta-item-eliminar"
                    >
                      🗑️
                    </button>
                    <div class="bioequivalente-class">
                      <label class="bioequivalente-label" for={`bioequivalente-${prod.nregistro}`}>
                        BIOEQUIVALENTE
                      </label>
                      <input
                        class="bioequivalente-checkbox"
                        type="checkbox"
                        id={`bioequivalente-${prod.nregistro}`}
                        checked={prod.bioequivalente}
                        onClick={() => checkBioequivalente(prod.nregistro, !prod.bioequivalente)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {user && (
          <div class="cesta-info-usuario">
            <h2>Información de entrega</h2>
            <div class="info-usuario-campo">
              <span class="info-usuario-label">Nombre y apellidos:</span>
              <span class="info-usuario-valor">{user.nombre} {user.apellidos}</span>
            </div>
            <div class="info-usuario-campo">
              <span class="info-usuario-label">Email:</span>
              <span class="info-usuario-valor">{user.email}</span>
            </div>
            <div class="info-usuario-campo">
              <span class="info-usuario-label">Teléfono:</span>
              <span class="info-usuario-valor">{user.telefono}</span>
            </div>
            <div class="info-usuario-campo">
              <span class="info-usuario-label">Dirección:</span>
              <span class="info-usuario-valor">{user.direccion}</span>
            </div>
            <div class="info-usuario-campo">
              <span class="info-usuario-label">Código Postal:</span>
              <span class="info-usuario-valor">{user.codigo_postal}</span>
            </div>
            <div class="info-usuario-campo">
              <span class="info-usuario-label">Distancia de busqueda:</span>
              <div class="info-usuario-input-container">
                <input
                  type="number"
                  value={distancia}
                  class="info-usuario-input"
                  onChange={(e) => {
                    setDistancia(parseFloat(e.currentTarget.value));
                  }}
                />
                <span class="info-usuario-input-suffix">km</span>
              </div>
            </div>
            <button
              type="submit"
              class="btn-hacer-pedido"
              onClick={handleHacerPedido}
              disabled={haciendoPedido}
            >
              {haciendoPedido ? "Cargando..." : "Hacer Pedido"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
