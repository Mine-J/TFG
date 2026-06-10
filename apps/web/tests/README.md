# Tests

Este directorio contiene las pruebas automatizadas del proyecto, separadas por nivel de validación. El objetivo es diferenciar claramente las pruebas unitarias, centradas en módulos concretos, de las pruebas end-to-end, que validan flujos completos de usuario en navegador.

## Estructura

```txt
tests/
├─ unit/
│  └─ jwt_test.ts
└─ e2e/
   ├─ home_test.ts
   └─ README.md
```

## Tipos de pruebas

### Pruebas unitarias

Las pruebas unitarias se encuentran en:

```txt
tests/unit/
```

Estas pruebas validan funciones o módulos concretos de forma aislada, sin necesidad de interactuar con el navegador.

Actualmente se incluye una prueba unitaria para el módulo JWT, encargado de generar y verificar tokens de autenticación.

#### TP-12 - Generación y verificación de JWT válido

Comprueba que el sistema puede generar un token JWT válido y verificarlo correctamente.

Se valida que:

- el token se genera correctamente;
- el token contiene contenido;
- el payload se puede recuperar mediante `verificarToken`;
- el identificador del usuario coincide con el esperado;
- el tipo de usuario coincide con el esperado;
- el token contiene fecha de expiración.

Ejemplo de validación:

```ts
const token = await generarToken({ id: "usuario-123", tipo: "usuario" });
const payload = await verificarToken(token);

assertEquals(payload?.id, "usuario-123");
assertEquals(payload?.tipo, "usuario");
```

#### TP-13 - Rechazo de JWT alterado

Comprueba que un token manipulado no se acepta como válido.

Para ello, primero se genera un token correcto y después se modifica su último carácter. Posteriormente se intenta verificar el token alterado.

Resultado esperado:

```ts
null
```

Esto permite comprobar que el sistema detecta tokens modificados y evita aceptar credenciales no válidas.

## Código del test JWT

El archivo `jwt_test.ts` contiene dos pruebas:

```ts
import { assert, assertEquals } from "$std/assert/mod.ts";
import { generarToken, verificarToken } from "@shared/jwt.ts";

Deno.test({
  name: "TP-12 - genera y verifica un token JWT válido",
  permissions: { env: true },
  async fn() {
    Deno.env.set("JWT_SECRET", "test-secret-jwt");

    const token = await generarToken({ id: "usuario-123", tipo: "usuario" });
    assert(token.length > 0);

    const payload = await verificarToken(token);
    assert(payload);
    assertEquals(payload?.id, "usuario-123");
    assertEquals(payload?.tipo, "usuario");
    assert(typeof payload?.exp === "number");
  },
});

Deno.test({
  name: "TP-13 - rechaza un token JWT alterado",
  permissions: { env: true },
  async fn() {
    Deno.env.set("JWT_SECRET", "test-secret-jwt");

    const token = await generarToken({ id: "farmacia-456", tipo: "farmacia" });
    const tokenAlterado = `${token.slice(0, -1)}x`;

    const payload = await verificarToken(tokenAlterado);
    assertEquals(payload, null);
  },
});
```

> Nota: solo se necesita permiso de entorno (`env`) porque el test modifica temporalmente la variable `JWT_SECRET`.

## Pruebas end-to-end

Las pruebas end-to-end se encuentran en:

```txt
tests/e2e/
```

Estas pruebas usan Playwright para simular acciones reales de usuario en navegador. Validan flujos completos como registro, inicio de sesión, persistencia de sesión, acceso por rol, recuperación de contraseña y gestión de pedidos.

Actualmente se incluyen pruebas para:

- registro de usuario;
- validaciones de errores en registro;
- inicio de sesión correcto e incorrecto;
- persistencia de sesión;
- inicio de sesión de farmacia;
- restricciones de acceso por rol;
- solicitud de recuperación de contraseña;
- creación de pedidos;
- aceptación, rechazo y finalización de pedidos;
- validación del caso sin farmacias disponibles dentro del radio indicado.

Los casos end-to-end implementados son:

```txt
TP-01 - Cambio entre formulario de farmacia y usuario
TP-02 - Registro rechazado porque el correo ya está en uso
TP-03 - Registro rechazado porque el teléfono no es válido
TP-04 - Registro rechazado porque el teléfono no tiene prefijo internacional
TP-05 - Registro correcto de usuario
TP-06 - Inicio de sesión rechazado porque el email no existe
TP-07 - Inicio de sesión rechazado porque la contraseña es incorrecta
TP-08 - Inicio de sesión correcto y persistencia de sesión
TP-09 - Inicio de sesión de farmacia correcto
TP-10 - Usuario no puede acceder al panel de farmacia
TP-11 - Farmacia no puede acceder a rutas privadas de usuario
TP-14 - Solicitud de recuperación de contraseña
TP-16A - Crear pedido para prueba de aceptación
TP-17A - Aceptar pedido desde farmacia y verificar estado aceptado en usuario
TP-18 - Finalizar pedido aceptado y verificar estado finalizado en usuario
TP-16B - Crear pedido para prueba de rechazo
TP-17B - Rechazar pedido desde farmacia
TP-19 - Sin farmacias en radio
```

Algunos casos se dividen en pasos A y B porque se reutiliza la creación de pedidos para validar posteriormente los flujos de aceptación y rechazo.

La descripción detallada de las pruebas end-to-end se encuentra en:

```txt
tests/e2e/README.md
```

## Cómo ejecutar las pruebas

### Ejecutar pruebas unitarias

Desde `apps/web`:

```bash
deno task test:unit
```

También pueden ejecutarse directamente con:

```bash
deno test -A tests/unit
```

### Ejecutar pruebas end-to-end

Desde `apps/web`:

```bash
deno task test:e2e
```

También pueden ejecutarse directamente con:

```bash
deno test -A tests/e2e
```

### Ejecutar todas las pruebas

Desde la raíz del proyecto, si existe una tarea global configurada:

```bash
deno task test
```

## Variables de entorno

Las pruebas JWT configuran manualmente la variable `JWT_SECRET` durante la ejecución:

```ts
Deno.env.set("JWT_SECRET", "test-secret-jwt");
```

Esto permite que el test sea independiente de la configuración real del entorno y evita depender del fichero `.env`.

Las pruebas end-to-end se ejecutan contra la instancia desplegada de la aplicación:

```txt
https://tfg.mine-j.deno.net
```

Para validar los flujos de farmacia se utilizan credenciales de prueba correspondientes a una farmacia registrada en el entorno utilizado para los tests.

## Objetivo de la estrategia de testing

La estrategia de pruebas combina distintos niveles de validación:

- las pruebas unitarias comprueban la lógica interna de módulos concretos;
- las pruebas end-to-end verifican el comportamiento real de la aplicación desde el punto de vista del usuario y de la farmacia;
- las validaciones de permisos comprueban que cada rol accede únicamente a las rutas correspondientes;
- las pruebas de pedidos validan el flujo funcional principal de la aplicación.

De esta forma, se cubren tanto aspectos internos de seguridad, como la generación y validación de JWT, como flujos funcionales completos relacionados con autenticación, autorización, recuperación de contraseña y gestión de pedidos.