import { useEffect, useState } from "preact/hooks";
import type { Usuario } from "../../../packages/shared/types.ts";
import Buscador from "./Buscador.tsx";

export default function Header() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const obtenerUsuario = async () => {
    try {
      const res = await fetch("/api/Datos/obtenerDatos");
      if (!res.ok) {
        setUser(null);
        return;
      }

      const userData = await res.json();
      if (userData && typeof userData === "object" && "id" in userData) {
        setUser(userData as Usuario);
        return;
      }

      setUser(null);
    } catch (_error) {
      setUser(null);
    }
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
        {user
          ? (
            <>
              <button
                type="button"
                class="botonUsuario"
                onClick={() => setMenuAbierto(!menuAbierto)}
              >
                {user.nombre || "Cargando..."} ▼
              </button>
              {menuAbierto && (
                <div class="desplegableUsuario">
                  <a href="/pedidos">Mis pedidos</a>
                  <a href="/modificar-datos">Modificar datos</a>
                  <button type="button" onClick={cerrarSesion}>Cerrar sesión</button>
                </div>
              )}
            </>
          )
          : <a class = "botonUsuario" href="/auth/register">Registrarse</a>}
      </div>
    </div>
  );
}
