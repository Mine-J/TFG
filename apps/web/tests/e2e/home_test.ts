import { assert, assertEquals } from "$std/assert/mod.ts";
import { type Browser, chromium, type Page } from "npm:playwright";

const BASE_URL = "https://tfg.mine-j.deno.net";
const PAUSA_VISUAL_MS = 0;

async function pausaVisual() {
  if (PAUSA_VISUAL_MS > 0) {
    await new Promise((resolve) => setTimeout(resolve, PAUSA_VISUAL_MS));
  }
}

async function crearPagina(browser: Browser) {
  const contexto = await browser.newContext({
    viewport: null,
  });

  const page = await contexto.newPage();

  const session = await contexto.newCDPSession(page);
  const { windowId } = await session.send("Browser.getWindowForTarget");

  await session.send("Browser.setWindowBounds", {
    windowId,
    bounds: {
      windowState: "maximized",
    },
  });

  page.on("pageerror", (error) => {
    console.log("ERROR EN LA PÁGINA:", error.message);
  });

  return { contexto, page };
}

async function irARegistroUsuario(page: Page) {
  await page.goto(`${BASE_URL}/auth/register`, {
    waitUntil: "domcontentloaded",
  });

  await page.getByRole("button", { name: "Usuario" }).click();
  await page.getByPlaceholder("Nombre").waitFor({ state: "visible" });
}

async function rellenarRegistroUsuario(
  page: Page,
  datos: {
    nombre?: string;
    apellidos?: string;
    email: string;
    password?: string;
    direccion?: string;
    telefono: string;
    cp?: string;
  },
) {
  await page.getByPlaceholder("Nombre").fill(datos.nombre ?? "Test");
  await page.getByPlaceholder("Apellidos").fill(datos.apellidos ?? "Usuario");
  await page.getByPlaceholder("Email").fill(datos.email);
  await page.getByPlaceholder("Contraseña").fill(datos.password ?? "Test1234!");
  await page.getByPlaceholder("Dirección").fill(datos.direccion ?? "Calle Segovia 47");
  await page.getByPlaceholder("Teléfono +34 ...").fill(datos.telefono);
  await page.getByPlaceholder("Código Postal").fill(datos.cp ?? "28001");
}

async function enviarFormularioRegistro(page: Page) {
  await page.getByRole("button", { name: "Crear cuenta" }).click();
}

async function esperarMensaje(page: Page, texto: string) {
  const mensaje = page.getByText(texto);

  await mensaje.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  assert(await mensaje.isVisible());
}

async function comprobarCambioFormulario(page: Page) {
  await page.goto(`${BASE_URL}/auth/register`, {
    waitUntil: "domcontentloaded",
  });

  await page.getByRole("button", { name: "Farmacia" }).click();

  const campoFarmacia = page.getByPlaceholder("NIF");
  await campoFarmacia.waitFor({ state: "visible", timeout: 10_000 });
  assert(await campoFarmacia.isVisible());

  await pausaVisual();

  await page.getByRole("button", { name: "Usuario" }).click();

  const campoUsuario = page.getByPlaceholder("Nombre");
  await campoUsuario.waitFor({ state: "visible", timeout: 10_000 });
  assert(await campoUsuario.isVisible());

  await pausaVisual();
}

async function comprobarCorreoExistente(page: Page) {
  await irARegistroUsuario(page);

  const correoExistente = "javisa04@gmail.com";

  await rellenarRegistroUsuario(page, {
    email: correoExistente,
    telefono: "+34608481451",
  });

  const registerResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/register") &&
      response.request().method() === "POST",
    { timeout: 30_000 },
  );

  await enviarFormularioRegistro(page);

  const response = await registerResponsePromise;
  const status = response.status();

  assertEquals(status, 409);
  await esperarMensaje(page, "Usuario ya registrado con ese Email");

  assertEquals(await page.inputValue('input[placeholder="Nombre"]'), "Test");
  assertEquals(await page.inputValue('input[placeholder="Apellidos"]'), "Usuario");
  assertEquals(await page.inputValue('input[placeholder="Email"]'), correoExistente);

  await pausaVisual();
}

async function comprobarTelefonoInvalido(page: Page) {
  await irARegistroUsuario(page);

  const email = `test-telefono-invalido-${Date.now()}@gmail.com`;

  await rellenarRegistroUsuario(page, {
    email,
    telefono: "+34123",
  });

  const registerResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/register") &&
      response.request().method() === "POST",
    { timeout: 30_000 },
  );

  await enviarFormularioRegistro(page);

  const response = await registerResponsePromise;
  const status = response.status();

  assertEquals(status, 400);
  await esperarMensaje(page, "El número de teléfono no es válido");

  assertEquals(await page.inputValue('input[placeholder="Email"]'), email);
  assertEquals(await page.inputValue('input[placeholder="Teléfono +34 ..."]'), "+34123");

  await pausaVisual();
}

