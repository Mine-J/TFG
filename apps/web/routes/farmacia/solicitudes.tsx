import { FreshContext, PageProps } from "$fresh/server.ts";
import { GestionPedidosFarmacias } from "../../islands/GestionPedidosFarmacias.tsx";

export function handler(req: Request, ctx: FreshContext<string>) {
  const url = new URL(req.url);
  const path = url.pathname;
  let data = path.split("/").pop();
  if (data === "solicitudes") { 
    data = "Pendiente";
  } else if (data === "aceptados") {
    data = "Aceptado";
  } else if(data === "finalizados") {
    data = "Finalizado";
  } else {
    return new Response("No encontrado", { status: 404 });
  }
  return ctx.render(data);
}

export default function Home({ data }: PageProps<string>) {
  
  return <GestionPedidosFarmacias tipo={data} />;
}
