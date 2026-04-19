import { FunctionalComponent } from "preact/src/index.d.ts";
import { useEffect, useState } from "preact/hooks";
import { Cesta, CestaProducto } from "@shared/types.ts";

export const BotonSolicitarProducto: FunctionalComponent<{ nregistro: string }> = (
  { nregistro },
) => {
  const [enCesta, setEnCesta] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkEnCesta = async () => {
      try {
        const res = await fetch("/api/Datos/obtenerDatos");
        const userData = await res.json();

        if (userData?.id) {
          setUserId(userData.id);

          const response = await fetch(`/api/cesta/${userData.id}`);
          if (response.ok) {
            const cesta: Cesta = await response.json();
            const estaEnCesta = cesta.productos?.some((p) => p.nregistro === nregistro);
            setEnCesta(estaEnCesta);
          }
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };

    checkEnCesta();
  }, [nregistro]);

  const solicitar = async () => {
    try {
      const producto: CestaProducto = {
        nregistro,
        cantidad: 1,
      };

      const response = await fetch("/api/cesta/añadir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usuario_id: userId, producto }),
      });

      if (response.ok) {
        const cesta: Cesta = await response.json();
        const estaEnCesta = cesta.productos?.some((p) => p.nregistro === nregistro);
        setEnCesta(estaEnCesta);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={solicitar}
      class="boton-prospecto"
      disabled={!userId}
    >
      {enCesta ? "🛒 Quitar de la cesta" : " 🛒 Añadir a la cesta"}
    </button>
  );
};
