import { FunctionalComponent } from "preact/src/index.d.ts";
import { useState } from "preact/hooks";
import { Cesta, CestaProducto } from "@shared/types.ts";

export const BotonSolicitarProducto: FunctionalComponent<
  { nregistro: string; productoEnCesta: boolean | null; usuario_id: string | null }
> = (
  { nregistro, productoEnCesta, usuario_id },
) => {
  const [enCesta, setEnCesta] = useState(productoEnCesta);

  const [userId] = useState<string | null>(usuario_id);

  const solicitar = async () => {
    try {
      const estabaEnCesta = Boolean(enCesta);
      const producto: CestaProducto = {
        bioequivalente: false,
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

        globalThis.dispatchEvent(
          new CustomEvent("cesta:actualizada", {
            detail: {
              delta: estabaEnCesta ? -1 : 1,
            },
          }),
        );
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={solicitar}
      class={!userId ? "boton-Añadir-Cesta disabled" : "boton-Añadir-Cesta"}
      disabled={!userId}
    >
      {enCesta ? "🛒 Quitar de la cesta" : " 🛒 Añadir a la cesta"}
    </button>
  );
};