async function comprobarTelefonoSinPrefijo(page: Page) {
  await irARegistroUsuario(page);

  const email = `test-sin-prefijo-${Date.now()}@gmail.com`;

  await rellenarRegistroUsuario(page, {
    email,
    telefono: "608481451",
  });

  const registerResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/register") &&
      response.request().method() === "POST",
    { timeout: 30_000 },
  );

  await enviarFormularioRegistro(page);

  const response = await registerResponsePromise;
  const status = response.status();

  assertEquals(status, 400);
  await esperarMensaje(page, "El número de teléfono debe incluir el prefijo internacional");

  assertEquals(await page.inputValue('input[placeholder="Email"]'), email);
  assertEquals(await page.inputValue('input[placeholder="Teléfono +34 ..."]'), "608481451");

  await pausaVisual();
}

async function comprobarRegistroCorrecto(page: Page) {
  await irARegistroUsuario(page);

  const timestamp = Date.now();
  const emailNuevo = `test-registro-${timestamp}@gmail.com`;
  const password = "Test1234!";

  await rellenarRegistroUsuario(page, {
    nombre: "TestLogin",
    apellidos: "Usuario",
    email: emailNuevo,
    password,
    direccion: "Calle Segovia 47",
    telefono: "+34608481451",
    cp: "28001",
  });

  const registerResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/register") &&
      response.request().method() === "POST",
    { timeout: 60_000 },
  );

  await enviarFormularioRegistro(page);

  const registerResponse = await registerResponsePromise;
  const status = registerResponse.status();

  assert(
    status >= 200 && status < 300,
    `El registro debería ser correcto, pero devolvió ${status}`,
  );

  await pausaVisual();

  return {
    email: emailNuevo,
    password,
  };
}

async function rellenarLogin(page: Page, email: string, password: string) {
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Contraseña").fill(password);
}

async function enviarFormularioLogin(page: Page) {
  await page.getByRole("button", {
    name: "Iniciar sesión",
  }).click();
}

