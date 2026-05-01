import { FunctionalComponent } from "preact/src/index.d.ts";

export const Footer: FunctionalComponent = () => {
  return (
    <div class="footer">
      <div class="footer-left">
        <a href="/preguntas-frecuentes">Preguntas Frecuentes</a>
      </div>
      <div class="footer-center">
        <p>&copy; Javier Sáez García | Proyecto de Fin de Grado - Universidad Nebrija, 2026</p>
      </div>
    </div>
  );
};
