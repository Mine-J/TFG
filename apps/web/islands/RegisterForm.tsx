import { useState } from "preact/hooks";
import { FunctionalComponent } from "preact";

export const RegisterForm: FunctionalComponent = () => {
  const [tipo, setTipo] = useState<"usuario" | "farmacia">("usuario");
  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState(false);

  // Estados FARMACIA
  const [errorFarmacia, setErrorFarmacia] = useState("");
  const [cif, setCif] = useState("");
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
        cif,
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
      const res = await fetch("/api/register", {
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
      <a href="/auth/login" class="volverLoginRegister">Login</a>
      <h2>Registro</h2>

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

            <input
              type="text"
              placeholder="Dirección"
              value={direccionFarmacia}
              onInput={(e) => setDireccionFarmacia(e.currentTarget.value)}
              disabled={loading}
              required
            />

            <input
              type="number"
              placeholder="Código Postal"
              value={cpFarmacia}
              onInput={(e) => setCpFarmacia(e.currentTarget.value)}
              max={99999}
              min={10000}
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

            <button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar"}
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
              type="number"
              placeholder="Código Postal"
              value={cpUsuario}
              onInput={(e) => setCpUsuario(e.currentTarget.value)}
              max={99999}
              min={10000}
              disabled={loading}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