async function irALoginUsuario(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`, {
    waitUntil: "domcontentloaded",
  });

  const botonUsuario = page.getByRole("button", { name: "Usuario" });

  if (await botonUsuario.isVisible().catch(() => false)) {
    await botonUsuario.click();
  }

  await page.getByPlaceholder("Email").waitFor({
    state: "visible",
    timeout: 10_000,
  });
}

async function comprobarLoginFallidoPorEmail(browser: Browser) {
  const contextoLogin = await browser.newContext({
    viewport: null,
  });

  const pageLogin = await contextoLogin.newPage();

  try {
    await irALoginUsuario(pageLogin);

    await rellenarLogin(
      pageLogin,
      `email-no-existe-${Date.now()}@gmail.com`,
      "Test1234!",
    );

    const loginResponsePromise = pageLogin.waitForResponse(
      (response) =>
        response.url().includes("/api/auth/login") &&
        response.request().method() === "POST",
      { timeout: 30_000 },
    );

    await enviarFormularioLogin(pageLogin);

    const loginResponse = await loginResponsePromise;
    const loginStatus = loginResponse.status();
    const loginBody = await loginResponse.text();

    assert(
      loginStatus >= 400,
      `El login con correo inexistente debería fallar, pero devolvió ${loginStatus}: ${loginBody}`,
    );

    const mensajeError = pageLogin.locator(".mensaje.error").or(
      pageLogin.getByText("Usuario no encontrado"),
    );

    try {
      await mensajeError.first().waitFor({
        state: "visible",
        timeout: 5_000,
      });

      assert(await mensajeError.first().isVisible());
    } catch {
      console.log("No se encontró mensaje visual de error en login por correo.");
      console.log("Respuesta del servidor:", loginBody);
    }

    await pausaVisual();
  } finally {
    await contextoLogin.close();
  }
}

async function comprobarLoginFallidoPorPassword(
  browser: Browser,
  email: string,
) {
  const contextoLogin = await browser.newContext({
    viewport: null,
  });

  const pageLogin = await contextoLogin.newPage();

  pageLogin.on("requestfailed", (request) => {
    if (request.url().includes("/api/auth/login")) {
      console.log("PETICIÓN DE login CON CONTRASEÑA FALLIDA:", request.failure()?.errorText);
    }
  });

  try {
    await irALoginUsuario(pageLogin);

    await rellenarLogin(pageLogin, email, "PasswordIncorrecta123!");

    const loginResponsePromise = pageLogin.waitForResponse(
      (response) =>
        response.url().includes("/api/auth/login") &&
        response.request().method() === "POST",
      { timeout: 30_000 },
    );

    await enviarFormularioLogin(pageLogin);

    const loginResponse = await loginResponsePromise;
    const loginStatus = loginResponse.status();

    assertEquals(loginStatus, 401);

    const mensajeError = pageLogin.locator(".mensaje.error").or(
      pageLogin.getByText("Contraseña incorrecta"),
    );

    try {
      await mensajeError.first().waitFor({
        state: "visible",
        timeout: 5_000,
      });

      assert(await mensajeError.first().isVisible());
    } catch {
      console.log("No se encontró mensaje visual de error en login por contraseña.");
    }

    await pausaVisual();
  } finally {
    await contextoLogin.close();
  }
}

async function comprobarLoginCorrecto(
  browser: Browser,
  email: string,
  password: string,
) {
  const contextoLogin = await browser.newContext();
  const pageLogin = await contextoLogin.newPage();

  try {
    await irALoginUsuario(pageLogin);

    await rellenarLogin(pageLogin, email, password);

    const loginResponsePromise = pageLogin.waitForResponse(
      (response) =>
        response.url().includes("/api/auth/login") &&
        response.request().method() === "POST",
      { timeout: 30_000 },
    );

    await enviarFormularioLogin(pageLogin);

    const loginResponse = await loginResponsePromise;
    const loginStatus = loginResponse.status();
    const loginBody = await loginResponse.text();

    assert(
      loginStatus >= 200 && loginStatus < 300,
      `El login correcto debería devolver una respuesta 2xx, pero devolvió ${loginStatus}: ${loginBody}`,
    );

    await pageLogin.waitForURL((url) => !url.pathname.includes("/auth/login"), {
      timeout: 10_000,
    });

    assert(!pageLogin.url().includes("/auth/login"));

    await pageLogin.reload({
      waitUntil: "domcontentloaded",
    });

    assert(!pageLogin.url().includes("/auth/login"));

    await pageLogin.goto(`${BASE_URL}/`, {
      waitUntil: "domcontentloaded",
    });

    const botonUsuarioAntesDeRecargar = pageLogin.getByRole("button", {
      name: /TestLogin|Usuario|▼/i,
    });

    await botonUsuarioAntesDeRecargar.waitFor({
      state: "visible",
      timeout: 10_000,
    });

    assert(
      await botonUsuarioAntesDeRecargar.isVisible(),
      "El usuario autenticado debería aparecer en el header",
    );

    await pageLogin.reload({
      waitUntil: "domcontentloaded",
    });

    const botonUsuarioDespuesDeRecargar = pageLogin.getByRole("button", {
      name: /TestLogin|Usuario|▼/i,
    });

    await botonUsuarioDespuesDeRecargar.waitFor({
      state: "visible",
      timeout: 10_000,
    });

    assert(
      await botonUsuarioDespuesDeRecargar.isVisible(),
      "La sesión debería mantenerse activa tras recargar la página",
    );
  } finally {
    await contextoLogin.close();
  }
}

function obtenerCredencialesFarmacia() {
  const nif = "B00002303";
  const password = "123456";

  return { nif, password };
}

async function irALoginFarmacia(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`, {
    waitUntil: "domcontentloaded",
  });

  const botonFarmacia = page.getByRole("button", { name: "Farmacia" });

  if (await botonFarmacia.isVisible().catch(() => false)) {
    await botonFarmacia.click();
  }

  await page.getByPlaceholder(/NIF|CIF/i).waitFor({
    state: "visible",
    timeout: 10_000,
  });
}

async function rellenarLoginFarmacia(page: Page, nif: string, password: string) {
  await page.getByPlaceholder("NIF").fill(nif);
  await page.getByPlaceholder("Contraseña").fill(password);
}

