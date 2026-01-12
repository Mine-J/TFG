import { FunctionalComponent } from "preact/src/index.d.ts";
import { useEffect, useState } from "preact/hooks";

export const RestablecerContraseña: FunctionalComponent = () => {
  const [token, setToken] = useState("");
  const [nuevaContraseña, setNuevaContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [tokenValido, setTokenValido] = useState(true);

  useEffect(() => {
    // Obtener token de la URL

    const params = new URLSearchParams(globalThis.location.search);
    const tokenParam = params.get("token");

    if (!tokenParam) {
      setTokenValido(false);
      setError("Token no válido o expirado");
    } else {
      setToken(tokenParam);
    }
  }, []);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (nuevaContraseña !== confirmarContraseña) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (nuevaContraseña.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setEnviando(true);

    try {
      const response = await fetch("/api/auth/RestablecerContraseña", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, nuevaContraseña }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje("Contraseña cambiada exitosamente. Redirigiendo al login...");
        setTimeout(() => {
          globalThis.location.href = "/auth/login";
        }, 2000);
      } else {
        setError(data.error || "Error al cambiar la contraseña");
      }
    } catch (err) {
      setError("Error al procesar la solicitud");
      console.error("Error:", err);
    } finally {
      setEnviando(false);
    }
  };

  if (!tokenValido) {
    return (
      <div class="ContenedorFormularioRestablecerContraseña">
        <h2>Error</h2>
        <div class="MensajeErrorRestablecerContraseña">El enlace no es válido o ha expirado</div>
        <div class="PieFormularioRestablecerContraseña">
          <a href="/auth/recuperar-contraseña">Solicitar nuevo enlace</a>
        </div>
      </div>
    );
  }

  return (
    <div class="ContenedorFormularioRestablecerContraseña">
      <h2>Restablecer Contraseña</h2>

      <form class="FormularioRestablecerContraseña" onSubmit={handleSubmit}>
        <p class="LabelRestablecerContraseña">Nueva contraseña</p>
        <input
          type="password"
          name="nuevaContraseña"
          value={nuevaContraseña}
          onInput={(e) => setNuevaContraseña(e.currentTarget.value)}
          required
          minLength={6}
          disabled={enviando}
          placeholder="Introduce tu nueva contraseña"
        />

        <p class="LabelRestablecerContraseña">Confirmar contraseña</p>
        <input
          type="password"
          name="confirmarContraseña"
          value={confirmarContraseña}
          onInput={(e) => setConfirmarContraseña(e.currentTarget.value)}
          required
          minLength={6}
          disabled={enviando}
          placeholder="Confirma tu nueva contraseña"
        />

        {error && <div class="MensajeErrorRestablecerContraseña">{error}</div>}
        {mensaje && <div class="MensajeExitoRestablecerContraseña">{mensaje}</div>}

        <button type="submit" disabled={enviando}>
          {enviando ? "Cambiando..." : "Cambiar contraseña"}
        </button>
      </form>

      <div class="PieFormularioRestablecerContraseña">
        <a href="/auth/login">Volver al inicio de sesión</a>
      </div>
    </div>
  );
};
