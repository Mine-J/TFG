import { useState } from "preact/hooks";
import { FunctionalComponent } from "preact/src/index.d.ts";
import { UsuarioHeader } from "@shared/types.ts";

export type datosUsuario = {
  datosUsuario: UsuarioHeader;
};

export const ModificarDatos: FunctionalComponent<datosUsuario> = ({ datosUsuario }) => {
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");
  const [id] = useState(datosUsuario.id);
  const [nombre, setNombre] = useState(datosUsuario.nombre);
  const [apellidos, setApellidos] = useState(datosUsuario.apellidos);
  const [email, setEmail] = useState(datosUsuario.email);
  const [telefono, setTelefono] = useState(datosUsuario.telefono);
  const [direccion, setDireccion] = useState(datosUsuario.direccion);
  const [codigo_postal, setCodigo_postal] = useState(datosUsuario.codigo_postal);
  const [cif, setCif] = useState(datosUsuario.cif);
  const [tipo] = useState(datosUsuario.tipo);
  const [horario, setHorario] = useState(datosUsuario.horario);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");

    setGuardando(true);

    try {
      const res = await fetch("/api/Datos/actualizarDatos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          cif,
          nombre,
          apellidos,
          email,
          telefono,
          direccion,
          codigo_postal,
          tipo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.log(data);
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
        {tipo === "usuario"
          ? (
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
          )
          : (
            <div class="modificar-datos-campo">
              <label>CIF</label>
              <input
                type="text"
                value={cif}
                onInput={(e) => setCif(e.currentTarget.value)}
                required
                disabled={guardando}
              />
            </div>
          )}

        {tipo === "usuario"
          ? (
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
          )
          : (
            <div class="modificar-datos-campo">
              <label>Horario</label>
              <input
                type="text"
                value={horario}
                onInput={(e) => setHorario(e.currentTarget.value)}
                required
                disabled={guardando}
              />
            </div>
          )}

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
