import { PageProps } from "$fresh/server.ts";
import { JWTHeader } from "@shared/types.ts";
import { Footer } from "../components/Footer.tsx";
import { Header } from "../islands/Header.tsx";

export default function Layout({ Component, state }: PageProps<unknown, JWTHeader>) {
  const user = state?.auth ?? null;

  return (
    <div class="layout">
      {<Header User={user} />}
      <div class="pagina">
        <Component />
      </div>
      {<Footer />}
    </div>
  );
}
