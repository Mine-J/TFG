import { useState } from "preact/hooks";
import { FunctionalComponent } from "preact";

export const LoginForm: FunctionalComponent = () => {
  const [tipo, setTipo] = useState<"usuario" | "farmacia">("usuario");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Estados FARMACIA
  const [errorFarmacia, setErrorFarmacia] = useState("");
  const [cif, setCif] = useState("");
  const [passwordFarmacia, setPasswordFarmacia] = useState("");

  // Estados USUARIO
  const [errorUsuario, setErrorUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [passwordUsuario, setPasswordUsuario] = useState("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setErrorFarmacia("");
    setErrorUsuario("");
    setSuccess(false);
    setLoading(true);

    let body;

    if (tipo === "farmacia") {
      body = {
        tipo: "farmacia",
        cif,
        password: passwordFarmacia,
      };
    } else {
      body = {
        tipo: "usuario",
        email,
        password: passwordUsuario,
      };
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        if (tipo === "farmacia") {
          setErrorFarmacia(data);
        } else {
          setErrorUsuario(data);
        }
        return;
      }

      setSuccess(true);

      // Redirigir después de 2 segundos
      setTimeout(() => {
        globalThis.location.href = "/";
      }, 2000);
    } catch (err) {
      console.error("Error fetch:", err);
      if (tipo === "farmacia") {
        setErrorFarmacia("Error de conexión. Intenta de nuevo.");
      } else {
        setErrorUsuario("Error de conexión. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="divPrincipalRegister">
      <a href="/auth/register" class="volverLoginRegister">Register</a>
      <h2>Login</h2>

      {/* Mensajes de éxito/error */}
      {tipo === "farmacia" && errorFarmacia && (
        <div class="mensaje error">
          {errorFarmacia}
        </div>
      )}

      {tipo === "usuario" && errorUsuario && (
        <div class="mensaje error">
          {errorUsuario}
        </div>
      )}

      {success && (
        <div class="mensaje success">
          Inicio de sesión exitoso! Redirigiendo al Home...
        </div>
      )}

      <div class="divFormulario">
        <div class="contenedorBotonesTipo">
          <div class={`burbuja ${tipo === "farmacia" ? "farmacia" : ""}`}></div>
          <button
            type="button"
            class={`BotonUsuarioFarmacia ${tipo === "usuario" ? "activo" : ""}`}
            onClick={() => setTipo("usuario")}
            disabled={loading}
          >
            Usuario
          </button>
          <button
            type="button"
            class={`BotonUsuarioFarmacia ${tipo === "farmacia" ? "activo" : ""}`}
            onClick={() => setTipo("farmacia")}
            disabled={loading}
          >
            Farmacia
          </button>
        </div>

        {tipo === "farmacia" && (
          <>
            <form class="formulario" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="CIF"
                value={cif}
                onInput={(e) => setCif(e.currentTarget.value)}
                disabled={loading}
                required
              />

              <input
                type="password"
                placeholder="Contraseña"
                value={passwordFarmacia}
                onInput={(e) => setPasswordFarmacia(e.currentTarget.value)}
                disabled={loading}
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </form>
            
              <a class="RecuperarContraseña" href="/auth/recuperar-contraseña">
                ¿Olvidaste tu contraseña?
              </a>
            
          </>
        )}

        {tipo === "usuario" && (
          <>
            <form class="formulario" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onInput={(e) => setEmail(e.currentTarget.value)}
                disabled={loading}
                required
              />

              <input
                type="password"
                placeholder="Contraseña"
                value={passwordUsuario}
                onInput={(e) => setPasswordUsuario(e.currentTarget.value)}
                disabled={loading}
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </form>
            <div style="text-align: center;">
              <a class="RecuperarContraseña" href="/auth/recuperar-contraseña">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
