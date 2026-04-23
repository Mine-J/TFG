import { FreshContext, PageProps } from "$fresh/server.ts";
import { Producto } from "../../../components/Producto.tsx";
import Axios from "npm:axios@^1.6.0";
import { Cesta, JWTHeader, ProductoInfo } from "@shared/types.ts";

interface ProductoPageProps {
  producto: ProductoInfo;
  productoEnCesta: boolean;
  usuario_id: string | null;
}
// Handler que obtiene los datos
export async function handler(req: Request, ctx: FreshContext<JWTHeader, ProductoPageProps>) {
  const urlAbs = new URL(req.url).origin;
  const id = ctx.params.id;

  try {
    const respuesta = await Axios.get<ProductoInfo>(
      `${urlAbs}/api/producto/${id}`,
    );
    const producto = respuesta.data;
    if (!producto) {
      return ctx.renderNotFound();
    }
    const productosEnCesta: Cesta | null = ctx.state.auth
      ? await fetch(`${urlAbs}/api/cesta/${ctx.state.auth.id}`).then((res) => res.json())
      : null;
    const productoEnCesta: boolean = productosEnCesta?.productos.some((p) =>
      p.nregistro === producto.nregistro
    ) ?? false;

    return ctx.render({ producto, productoEnCesta, usuario_id: ctx.state.auth?.id ?? null });
  } catch (error) {
    console.error("Error al obtener producto:", error);
    return ctx.renderNotFound();
  }
}

// Componente que muestra los datos
export default function ProductoPage(props: PageProps<ProductoPageProps>) {
  return (
    <Producto
      producto={props.data.producto}
      productoEnCesta={props.data.productoEnCesta}
      usuario_id={props.data.usuario_id}
    />
  );
}
