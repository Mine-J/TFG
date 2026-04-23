import { useState } from "preact/hooks";
import Buscador from "./Buscador.tsx";
import { UsuarioHeader } from "@shared/types.ts";
import { FunctionalComponent } from "preact/src/index.d.ts";

type Props = { User: UsuarioHeader | null };

export const Header: FunctionalComponent<Props> = ({ User }: Props) => {
  const [user, _setUser] = useState<UsuarioHeader | null>(User);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrarSesion = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      globalThis.location.href = "/";
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  return (
    <div class="header">
      {user?.tipo === "usuario" || !user
        ? (
          <>
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
                      {user.tipo === "farmacia"
                        ? (user.email || "Farmacia")
                        : (user.nombre || "Usuario")} ▼
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
                : <a class="botonUsuario" href="/auth/login">Iniciar sesión / Registrarse</a>}
            </div>
          </>
        )
        : (
          <>
            <a href="/farmacia/solicitudes" class="header-logo">
              Solicitudes
            </a>
          </>)}
    </div>
  );
};
