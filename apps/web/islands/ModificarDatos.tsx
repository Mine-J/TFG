import { useEffect, useState } from "preact/hooks";
import { FunctionalComponent } from "preact/src/index.d.ts";

export const ModificarDatos: FunctionalComponent = () => {
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [codigo_postal, setCodigo_postal] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/Datos/obtenerDatos");
        const data = await res.json();

        setNombre(data.nombre);
        setApellidos(data.apellidos);
        setEmail(data.email);
        setTelefono(data.telefono);
        setDireccion(data.direccion);
        setCodigo_postal(data.codigo_postal);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar los datos");
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");

    setGuardando(true);

    try {
      const res = await fetch("/api/Datos/actualizarDatos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          apellidos,
          email,
          telefono,
          direccion,
          codigo_postal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al actualizar los datos");
        return;
      }

      globalThis.location.href = "/";
    } catch (err) {
      console.error("Error:", err);
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div class="modificar-datos-contenedor">
      <h1>Mis Datos</h1>

      {error && <div class="mensaje error">{error}</div>}

      <form class="modificar-datos-formulario" onSubmit={handleSubmit}>
        <div class="modificar-datos-campo">
          <label>Nombre</label>
          <input
            type="text"
            value={nombre}
            onInput={(e) => setNombre(e.currentTarget.value)}
            required
            disabled={guardando}
          />
        </div>

        <div class="modificar-datos-campo">
          <label>Apellidos</label>
          <input
            type="text"
            value={apellidos}
            onInput={(e) => setApellidos(e.currentTarget.value)}
            required
            disabled={guardando}
          />
        </div>

        <div class="modificar-datos-campo">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onInput={(e) => setEmail(e.currentTarget.value)}
            required
            disabled={guardando}
          />
        </div>

        <div class="modificar-datos-campo">
          <label>Teléfono</label>
          <input
            type="tel"
            value={telefono}
            onInput={(e) => setTelefono(e.currentTarget.value)}
            required
            disabled={guardando}
          />
        </div>

        <div class="modificar-datos-campo">
          <label>Dirección</label>
          <textarea
            value={direccion}
            onInput={(e) => setDireccion(e.currentTarget.value)}
            required
            disabled={guardando}
            rows={3}
          />
        </div>

        <div class="modificar-datos-campo">
          <label>Código Postal</label>
          <input
            type="text"
            value={codigo_postal}
            onInput={(e) => setCodigo_postal(e.currentTarget.value)}
            maxLength={5}
            required
            disabled={guardando}
          />
        </div>

        <button type="submit" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar Cambios"}
        </button>
      </form>
    </div>
  );
};
