import { useEffect, useState } from "preact/hooks";
import type { Usuario } from "../../../packages/shared/types.ts";
import Buscador from "./Buscador.tsx";

export default function Header() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const obtenerUsuario = async () => {
    const res = await fetch("/api/Datos/obtenerDatos");
    const userData = await res.json();
    setUser(userData);
  };
  useEffect(() => {
    obtenerUsuario();
  }, []);

  const cerrarSesion = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      globalThis.location.href = "/auth/login";
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  return (
    <div class="header">
      <a href="/" class="header-logo">
        HOME
      </a>
      <a href="/productos">Productos</a>
      <Buscador />
      <a href="/cesta">Cesta</a>
      <div class="menuUsuario">
        <button type="button" class="botonUsuario" onClick={() => setMenuAbierto(!menuAbierto)}>
          {user?.nombre || "Usuario"} ▼
        </button>
        {menuAbierto && (
          <div class="desplegableUsuario">
            <a href="/pedidos">Mis pedidos</a>
            <a href="/modificar-datos">Modificar datos</a>
            <button type="button" onClick={cerrarSesion}>Cerrar sesión</button>
          </div>
        )}
      </div>
    </div>
  );
}
