import { RespuestaAPIProducto } from "@shared/types.ts";
import { Productos } from "../../components/Productos.tsx";
import { FreshContext } from "$fresh/server.ts";
import Axios from "npm:axios@^1.6.0";

interface ProductoPageProps {
  producto: RespuestaAPIProducto;
}
// Handler que obtiene los datos
export async function handler(req: Request, ctx: FreshContext<ProductoPageProps>) {
  try {
    const url = new URL(req.url);
    const page = url.searchParams.get("page") || "1";
    const name = url.searchParams.get("name") || "";

    const respuesta = await Axios.get<RespuestaAPIProducto>(
      `http://localhost:8000/api/productos?page=${page}&name=${name}`,
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

export default function Home({ data }: { data: ProductoPageProps }) {
  return <Productos productos={data.producto} />;
}