async function loginUsuarioEnPagina(page: Page, email: string, password: string) {
  await irALoginUsuario(page);
  await rellenarLogin(page, email, password);

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/login") &&
      response.request().method() === "POST",
    { timeout: 30_000 },
  );

  await enviarFormularioLogin(page);

  const loginResponse = await loginResponsePromise;
  const loginStatus = loginResponse.status();
  const loginBody = await loginResponse.text();

  assert(
    loginStatus >= 200 && loginStatus < 300,
    `El login de usuario debería ser correcto, pero devolvió ${loginStatus}: ${loginBody}`,
  );

  await page.goto(`${BASE_URL}/`, {
    waitUntil: "domcontentloaded",
  });

  assert(
    !page.url().includes("/auth/login"),
    "Después del login, el usuario no debería estar en /auth/login",
  );
}

async function loginFarmaciaEnPagina(page: Page, nif: string, password: string) {
  await irALoginFarmacia(page);
  await rellenarLoginFarmacia(page, nif, password);

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/login") &&
      response.request().method() === "POST",
    { timeout: 30_000 },
  );

  await enviarFormularioLogin(page);

  const loginResponse = await loginResponsePromise;
  const loginStatus = loginResponse.status();
  const loginBody = await loginResponse.text();

  assert(
    loginStatus >= 200 && loginStatus < 300,
    `El login de farmacia debería ser correcto, pero devolvió ${loginStatus}: ${loginBody}`,
  );

  await page.goto(`${BASE_URL}/farmacia/solicitudes`, {
    waitUntil: "domcontentloaded",
  });

  assert(
    !page.url().includes("/auth/login"),
    "Después del login, la farmacia no debería estar en /auth/login",
  );
}

async function comprobarLoginFarmaciaCorrecto(browser: Browser) {
  const { nif, password } = obtenerCredencialesFarmacia();

  const contexto = await browser.newContext({
    viewport: null,
  });

  const page = await contexto.newPage();

  try {
    await loginFarmaciaEnPagina(page, nif, password);

    await page.goto(`${BASE_URL}/farmacia/solicitudes`, {
      waitUntil: "domcontentloaded",
    });

    assert(
      !page.url().includes("/auth/login"),
      "La farmacia autenticada no debería ser redirigida al login",
    );

    const contenidoPanel = page.getByText(
      /solicitudes|aceptados|finalizados|farmacia|pedido|pedidos/i,
    );

    await contenidoPanel.first().waitFor({
      state: "visible",
      timeout: 10_000,
    });

    assert(
      await contenidoPanel.first().isVisible(),
      "El panel de farmacia debería mostrar contenido propio del rol farmacia",
    );

    await page.reload({
      waitUntil: "domcontentloaded",
    });

    assert(
      !page.url().includes("/auth/login"),
      "La sesión de farmacia debería mantenerse tras recargar",
    );

    await pausaVisual();
  } finally {
    await contexto.close();
  }
}

async function comprobarUsuarioNoAccedeAFarmacia(
  browser: Browser,
  email: string,
  password: string,
) {
  const contexto = await browser.newContext({
    viewport: null,
  });

  const page = await contexto.newPage();

  try {
    await loginUsuarioEnPagina(page, email, password);

    await page.goto(`${BASE_URL}/farmacia/solicitudes`, {
      waitUntil: "domcontentloaded",
    });

    const pathname = new URL(page.url()).pathname;

    const accesoBloqueado = pathname !== "/farmacia/solicitudes";

    assert(
      accesoBloqueado,
      "Un usuario normal no debería poder acceder al panel de farmacia",
    );

    await pausaVisual();
  } finally {
    await contexto.close();
  }
}

async function comprobarFarmaciaNoAccedeARutaUsuario(browser: Browser) {
  const { nif, password } = obtenerCredencialesFarmacia();

  const contexto = await browser.newContext({
    viewport: null,
  });

  const page = await contexto.newPage();

  try {
    await loginFarmaciaEnPagina(page, nif, password);

    await page.goto(`${BASE_URL}/`, {
      waitUntil: "domcontentloaded",
    });

    const pathname = new URL(page.url()).pathname;

    const accesoBloqueado = pathname !== "/";

    assert(
      accesoBloqueado,
      "Una farmacia no debería poder acceder a la zona de pedidos de usuario",
    );

    await pausaVisual();
  } finally {
    await contexto.close();
  }
}

async function comprobarRecuperacionContrasena(browser: Browser) {
  const contexto = await browser.newContext({
    viewport: null,
  });

  const page = await contexto.newPage();

  try {
    await page.goto(`${BASE_URL}/auth/recuperar-contraseña`, {
      waitUntil: "domcontentloaded",
    });

    const correoRecuperacion = "javisa04@gmail.com";

    await page.getByPlaceholder("Introduce tu correo electrónico").fill(correoRecuperacion);

    await page.getByRole("button", {
      name: "Enviar",
    }).click();

    const mensajeConfirmacion = page.getByText(
      "Se ha enviado un enlace de recuperación a tu correo electrónico",
    );

    await mensajeConfirmacion.waitFor({
      state: "visible",
      timeout: 30_000,
    });

    assert(
      await mensajeConfirmacion.isVisible(),
      "Debería mostrarse un mensaje visible de confirmación de recuperación de contraseña",
    );

    await pausaVisual();
  } finally {
    await contexto.close();
  }
}

