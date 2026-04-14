import { FreshContext, PageProps } from "$fresh/server.ts";
import { Producto } from "../../../components/Producto.tsx";
import Axios from "npm:axios@^1.6.0";
import { ProductoInfo, RespuestaAPIProducto } from "@shared/types.ts";

interface ProductoPageProps {
  producto: ProductoInfo;
}
// Handler que obtiene los datos
export async function handler(_req: Request, ctx: FreshContext<ProductoPageProps>) {
  const id = ctx.params.id;

  try {
    const respuesta = await Axios.get<RespuestaAPIProducto>(
      `http://localhost:8000/api/producto/${id}`,
    );

    const producto = respuesta.data;

    if (!producto) {
      return ctx.renderNotFound();
    }

    return ctx.render({ producto });
  } catch (error) {
    console.error("Error al obtener producto:", error);
    return ctx.renderNotFound();
  }
}

// Componente que muestra los datos
export default function ProductoPage(props: PageProps<ProductoPageProps>) {
  return <Producto producto={props.data.producto} />;
}
