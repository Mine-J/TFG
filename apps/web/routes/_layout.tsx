import { PageProps } from "$fresh/server.ts";
import { Footer } from "../components/Footer.tsx";
import Header from "../islands/Header.tsx";

export default function Layout({ Component, url }: PageProps) {
    const sinHeaderFooter = url.pathname.includes("/auth/");
    
    return (
        <div class="layout">
            {!sinHeaderFooter && <Header />}
            <div class="pagina">
                <Component />
            </div>
            {!sinHeaderFooter && <Footer />}
        </div>
  );
}