async function comprobarCrearPedidoYConsultarEstado(
  browser: Browser,
  email: string,
  password: string,
) {
  const contexto = await browser.newContext({
    viewport: null,
  });

  const page = await contexto.newPage();

  try {
    await loginUsuarioEnPagina(page, email, password);

    await page.goto(`${BASE_URL}/productos`, {
      waitUntil: "domcontentloaded",
    });

    const enlacePrimerProducto = page.locator(
      "a[href*='/productos/'], a[href*='/producto/']",
    ).first();

    await enlacePrimerProducto.waitFor({
      state: "visible",
      timeout: 15_000,
    });

    await enlacePrimerProducto.click();

    const botonAnadirCesta = page.getByRole("button", {
      name: /añadir.*cesta/i,
    });

    await botonAnadirCesta.first().waitFor({
      state: "visible",
      timeout: 15_000,
    });

    await botonAnadirCesta.first().click();

    await page.waitForTimeout(1_000);

    await page.goto(`${BASE_URL}/cesta`, {
      waitUntil: "domcontentloaded",
    });

    await page.locator("body").waitFor({
      state: "visible",
      timeout: 10_000,
    });

    const campoRadio = page.locator("input.info-usuario-input[type='number']").first();

    await campoRadio.waitFor({
      state: "visible",
      timeout: 15_000,
    });

    await campoRadio.fill("10");

    assertEquals(await campoRadio.inputValue(), "10");

    const pedidoResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("/api/cesta"),
      { timeout: 10_000 },
    ).catch(() => null);

    const botonSolicitar = page.getByRole("button", {
      name: "Hacer Pedido",
    });

    await botonSolicitar.first().waitFor({
      state: "visible",
      timeout: 15_000,
    });

    await botonSolicitar.first().click();

    const pedidoResponse = await pedidoResponsePromise;

    if (pedidoResponse) {
      const status = pedidoResponse.status();

      assert(
        status >= 200 && status < 400,
        `La creación del pedido debería devolver 2xx o redirección 3xx, pero devolvió ${status}`,
      );
    }

    await page.goto(`${BASE_URL}/pedidos`, {
      waitUntil: "domcontentloaded",
    });

    const estadoPendiente = page.getByText(/pendiente/i);

    await estadoPendiente.first().waitFor({
      state: "visible",
      timeout: 20_000,
    });

    assert(
      await estadoPendiente.first().isVisible(),
      "El pedido creado debería aparecer en Mis pedidos con estado pendiente",
    );

    await pausaVisual();
  } finally {
    await contexto.close();
  }
}

async function comprobarAceptarPedido(
  browser: Browser,
  emailUsuario: string,
  passwordUsuario: string,
) {
  const { nif, password } = obtenerCredencialesFarmacia();

  const contextoFarmacia = await browser.newContext({
    viewport: null,
  });

  const pageFarmacia = await contextoFarmacia.newPage();

  try {
    await loginFarmaciaEnPagina(pageFarmacia, nif, password);

    await pageFarmacia.goto(`${BASE_URL}/farmacia/solicitudes`, {
      waitUntil: "domcontentloaded",
    });

    await pageFarmacia.locator("body").waitFor({
      state: "visible",
      timeout: 10_000,
    });

    const textoSolicitudes = await pageFarmacia.locator("body").innerText();

    assert(
      /Pedido/.test(textoSolicitudes),
      "La farmacia debería tener al menos una solicitud pendiente para aceptar",
    );

    const botonAceptar = pageFarmacia.getByRole("button", {
      name: "Aceptar",
    }).first();

    await botonAceptar.waitFor({
      state: "visible",
      timeout: 15_000,
    });

    const aceptarResponsePromise = pageFarmacia.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        (
          response.url().includes("/api/farmacia")
        ),
      { timeout: 30_000 },
    ).catch(() => null);

    await botonAceptar.click();

    const aceptarResponse = await aceptarResponsePromise;

    if (aceptarResponse) {
      const status = aceptarResponse.status();

      assert(
        status >= 200 && status < 400,
        `Aceptar pedido debería devolver 2xx o 3xx, pero devolvió ${status}`,
      );
    }

    await pageFarmacia.goto(`${BASE_URL}/farmacia/aceptados`, {
      waitUntil: "domcontentloaded",
    });

    const textoAceptados = await pageFarmacia.locator("body").innerText();

    assert(
      /Pedido/i.test(textoAceptados),
      "El pedido aceptado debería aparecer en el panel de aceptados de farmacia",
    );

    await pausaVisual();
  } finally {
    await contextoFarmacia.close();
  }

  const contextoUsuario = await browser.newContext({
    viewport: null,
  });

  const pageUsuario = await contextoUsuario.newPage();

  try {
    await loginUsuarioEnPagina(pageUsuario, emailUsuario, passwordUsuario);

    await pageUsuario.goto(`${BASE_URL}/pedidos`, {
      waitUntil: "domcontentloaded",
    });

    const estadoAceptado = pageUsuario.getByText("Aceptado");

    await estadoAceptado.first().waitFor({
      state: "visible",
      timeout: 20_000,
    });

    assert(
      await estadoAceptado.first().isVisible(),
      "El usuario debería ver el pedido con estado aceptado",
    );

    await pausaVisual();
  } finally {
    await contextoUsuario.close();
  }
}

