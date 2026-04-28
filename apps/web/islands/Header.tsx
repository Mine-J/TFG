import { useEffect, useState } from "preact/hooks";
import Buscador from "./Buscador.tsx";
import { UsuarioHeader } from "@shared/types.ts";
import { FunctionalComponent } from "preact/src/index.d.ts";

type Props = {
  User: UsuarioHeader | null;
  numeroProductosCesta?: number;
};

export const Header: FunctionalComponent<Props> = ({ User, numeroProductosCesta = 0 }: Props) => {
  const [user, _setUser] = useState<UsuarioHeader | null>(User);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [contadorCesta, setContadorCesta] = useState(numeroProductosCesta);

  useEffect(() => {
    setContadorCesta(numeroProductosCesta);
  }, [numeroProductosCesta]);

  useEffect(() => {
    const actualizarContador = (event: Event) => {
      const customEvent = event as CustomEvent<{ delta?: number; total?: number }>;
      if (typeof customEvent.detail?.total === "number") {
        setContadorCesta(customEvent.detail.total);
        return;
      }

      if (typeof customEvent.detail?.delta === "number") {
        const delta = customEvent.detail.delta;
        setContadorCesta((valorActual) => Math.max(0, valorActual + delta));
      }
    };

    globalThis.addEventListener("cesta:actualizada", actualizarContador);

    return () => {
      globalThis.removeEventListener("cesta:actualizada", actualizarContador);
    };
  }, []);

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
              <img src="/logo1.png" alt="Logo" />
            </a>
            <a href="/productos">Productos</a>
            <Buscador />
            <a href="/cesta" class="enlace-cesta">
              Cesta
              {contadorCesta > 0 && <span class="contador-cesta">{contadorCesta}</span>}
            </a>
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
              <img src="/logo1.png" alt="Logo" />
            </a>
            <a href="/farmacia/solicitudes">Solicitudes</a>
            <a href="/farmacia/aceptados">Aceptados</a>
            <a href="/farmacia/finalizados">Finalizados</a>
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
                        <a href="/modificar-datos">Modificar datos</a>
                        <button type="button" onClick={cerrarSesion}>Cerrar sesión</button>
                      </div>
                    )}
                  </>
                )
                : <a class="botonUsuario" href="/auth/login">Iniciar sesión / Registrarse</a>}
            </div>
          </>
        )}
    </div>
  );
};
