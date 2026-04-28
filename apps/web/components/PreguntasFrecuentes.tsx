import { FunctionalComponent } from "preact/src/index.d.ts";

export const PreguntasFrecuentes: FunctionalComponent = () => {
  return (
    <div class="faq-container">
      <h2 id="preguntas-frecuentes">Preguntas Frecuentes</h2>
      <h3>¿Cómo puedo crear una cuenta?</h3>
      <p>
        Para crear una cuenta, haz clic en el botón "Registrarse" en la esquina superior derecha y
        completa el formulario con tus datos.
      </p>

      <h3>¿Cómo puedo recuperar mi contraseña?</h3>
      <p>
        Si has olvidado tu contraseña, haz clic en "Iniciar sesión" y luego en "¿Olvidaste tu
        contraseña?" para recibir un enlace de recuperación por correo electrónico.
      </p>

      <h3>¿Qué puedo ver en la página principal?</h3>
      <p>
        En la página principal solo salen productos solicitados y aceptados. Cuando un pedido está
        aceptado, te da la opción de ver cómo llegar a la farmacia andando o en coche, mostrando la
        ruta en el mapa. Si pulsas en la pestaña de la solicitud, se te redirige en el mapa
        directamente a la farmacia que te ha aceptado. Además, el icono no muestra una chincheta,
        sino el logo de la farmacia con la serpiente.
      </p>

      <h3>
        ¿Qué información aparece al pulsar la chincheta de una farmacia?
      </h3>
      <p>
        Al pulsar la chincheta o el icono de una farmacia en el mapa se muestra un panel con
        información detallada: teléfono, dirección completa (calle y número), código postal, horario
        de apertura y, cuando esté disponible, correo electrónico. Además suelen aparecer botones
        para obtener la ruta y para contactar directamente con la farmacia.
      </p>

      <h3>¿Dónde puedo ver todos mis pedidos?</h3>
      <p>
        Puedes ver todos tus pedidos en la sección de{" "}
        <strong>Mis pedidos</strong>, arriba a la derecha cuando haces clic en tu nombre. Ahí te
        aparecerán todos con su estado. Si pulsas en{" "}
        <strong>Más detalles</strong>, podrás ver las farmacias a las que ha llegado la solicitud,
        la farmacia que te lo ha aceptado en caso de que te lo haya aceptado, y los productos que
        has pedido.
      </p>

      <h3>¿Qué pasa si le doy a repetir pedido?</h3>
      <p>
        Si le das a "Repetir pedido", los productos del pedido se añadirán a tu cesta. Si alguno de
        esos productos ya estaba en la cesta, se sumará la cantidad al total.
      </p>

      <h3>¿Cómo he conseguido la lista de medicamentos?</h3>
      <p>
        La lista de medicamentos se actualiza regularmente y procede de CIMA (Centro de Información
        online de Medicamentos de la AEMPS), por lo que es necesario darle los créditos
        correspondientes. Puedes acceder a ella desde la sección "Medicamentos" del sitio web.
      </p>

      <h3>¿Qué pasa si activo la opcion bioequivalente en la cesta?</h3>
      <p>
        Si activas la opción de bioequivalente, le das a la farmacia la opción de buscar
        alternativas que hacen lo mismo, pero no exactamente el producto que has pedido.
      </p>
    </div>
  );
};
