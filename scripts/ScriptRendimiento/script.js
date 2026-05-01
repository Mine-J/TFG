import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m",  target: 50 },
    { duration: "30s", target: 100 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.05"],
  },
};

const BASE_URL = "https://tfg.mine-j.deno.net";

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
}