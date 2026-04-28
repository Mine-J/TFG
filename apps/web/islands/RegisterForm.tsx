import { useState } from "preact/hooks";
import { FunctionalComponent } from "preact";

export const RegisterForm: FunctionalComponent = () => {
  const [tipo, setTipo] = useState<"usuario" | "farmacia">("usuario");
  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState(false);

  // Estados FARMACIA
  const [errorFarmacia, setErrorFarmacia] = useState("");
  const [nif, setnif] = useState("");
  const [emailFarmacia, setEmailFarmacia] = useState("");
  const [passwordFarmacia, setPasswordFarmacia] = useState("");
  const [direccionFarmacia, setDireccionFarmacia] = useState("");
  const [cpFarmacia, setCpFarmacia] = useState("");
  const [telefonoFarmacia, setTelefonoFarmacia] = useState("");

  // Estados USUARIO
  const [errorUsuario, setErrorUsuario] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [passwordUsuario, setPasswordUsuario] = useState("");
  const [direccionUsuario, setDireccionUsuario] = useState("");
  const [telefonoUsuario, setTelefonoUsuario] = useState("");
  const [cpUsuario, setCpUsuario] = useState("");

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
        email: emailFarmacia,
        nif: nif,
        password: passwordFarmacia,
        direccion: direccionFarmacia,
        cp: cpFarmacia,
        telefono: telefonoFarmacia,
      };
    } else {
      body = {
        tipo: "usuario",
        nombre,
        apellidos,
        email,
        password: passwordUsuario,
        direccion: direccionUsuario,
        telefono: telefonoUsuario,
        cp: cpUsuario,
      };
    }

    try {
      const res = await fetch("/api/auth/register", {
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
      <a href="/auth/login" class="volverLoginRegister">Iniciar sesión</a>
      <h2>Crear cuenta</h2>

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
          Registro exitoso! Redirigiendo al login...
        </div>
      )}

      <div class="divFormulario">
        {/* Toggle con efecto liquid glass */}
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
          <form class="formulario" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={emailFarmacia}
              onInput={(e) => setEmailFarmacia(e.currentTarget.value)}
              disabled={loading}
              required
            />

            <input
              type="text"
              placeholder="NIF"
              value={nif}
              onInput={(e) => setnif(e.currentTarget.value)}
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

            <input
              type="text"
              placeholder="Dirección"
              value={direccionFarmacia}
              onInput={(e) => setDireccionFarmacia(e.currentTarget.value)}
              disabled={loading}
              required
            />

            <input
              type="text"
              placeholder="Teléfono +34 ..."
              value={telefonoFarmacia}
              onInput={(e) => setTelefonoFarmacia(e.currentTarget.value)}
              disabled={loading}
              required
            />

            <input
              type="text"
              placeholder="Código Postal"
              value={cpFarmacia}
              onInput={(e) => setCpFarmacia(e.currentTarget.value)}
              maxLength={5}
              disabled={loading}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>
        )}

        {tipo === "usuario" && (
          <form class="formulario" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onInput={(e) => setNombre(e.currentTarget.value)}
              disabled={loading}
              required
            />

            <input
              type="text"
              placeholder="Apellidos"
              value={apellidos}
              onInput={(e) => setApellidos(e.currentTarget.value)}
              disabled={loading}
              required
            />

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

            <input
              type="text"
              placeholder="Dirección"
              value={direccionUsuario}
              onInput={(e) => setDireccionUsuario(e.currentTarget.value)}
              disabled={loading}
              required
            />

            <input
              type="tel"
              placeholder="Teléfono +34 ..."
              value={telefonoUsuario}
              onInput={(e) => setTelefonoUsuario(e.currentTarget.value)}
              disabled={loading}
              required
            />

            <input
              type="text"
              placeholder="Código Postal"
              value={cpUsuario}
              onInput={(e) => setCpUsuario(e.currentTarget.value)}
              maxLength={5}
              disabled={loading}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
