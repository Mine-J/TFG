import { FunctionalComponent } from "preact/src/index.d.ts";

export const ProteccionDeDatos: FunctionalComponent = () => {
  return (
    <main class="proteccion-datos-page">
      <section class="proteccion-datos-hero">
        <h1>Protección de datos</h1>
        <p>
          Información sobre privacidad, tratamiento de datos personales, cookies de sesión,
          servicios externos y medidas de seguridad aplicadas en FarmaFinder.
        </p>
      </section>

      <div class="proteccion-datos-contenido">
        <section class="proteccion-datos-section">
          <h2>1. Información general</h2>
          <p>
            FarmaFinder es un prototipo académico desarrollado como parte de un Trabajo Fin de
            Grado. La finalidad de esta página es informar de forma transparente sobre el
            tratamiento de datos personales realizado por la aplicación, especialmente teniendo en
            cuenta que la búsqueda de medicamentos puede revelar indirectamente información
            relacionada con la salud del usuario.
          </p>
        </section>

        <section class="proteccion-datos-section">
          <h2>2. Datos tratados</h2>
          <p>
            La aplicación puede tratar datos identificativos y de contacto, como nombre, apellidos,
            correo electrónico, teléfono, dirección y código postal. También puede tratar
            información asociada a las solicitudes realizadas por el usuario, como productos
            incluidos en la cesta, radio de búsqueda, estado del pedido y farmacia asignada en caso
            de aceptación.
          </p>
          <p>
            El sistema aplica el principio de minimización de datos, solicitando únicamente la
            información necesaria para permitir el registro, autenticación, cálculo de farmacias
            cercanas, creación de pedidos y seguimiento de solicitudes.
          </p>
        </section>

        <section class="proteccion-datos-section">
          <h2>3. Finalidad del tratamiento</h2>
          <p>
            Los datos se utilizan para gestionar el funcionamiento básico de la plataforma: crear
            cuentas de usuario o farmacia, iniciar sesión, recuperar contraseñas, calcular farmacias
            dentro del radio seleccionado, tramitar solicitudes de productos y mostrar el estado de
            los pedidos.
          </p>
        </section>

        <section class="proteccion-datos-section">
          <h2>4. Base jurídica</h2>
          <p>
            La base jurídica principal del tratamiento es la prestación del servicio solicitado por
            el usuario. En caso de tratamientos adicionales no necesarios para el funcionamiento de
            la aplicación, como analítica avanzada o comunicaciones no imprescindibles, sería
            necesario solicitar el consentimiento correspondiente.
          </p>
        </section>

        <section class="proteccion-datos-section">
          <h2>5. Seguridad y control de accesos</h2>
          <p>
            Las contraseñas no se almacenan en texto plano, sino mediante hash. La sesión de usuario
            se gestiona mediante un token JWT almacenado en una cookie HttpOnly, utilizada
            exclusivamente para mantener la autenticación. Además, la aplicación diferencia entre
            cuentas de usuario y cuentas de farmacia, restringiendo el acceso a las rutas según el
            rol autenticado.
          </p>
          <p>
            Los pedidos quedan asociados al usuario que los crea y solo pueden ser gestionados por
            las farmacias candidatas o por la farmacia que acepta la solicitud. Como mejora previa a
            una implantación real, debería reforzarse la trazabilidad de acciones relevantes, como
            creación, aceptación, rechazo, finalización o cancelación de pedidos.
          </p>
        </section>

        <section class="proteccion-datos-section">
          <h2>6. Conservación de datos</h2>
          <p>
            Los datos deberían conservarse únicamente durante el tiempo necesario para cumplir la
            finalidad para la que fueron recogidos. Una vez finalizada dicha finalidad, deberían
            eliminarse o anonimizarse, salvo que exista una obligación técnica, legal o de seguridad
            que justifique su conservación temporal.
          </p>
        </section>

        <section class="proteccion-datos-section">
          <h2>7. Cookies y sesión</h2>
          <p>
            La aplicación utiliza una cookie técnica de sesión para mantener al usuario autenticado
            mediante JWT. Esta cookie es necesaria para el funcionamiento de la plataforma y no tiene
            finalidad publicitaria. Si en el futuro se incorporasen cookies analíticas, publicitarias
            o de terceros no necesarias, debería informarse al usuario y solicitarse consentimiento
            cuando proceda.
          </p>
        </section>

        <section class="proteccion-datos-section">
          <h2>8. Servicios de terceros</h2>
          <p>
            El sistema puede integrar servicios externos para funcionalidades como consulta de
            información de medicamentos, mapas, cálculo de rutas, geolocalización o envío de correos
            electrónicos. En una implantación real, sería necesario revisar las condiciones de estos
            proveedores, limitar los datos enviados a cada servicio y evitar tratamientos no
            necesarios que pudieran perfilar búsquedas relacionadas con medicamentos.
          </p>
        </section>

        <section class="proteccion-datos-section">
          <h2>9. Derechos del usuario</h2>
          <p>
            Los usuarios deberían poder ejercer sus derechos de acceso, rectificación, supresión,
            oposición, limitación del tratamiento y portabilidad de sus datos. Para ello, la
            aplicación debería habilitar un canal de contacto claro desde el que solicitar la gestión
            de dichos derechos.
          </p>
        </section>

        <section class="proteccion-datos-section">
          <h2>10. Limitaciones del prototipo</h2>
          <p>
            Al tratarse de un prototipo académico, algunas medidas propias de una implantación real
            se plantean como mejoras futuras. Entre ellas se incluyen la validación administrativa de
            farmacias registradas, la definición formal de plazos de conservación, la trazabilidad
            completa de acciones críticas y la revisión jurídica de todos los servicios externos
            integrados.
          </p>
        </section>
      </div>
    </main>
  );
};