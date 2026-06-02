import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 100 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.05"],
  },
};

const env = (name, fallback = "") => __ENV[name] || fallback;

const BASE_URL = env("K6_BASE_URL", "https://tfg.mine-j.deno.net");
const USER_EMAIL = env("K6_USER_EMAIL");
const USER_PASSWORD = env("K6_USER_PASSWORD");
const FARMACIA_NIF = env("K6_FARMACIA_NIF");
const FARMACIA_PASSWORD = env("K6_FARMACIA_PASSWORD");

export default function () {
  const home = http.get(`${BASE_URL}/`);
  check(home, { "home 200": (r) => r.status === 200 });
  sleep(1);

  const productos = http.get(`${BASE_URL}/productos`);
  check(productos, { "productos 200": (r) => r.status === 200 });
  sleep(1);

  const register = http.get(`${BASE_URL}/auth/register`);
  check(register, { "register 200": (r) => r.status === 200 });
  sleep(1);

  // Escenario opcional: usuario autenticado (rutas criticas con BD)
  if (USER_EMAIL && USER_PASSWORD) {
    const loginUsuario = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ tipo: "usuario", email: USER_EMAIL, password: USER_PASSWORD }),
      { headers: { "Content-Type": "application/json" } },
    );
    check(loginUsuario, { "login usuario 200": (r) => r.status === 200 });

    if (loginUsuario.status === 200) {
      const cestaApi = http.get(`${BASE_URL}/api/producto/productosCesta`);
      check(cestaApi, { "api productosCesta 200": (r) => r.status === 200 });

      const pedidosApi = http.get(`${BASE_URL}/api/pedidos/obtenerPedidos`);
      check(pedidosApi, { "api obtenerPedidos 200": (r) => r.status === 200 });

      const cestaPage = http.get(`${BASE_URL}/cesta`);
      check(cestaPage, { "page cesta 200": (r) => r.status === 200 });

      const pedidosPage = http.get(`${BASE_URL}/pedidos`);
      check(pedidosPage, { "page pedidos 200": (r) => r.status === 200 });
    }

    http.post(`${BASE_URL}/api/auth/logout`, null);
    sleep(1);
  }

  // Escenario opcional: farmacia autenticada (panel + SSE)
  if (FARMACIA_NIF && FARMACIA_PASSWORD) {
    const loginFarmacia = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ tipo: "farmacia", nif: FARMACIA_NIF, password: FARMACIA_PASSWORD }),
      { headers: { "Content-Type": "application/json" } },
    );
    check(loginFarmacia, { "login farmacia 200": (r) => r.status === 200 });

    if (loginFarmacia.status === 200) {
      const panelSolicitudes = http.get(`${BASE_URL}/farmacia/solicitudes`);
      check(panelSolicitudes, { "panel solicitudes 200": (r) => r.status === 200 });

      const pedidosPendientes = http.get(
        `${BASE_URL}/api/farmacia/solicitudesFarmacia/pedidos?tipo=Pendiente`,
      );
      check(pedidosPendientes, { "api pedidos farmacia 200": (r) => r.status === 200 });
    }

    http.post(`${BASE_URL}/api/auth/logout`, null);
    sleep(1);
  }
}
