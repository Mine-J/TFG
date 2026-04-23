import { useEffect, useState } from "preact/hooks";
import { ProductoInfo, RespuestaAPIProducto } from "@shared/types.ts";

export default function Buscador() {
  const [busqueda, setBusqueda] = useState<string>("");
  const [productos, setProductos] = useState<ProductoInfo[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState<boolean>(false);

  useEffect(() => {
    if (busqueda.length < 1) {
      setProductos([]);
      setMostrarResultados(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/productos?name=${busqueda}`,
        );
        const data = await response.json() as RespuestaAPIProducto;

        const productosFiltrados = data.resultados.filter((p) => p.comerc === true).slice(0, 5);
        setProductos(productosFiltrados);
        setMostrarResultados(true);
      } catch (error) {
        console.error("Error al buscar productos:", error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [busqueda]);

  const handleProductoClick = (e: Event) => {
    e.preventDefault();
    const href = (e.currentTarget as HTMLAnchorElement).href;
    setMostrarResultados(false);
    setBusqueda("");
    globalThis.location.href = href;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && busqueda.trim().length > 0) {
      globalThis.location.href = `/productos?name=${busqueda}`;
    }
  };

  const handleBlur = () => {
    // Timeout para que el click se registre antes
    setTimeout(() => {
      setMostrarResultados(false);
    }, 150);
  };

  const handleFocus = () => {
    if (busqueda.length >= 1) {
      setMostrarResultados(true);
    }
  };

  return (
    <div class="buscador-contenedor">
      <input
        type="text"
        placeholder="Buscar productos..."
        value={busqueda}
        onInput={(e) => setBusqueda(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        class="buscador-input"
      />

      {mostrarResultados && productos.length > 0 && (
        <div class="buscador-resultados">
          {productos.map((producto) => (
            <a
              key={producto.nregistro}
              href={`/producto/${producto.nregistro}`}
              onClick={handleProductoClick}
              class="buscador-item"
            >
              <div class="buscador-item-nombre">
                {producto.nombre}
              </div>
              <div class="buscador-item-info">
                {producto.formaFarmaceutica?.nombre} - {producto.labtitular}
              </div>
            </a>
          ))}
        </div>
      )}

      {mostrarResultados && productos.length === 0 && busqueda.length >= 1 && (
        <div class="buscador-sin-resultados">
          No se encontraron productos
        </div>
      )}
    </div>
  );
}