async function comprobarFinalizarPedido(
  browser: Browser,
  emailUsuario: string,
  passwordUsuario: string,
) {
  const { nif, password } = obtenerCredencialesFarmacia();

  const contextoFarmacia = await browser.newContext({
    viewport: null,
  });

  const pageFarmacia = await contextoFarmacia.newPage();

  try {
    await loginFarmaciaEnPagina(pageFarmacia, nif, password);

    await pageFarmacia.goto(`${BASE_URL}/farmacia/aceptados`, {
      waitUntil: "domcontentloaded",
    });

    const botonFinalizar = pageFarmacia.getByRole("button", {
      name: "Finalizar",
    }).first();

    await botonFinalizar.waitFor({
      state: "visible",
      timeout: 15_000,
    });

    const finalizarResponsePromise = pageFarmacia.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        (
          response.url().includes("/api/pedidos") ||
          response.url().includes("/api/pedido") ||
          response.url().includes("/api/farmacia")
        ),
      { timeout: 30_000 },
    ).catch(() => null);

    await botonFinalizar.click();

    const finalizarResponse = await finalizarResponsePromise;

    if (finalizarResponse) {
      const status = finalizarResponse.status();

      assert(
        status >= 200 && status < 400,
        `Finalizar pedido debería devolver 2xx o 3xx, pero devolvió ${status}`,
      );
    }

    await pageFarmacia.goto(`${BASE_URL}/farmacia/finalizados`, {
      waitUntil: "domcontentloaded",
    });

    const textoFinalizados = await pageFarmacia.locator("body").innerText();

    assert(
      /Pedido/i.test(textoFinalizados),
      "El pedido finalizado debería aparecer en el panel de finalizados de farmacia",
    );

    await pausaVisual();
  } finally {
    await contextoFarmacia.close();
  }

  const contextoUsuario = await browser.newContext({
    viewport: null,
  });

  const pageUsuario = await contextoUsuario.newPage();

  try {
    await loginUsuarioEnPagina(pageUsuario, emailUsuario, passwordUsuario);

    await pageUsuario.goto(`${BASE_URL}/pedidos`, {
      waitUntil: "domcontentloaded",
    });

    const estadoFinalizado = pageUsuario.getByText("Finalizado");

    await estadoFinalizado.first().waitFor({
      state: "visible",
      timeout: 20_000,
    });

    assert(
      await estadoFinalizado.first().isVisible(),
      "El usuario debería ver el pedido con estado finalizado en Mis pedidos",
    );

    await pausaVisual();
  } finally {
    await contextoUsuario.close();
  }
}

