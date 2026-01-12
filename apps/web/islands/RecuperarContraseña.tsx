import { FunctionalComponent } from "preact/src/index.d.ts";
import { useState } from "preact/hooks";

export const RecuperarContraseña: FunctionalComponent = () => {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    setEnviando(true);

    try {
      const response = await fetch("/api/auth/RecuperarContraseña", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje("Se ha enviado un enlace de recuperación a tu correo electrónico");
        setEmail("");
      } else {
        setError(data.error || "Error al enviar el correo de recuperación");
      }
    } catch (err) {
      setError("Error al procesar la solicitud");
      console.error("Error:", err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div class="ContenedorFormularioRecuperarContraseña">
      <h2>Recuperar Contraseña</h2>
      <form class="FormularioRecuperarContraseña" onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          value={email}
          onInput={(e) => setEmail(e.currentTarget.value)}
          required
          placeholder="Introduce tu correo electrónico"
          disabled={enviando}
        />

        {error && <div class="MensajeErrorRecuperarContraseña">{error}</div>}
        {mensaje && <div class="MensajeExitoRecuperarContraseña">{mensaje}</div>}

        <button type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar"}
        </button>
      </form>

      <div class="PieFormularioRecuperarContraseña">
        <a href="/auth/login">Volver al inicio de sesión</a>
      </div>
    </div>
  );
};
