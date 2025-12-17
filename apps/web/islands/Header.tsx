import { useEffect, useState } from "preact/hooks";
import type { Usuario } from "../../../packages/shared/types.ts";

export default function Header() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    fetch("/api/obtenerDatos")
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
      })
      .catch((err) => {
        console.error("Error al obtener datos:", err);
      });
  }, []);

  const cerrarSesion = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
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
      <div class="menuUsuario">
        <button type="button" class="botonUsuario" onClick={() => setMenuAbierto(!menuAbierto)}>
          {user?.nombre || "Usuario"} ▼
        </button>
        {menuAbierto && (
          <div class="desplegableUsuario">
            <a href="/perfil">Modificar datos</a>
            <button type="button" onClick={cerrarSesion}>Cerrar sesión</button>
          </div>
        )}
      </div>
    </div>
  );
}