async function comprobarRechazarPedido(browser: Browser) {
  const { nif, password } = obtenerCredencialesFarmacia();

  const contextoFarmacia = await browser.newContext({
    viewport: null,
  });

  const pageFarmacia = await contextoFarmacia.newPage();

  try {
    await loginFarmaciaEnPagina(pageFarmacia, nif, password);

    await pageFarmacia.goto(`${BASE_URL}/farmacia/solicitudes`, {
      waitUntil: "domcontentloaded",
    });

    await pageFarmacia.locator("body").waitFor({
      state: "visible",
      timeout: 10_000,
    });

    const textoAntes = await pageFarmacia.locator("body").innerText();

    assert(
      /Pedido/i.test(textoAntes),
      "La farmacia debería tener al menos una solicitud pendiente para rechazar",
    );

    const botonRechazar = pageFarmacia.getByRole("button", {
      name: "Rechazar",
    }).first();

    await botonRechazar.waitFor({
      state: "visible",
      timeout: 15_000,
    });

    const rechazarResponsePromise = pageFarmacia.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("/api/farmacia"),
      { timeout: 30_000 },
    ).catch(() => null);

    await botonRechazar.click();

    const rechazarResponse = await rechazarResponsePromise;

    if (rechazarResponse) {
      const status = rechazarResponse.status();

      assert(
        status >= 200 && status < 400,
        `Rechazar pedido debería devolver 2xx o 3xx, pero devolvió ${status}`,
      );
    }

    await botonRechazar.waitFor({
      state: "detached",
      timeout: 10_000,
    }).catch(async () => {
      await pageFarmacia.reload({ waitUntil: "domcontentloaded" });
    });

    await pageFarmacia.goto(`${BASE_URL}/farmacia/solicitudes`, {
      waitUntil: "domcontentloaded",
    });

    await pageFarmacia.locator("body").waitFor({
      state: "visible",
      timeout: 10_000,
    });

    const textoDespues = await pageFarmacia.locator("body").innerText();

    assert(
      textoDespues.includes("No hay pedidos pendientes") ||
        !(await pageFarmacia.getByRole("button", { name: "Rechazar" }).first().isVisible().catch(
          () => false,
        )),
      "Tras rechazar el pedido, no debería seguir apareciendo una solicitud rechazable para esta farmacia",
    );

    await pausaVisual();
  } finally {
    await contextoFarmacia.close();
  }
}

async function comprobarSinFarmaciasEnRadio(
  browser: Browser,
  email: string,
  password: string,
) {
  const contexto = await browser.newContext({
    viewport: null,
  });

  const page = await contexto.newPage();

  try {
    await loginUsuarioEnPagina(page, email, password);

    await page.goto(`${BASE_URL}/productos`, {
      waitUntil: "domcontentloaded",
    });

    const enlacePrimerProducto = page.locator(
      "a[href*='/productos/'], a[href*='/producto/']",
    ).first();

    await enlacePrimerProducto.waitFor({
      state: "visible",
      timeout: 15_000,
    });

    await enlacePrimerProducto.click();

    const botonAnadirCesta = page.getByRole("button", {
      name: " 🛒 Añadir a la cesta",
    });

    await botonAnadirCesta.first().waitFor({
      state: "visible",
      timeout: 15_000,
    });

    await botonAnadirCesta.first().click();

    await page.waitForTimeout(1_000);

    await page.goto(`${BASE_URL}/cesta`, {
      waitUntil: "domcontentloaded",
    });

    const campoRadio = page.locator("input.info-usuario-input[type='number']").first();

    await campoRadio.waitFor({
      state: "visible",
      timeout: 15_000,
    });

    await campoRadio.fill("0.001");

    assertEquals(await campoRadio.inputValue(), "0.001");

    const botonSolicitar = page.getByRole("button", {
      name: "Hacer Pedido",
    });

    await botonSolicitar.first().waitFor({
      state: "visible",
      timeout: 15_000,
    });

    const mensajeEsperado = "No hay farmacias en el rango especificado.";

    const dialogPromise = page.waitForEvent("dialog", { timeout: 3_000 })
      .then(async (dialog) => {
        const mensaje = dialog.message();
        await dialog.accept();
        return mensaje;
      })
      .catch(() => null);

    const mensajeDomPromise = page.getByText(mensajeEsperado)
      .waitFor({
        state: "visible",
        timeout: 60_000,
      })
      .then(() => mensajeEsperado)
      .catch(() => null);

    await botonSolicitar.first().click();

    const mensajeObtenido = await Promise.race([
      dialogPromise,
      mensajeDomPromise,
    ]);

    assert(
      mensajeObtenido !== null,
      "No apareció ni un alert nativo ni un mensaje visible indicando que no hay farmacias en el radio",
    );

    assertEquals(mensajeObtenido, mensajeEsperado);

    assert(
      page.url().includes("/cesta"),
      "El usuario debería permanecer en la cesta si no hay farmacias disponibles",
    );

    await pausaVisual();
  } finally {
    await contexto.close();
  }
}

