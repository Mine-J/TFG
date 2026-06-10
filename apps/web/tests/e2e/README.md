# Tests E2E con Playwright

Este directorio contiene las pruebas end to end de la aplicación realizadas con Playwright y Deno. Estas pruebas simulan el comportamiento real de un usuario en navegador, interactuando con formularios, botones, rutas protegidas, endpoints de autenticación y funcionalidades relacionadas con la gestión de pedidos.

Actualmente, las pruebas se ejecutan contra la instancia desplegada de la aplicación:

```txt
https://tfg.mine-j.deno.net
```

## Ejecución

Desde la raíz del proyecto:

```bash
deno task test:e2e
```

También pueden ejecutarse desde `apps/web`:

```bash
deno test -A tests/e2e
```

## Tests implementados

El archivo principal de pruebas valida los flujos de autenticación, permisos, recuperación de contraseña y gestión de pedidos de la aplicación.

### TP-01 - Cambio entre formulario de farmacia y usuario

Comprueba que en la pantalla de registro se puede alternar entre el formulario de farmacia y el formulario de usuario, mostrando los campos correspondientes en cada caso.

### TP-02 - Registro rechazado porque el correo ya está en uso

Comprueba que, al intentar registrar un usuario con un correo ya existente, el sistema devuelve un error controlado y muestra el mensaje correspondiente.

Resultado esperado:

```txt
Usuario ya registrado con ese Email
```

### TP-03 - Registro rechazado porque el teléfono no es válido

Comprueba que el sistema rechaza números de teléfono con formato inválido.

Resultado esperado:

```txt
El número de teléfono no es válido
```

### TP-04 - Registro rechazado porque el teléfono no tiene prefijo internacional

Comprueba que el sistema rechaza teléfonos que no incluyen el prefijo internacional.

Resultado esperado:

```txt
El número de teléfono debe incluir el prefijo internacional
```

### TP-05 - Registro correcto de usuario

Comprueba que un usuario puede registrarse correctamente introduciendo datos válidos. El test genera un correo único en cada ejecución para evitar conflictos con usuarios ya existentes.

Resultado esperado:

```txt
Respuesta HTTP 2xx
```

### TP-06 - Inicio de sesión rechazado porque el email no existe

Comprueba que el sistema rechaza el inicio de sesión cuando se introduce un correo que no existe en la base de datos.

Resultado esperado:

```txt
Usuario no encontrado
```

### TP-07 - Inicio de sesión rechazado porque la contraseña es incorrecta

Comprueba que el sistema rechaza el inicio de sesión cuando el usuario existe, pero la contraseña introducida no es correcta.

Resultado esperado:

```txt
Contraseña incorrecta
```

### TP-08 - Inicio de sesión correcto y persistencia de sesión

Comprueba que un usuario registrado puede iniciar sesión correctamente y que su sesión se mantiene activa tras recargar la página.

Se verifica que:

- el login devuelve una respuesta correcta;
- el usuario no permanece en `/auth/login`;
- el usuario aparece en el header;
- la sesión sigue activa después de recargar la página.

### TP-09 - Inicio de sesión de farmacia correcto

Comprueba que una farmacia registrada puede iniciar sesión correctamente y acceder a su panel privado.

Se utilizan credenciales de farmacia de prueba:

```txt
NIF: B00002303
Contraseña: 123456
```

### TP-10 - Usuario no puede acceder al panel de farmacia

Comprueba que un usuario normal no puede acceder a una ruta privada de farmacia, como:

```txt
/farmacia/solicitudes
```

Resultado esperado:

- redirección a otra ruta;
- bloqueo del acceso;
- ausencia de acceso real al panel de farmacia.

### TP-11 - Farmacia no puede acceder a ruta privada de usuario

Comprueba que una farmacia autenticada no puede acceder a rutas privadas propias del usuario.

Resultado esperado:

- redirección;
- bloqueo de acceso;
- imposibilidad de permanecer en la ruta de usuario.

### TP-14 - Solicitud de recuperación de contraseña

Comprueba que un usuario puede solicitar la recuperación de contraseña desde la pantalla correspondiente.

Resultado esperado:

```txt
Se ha enviado un enlace de recuperación a tu correo electrónico
```

