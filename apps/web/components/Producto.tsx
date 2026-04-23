import { FunctionalComponent } from "preact/src/index.d.ts";
import { ProductoInfo } from "@shared/types.ts";
import { BotonSolicitarProducto } from "../islands/BotonSolicitarProducto.tsx";

interface ProductoProps {
  producto: ProductoInfo;
  productoEnCesta: boolean;
  usuario_id: string | null;
}

export const Producto: FunctionalComponent<ProductoProps> = ({ producto, productoEnCesta, usuario_id }) => {
  return (
    <div class="producto-pagina">
      <div class="producto-contenido">
        <h1 class="producto-titulo">{producto.nombre}</h1>

        <div class="producto-imagenes">
          {producto.fotos && producto.fotos.length > 0 && (
            <img
              src={producto.fotos[0].url}
              alt={producto.nombre}
              class="producto-img-principal"
            />
          )}
          {producto.fotos && producto.fotos.length > 1 && (
            <img
              src={producto.fotos[1].url}
              alt={`Tamaño ${producto.nombre}`}
              class="producto-img-secundaria"
            />
          )}
        </div>

        <div class="producto-info">
          <div class="info-item">
            <span class="info-label">Forma farmacéutica:</span>
            <span class="info-valor">{producto.formaFarmaceutica.nombre}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Dosis:</span>
            <span class="info-valor">{producto.dosis}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Necesita receta:</span>
            <span class={`info-receta ${producto.receta ? "receta-si" : "receta-no"}`}>
              {producto.receta ? "Sí" : "No"}
            </span>
          </div>
        </div>
        <div style="text-align: center; gap 12px">
          {producto.docs[1]?.url && (
            <a
              href={producto.docs[1].url}
              target="_blank"
              class="boton-prospecto"
            >
              📄 Ver prospecto
            </a>
          )}
          {producto.comerc && <BotonSolicitarProducto nregistro={producto.nregistro} productoEnCesta={productoEnCesta} usuario_id={usuario_id} />}
        </div>
      </div>
    </div>
  );
};
