import { Cesta, JWTHeader, RespuestaAPIProducto } from "@shared/types.ts";
import { Productos } from "../../components/Productos.tsx";
import { FreshContext } from "$fresh/server.ts";
import Axios from "npm:axios@^1.6.0";

interface ProductoPageProps {
  producto: RespuestaAPIProducto;
  productosEnCesta: Cesta | null;
}
// Handler que obtiene los datos
export async function handler(req: Request, ctx: FreshContext<JWTHeader, ProductoPageProps>) {
  try {
    const url = new URL(req.url);
    const urlAbs = url.origin
    const page = url.searchParams.get("page") || "1";
    const name = url.searchParams.get("name") || "";

    const respuesta = await Axios.get<RespuestaAPIProducto>(
      `${urlAbs}/api/productos?page=${page}&name=${name}`,
    );

    const producto = respuesta.data;

    if (!producto) {
      return ctx.renderNotFound();
    }
    
    if (ctx.state.auth) {
      const productosEnCesta: Cesta | null = await fetch(`${urlAbs}/api/cesta/${ctx.state.auth.id}`).then((res) =>
        res.json()
      );
      return ctx.render({ producto, productosEnCesta: productosEnCesta });
    }

    return ctx.render({ producto, productosEnCesta: null });
  } catch (error) {
    console.error("Error al obtener producto:", error);
    return ctx.renderNotFound();
  }
}

export default function Home({ data }: { data: ProductoPageProps }) {
  return <Productos productos={data.producto} productosEnCesta={data.productosEnCesta} />;
}
