import { FunctionalComponent } from "preact/src/index.d.ts";
import { useEffect, useState } from "preact/hooks";
import { CestaProducto, ProductoConDetalle, ProductoInfo, Usuario } from "@shared/types.ts";

export const CestaComponent: FunctionalComponent = () => {
  const [productos, setProductos] = useState<ProductoConDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [user, setUser] = useState<Usuario | null>(null);
  const [distancia, setDistancia] = useState<number>(1);

  const handleHacerPedido = () => {
    fetch("/api/cesta/realizarPedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario_id: user?.id,
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
        }
      })
      .catch((err) => {
        console.error("Error al hacer el pedido:", err);
      });
  };

  useEffect(() => {
    const fetchCesta = async () => {
      try {
        const res = await fetch("/api/Datos/obtenerDatos");
        const userData = await res.json();
        setUser(userData);
        if (userData?.id) {
          const response = await fetch(`/api/cesta/${userData.id}`);
          if (response.ok) {
            const cesta = await response.json();

            // Para cada producto en la cesta, obtener sus detalles
            const productosConDetalle = await Promise.all(
              cesta.productos.map(async (prod: CestaProducto) => {
                try {
                  const respuesta = await fetch(`/api/producto/${prod.nregistro}`);
                  if (respuesta.ok) {
                    const detalle: ProductoInfo = await respuesta.json();

                    return {
                      nregistro: prod.nregistro,
                      cantidad: prod.cantidad,
                      detalle: detalle,
                    };
                  } else {
                    return {
                      nregistro: prod.nregistro,
                      cantidad: prod.cantidad,
                      detalle: null,
                    };
                  }
                } catch (err) {
                  console.error(`Error al obtener producto ${prod.nregistro}:`, err);
                  return {
                    nregistro: prod.nregistro,
                    cantidad: prod.cantidad,
                    detalle: null,
                  };
                }
              }),
            );

            setProductos(productosConDetalle);
            setCargando(false);
          }
        }
      } catch (err) {
        console.error("Error al obtener la cesta:", err);
        setCargando(false);
      }
    };

    fetchCesta();
  }, []);

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

  return (
    <div class="cesta-contenedor">
      <h1>Mi Cesta</h1>
      <div class="cesta-layout">
        <div class="cesta-productos">
          {productos.length === 0 ? <p>No hay productos en la cesta</p> : (
            <div class="cesta-lista">
              {productos.map((prod) => {
                if (!prod.detalle) return null;

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
                    setDistancia(parseInt(e.currentTarget.value));
                  }}
                />
                <span class="info-usuario-input-suffix">km</span>
              </div>
            </div>
            <button type="submit" class="btn-hacer-pedido" onClick={handleHacerPedido}>
              Hacer Pedido
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