### TP-16A - Crear pedido para prueba de aceptación

Comprueba que un usuario autenticado puede añadir un producto a la cesta, indicar un radio de búsqueda y crear un pedido correctamente.

Se verifica que:

- el producto se añade a la cesta;
- el radio de búsqueda se introduce correctamente;
- la solicitud de pedido se envía al backend;
- el pedido aparece en la sección “Mis pedidos” con estado pendiente.

### TP-17A - Aceptar pedido desde farmacia

Comprueba que una farmacia autenticada puede acceder a sus solicitudes pendientes y aceptar un pedido.

Se verifica que:

- la solicitud aparece en el panel de farmacia;
- la farmacia puede aceptar el pedido;
- el pedido aparece en el panel de aceptados;
- el usuario puede ver el pedido con estado aceptado.

### TP-18 - Finalizar pedido aceptado

Comprueba que una farmacia puede finalizar un pedido previamente aceptado.

Se verifica que:

- el pedido aceptado aparece en el panel correspondiente;
- la farmacia puede finalizar el pedido;
- el pedido aparece en el panel de finalizados;
- el usuario puede ver el pedido con estado finalizado.

### TP-16B - Crear pedido para prueba de rechazo

Comprueba de nuevo la creación de un pedido pendiente para poder validar posteriormente el flujo de rechazo desde la farmacia.

### TP-17B - Rechazar pedido desde farmacia

Comprueba que una farmacia autenticada puede rechazar una solicitud pendiente.

Se verifica que:

- existe una solicitud pendiente;
- la farmacia puede pulsar el botón de rechazo;
- la solicitud deja de aparecer como rechazable para esa farmacia.

### TP-19 - Sin farmacias en radio

Comprueba el comportamiento del sistema cuando el usuario intenta crear un pedido con un radio de búsqueda en el que no existen farmacias disponibles.

Resultado esperado:

```txt
No hay farmacias en el rango especificado.
```

Además, se verifica que el usuario permanece en la cesta después del aviso.

## Configuración del navegador

Los tests utilizan Chromium mediante Playwright.

La ejecución está configurada actualmente en modo visible para facilitar la revisión del flujo durante las pruebas:

```ts
headless: false
```

El navegador se lanza maximizado y con tamaño de ventana inicial de 1920x1080:

```ts
args: [
  "--start-maximized",
  "--window-position=0,0",
  "--window-size=1920,1080",
]
```

Además, cada contexto se crea con:

```ts
viewport: null
```

Esto permite que Playwright use el tamaño real de la ventana del navegador.

Para ejecutar los tests sin mostrar el navegador, puede cambiarse temporalmente a:

```ts
headless: true
```

## Pausas visuales

Existe una constante para introducir pausas entre pasos:

```ts
const PAUSA_VISUAL_MS = 0;
```

Por defecto está desactivada para que los tests se ejecuten más rápido. Para una demostración visual, puede aumentarse, por ejemplo:

```ts
const PAUSA_VISUAL_MS = 3000;
```

## Datos dinámicos

Para evitar conflictos con usuarios ya existentes, algunos tests generan correos únicos usando `Date.now()`:

```ts
test-registro-${Date.now()}@gmail.com
```

Esto permite ejecutar varias veces los tests sin reutilizar el mismo correo de registro.

## Credenciales de prueba

Para validar los flujos de farmacia se utilizan credenciales fijas de una farmacia registrada en el entorno de pruebas:

```txt
NIF: B00002303
Contraseña: 123456
```

## Objetivo de estas pruebas

El objetivo de estos tests es validar automáticamente los flujos críticos de la aplicación:

- registro de usuario;
- validaciones de errores en registro;
- inicio de sesión correcto e incorrecto;
- persistencia de sesión;
- acceso de farmacia;
- restricciones de permisos por rol;
- solicitud de recuperación de contraseña;
- creación de pedidos;
- aceptación, rechazo y finalización de pedidos;
- validación del caso sin farmacias disponibles dentro del radio indicado.

Estas pruebas permiten comprobar que la aplicación responde correctamente tanto ante casos válidos como ante errores controlados, cubriendo los principales flujos funcionales del sistema desde la perspectiva del usuario y de la farmacia.