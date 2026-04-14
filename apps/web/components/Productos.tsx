import { FunctionalComponent } from "preact/src/index.d.ts";
import { RespuestaAPIProducto } from "@shared/types.ts";
import { BotonSolicitarProducto } from "../islands/BotonSolicitarProducto.tsx";

interface ProductosProps {
  productos: RespuestaAPIProducto;
}

export const Productos: FunctionalComponent<ProductosProps> = ({ productos }) => {
  const totalPaginas = Math.floor(productos.totalFilas / 200) + 1;
  return (
    <div>
      <div class="pagina-productos">
        {productos.resultados?.map((producto) => (
          <div key={producto.nregistro} class="producto">
            <a href={`/producto/${producto.nregistro}`}>
              <img src={producto.fotos?.[0]?.url} alt={producto.nombre} />
              <h2>{producto.nombre}</h2>
                </a>
                {producto.comerc && <BotonSolicitarProducto nregistro={producto.nregistro} />}
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
    </div>
  );
};