Deno.test("Pruebas E2E - autenticación, permisos, recuperación y flujo de pedidos", async (t) => {
  const browser = await chromium.launch({
    headless: false,
    args: [
      "--start-maximized",
      "--window-position=0,0",
      "--window-size=1920,1080",
    ],
  });

  try {
    let credenciales: { email: string; password: string } | undefined;

    await t.step("TP-01 - Cambio entre formulario de usuario y farmacia", async () => {
      const { contexto, page } = await crearPagina(browser);

      try {
        await comprobarCambioFormulario(page);
      } finally {
        await contexto.close();
      }
    });

    await t.step("TP-02 - Registro rechazado porque el correo ya está en uso", async () => {
      const { contexto, page } = await crearPagina(browser);

      try {
        await comprobarCorreoExistente(page);
      } finally {
        await contexto.close();
      }
    });

    await t.step("TP-03 - Registro rechazado porque el teléfono no es válido", async () => {
      const { contexto, page } = await crearPagina(browser);

      try {
        await comprobarTelefonoInvalido(page);
      } finally {
        await contexto.close();
      }
    });

    await t.step(
      "TP-04 - Registro rechazado porque el teléfono no tiene prefijo internacional",
      async () => {
        const { contexto, page } = await crearPagina(browser);

        try {
          await comprobarTelefonoSinPrefijo(page);
        } finally {
          await contexto.close();
        }
      },
    );

    await t.step("TP-05 - Registro correcto de usuario", async () => {
      const { contexto, page } = await crearPagina(browser);

      try {
        credenciales = await comprobarRegistroCorrecto(page);
      } finally {
        await contexto.close();
      }
    });

    await t.step("TP-06 - Inicio de sesión rechazado porque el email no existe", async () => {
      await comprobarLoginFallidoPorEmail(browser);
    });

    await t.step(
      "TP-07 - Inicio de sesión rechazado porque la contraseña es incorrecta",
      async () => {
        assert(credenciales, "No se generaron credenciales de prueba");
        await comprobarLoginFallidoPorPassword(browser, credenciales.email);
      },
    );

    await t.step(
      "TP-08 - Inicio de sesión correcto y persistencia de sesión",
      async () => {
        assert(credenciales, "No se generaron credenciales de prueba");

        await comprobarLoginCorrecto(
          browser,
          credenciales.email,
          credenciales.password,
        );
      },
    );

    await t.step("TP-09 - Inicio de sesión de farmacia correcto", async () => {
      await comprobarLoginFarmaciaCorrecto(browser);
    });

    await t.step("TP-10 - Usuario no puede acceder al panel de farmacia", async () => {
      assert(credenciales, "No se generaron credenciales de usuario");

      await comprobarUsuarioNoAccedeAFarmacia(
        browser,
        credenciales.email,
        credenciales.password,
      );
    });

    await t.step("TP-11 - Farmacia no puede acceder a rutas privadas de usuario", async () => {
      await comprobarFarmaciaNoAccedeARutaUsuario(browser);
    });

    await t.step("TP-14 - Solicitud de recuperación de contraseña", async () => {
      await comprobarRecuperacionContrasena(browser);
    });

    await t.step("TP-16A - Crear pedido para prueba de aceptación", async () => {
      assert(credenciales, "No se generaron credenciales de usuario");

      await comprobarCrearPedidoYConsultarEstado(
        browser,
        credenciales.email,
        credenciales.password,
      );
    });

    await t.step(
      "TP-17A - Aceptar pedido desde farmacia y verificar estado aceptado en usuario",
      async () => {
        assert(credenciales, "No se generaron credenciales de usuario");

        await comprobarAceptarPedido(
          browser,
          credenciales.email,
          credenciales.password,
        );
      },
    );

    await t.step(
      "TP-18 - Finalizar pedido aceptado y verificar estado finalizado en usuario",
      async () => {
        assert(credenciales, "No se generaron credenciales de usuario");

        await comprobarFinalizarPedido(
          browser,
          credenciales.email,
          credenciales.password,
        );
      },
    );

    await t.step("TP-16B - Crear pedido para prueba de rechazo", async () => {
      assert(credenciales, "No se generaron credenciales de usuario");

      await comprobarCrearPedidoYConsultarEstado(
        browser,
        credenciales.email,
        credenciales.password,
      );
    });

    await t.step("TP-17B - Rechazar pedido desde farmacia", async () => {
      await comprobarRechazarPedido(browser);
    });
    await t.step("TP-19 - Sin farmacias en radio", async () => {
      assert(credenciales, "No se generaron credenciales de usuario");

      await comprobarSinFarmaciasEnRadio(
        browser,
        credenciales.email,
        credenciales.password,
      );
    });
  } finally {
    await browser.close();
  }
});
