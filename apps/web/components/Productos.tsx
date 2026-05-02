import { FunctionalComponent } from "preact/src/index.d.ts";
import { Cesta, RespuestaAPIProducto } from "@shared/types.ts";
import { BotonSolicitarProducto } from "../islands/BotonSolicitarProducto.tsx";

type ProductosProps = {
  productos: RespuestaAPIProducto;
  productosEnCesta: Cesta | null;
  usuario_id: string | null;
};

export const Productos: FunctionalComponent<ProductosProps> = ({ productos, productosEnCesta, usuario_id }) => {
  const totalPaginas = Math.floor(productos.totalFilas / 200) + 1;
  return (
    <div>
      {productos.resultados && productos.resultados.length > 0
        ? (
          <>
            <div class="pagina-productos">
              {productos.resultados.map((producto) => (
                <div key={producto.nregistro} class="producto">
                  <a href={`/producto/${producto.nregistro}`}>
                    <img src={producto.fotos?.[0]?.url} alt={producto.nombre} />
                    <h2>{producto.nombre}</h2>
                  </a>
                  {producto.comerc && producto.cpresc !== "Uso Hospitalario" && (
                    <BotonSolicitarProducto
                      nregistro={producto.nregistro}
                      productoEnCesta={productosEnCesta?.productos.some((p) =>
                        p.nregistro === producto.nregistro
                      ) ?? false}
                      usuario_id={usuario_id}
                    />
                  )}
                </div>
              ))}
            </div>

            <div class="paginacion">
              {productos.pagina > 1 && (
                <a href={`/productos?page=${productos.pagina - 1}`} class="boton-pagina">
                  Anterior
                </a>
              )}

              <span class="info-pagina">
                Página {productos.pagina} de {totalPaginas}
              </span>

              {productos.pagina < totalPaginas && (
                <a href={`/productos?page=${productos.pagina + 1}`} class="boton-pagina">
                  Siguiente
                </a>
              )}
            </div>
          </>
        )
        : <p>No hay productos con ese nombre disponible</p>}
    </div>
  );
};
