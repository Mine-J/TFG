import { create, getNumericDate, verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const JWT_SECRET = Deno.env.get("JWT_SECRET");
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(JWT_SECRET),
  { name: "HMAC", hash: "SHA-256" },
  true,
  ["sign", "verify"],
);

export async function generarToken(payload: { id: string; tipo: "usuario" | "farmacia" }) {
  const jwt = await create(
    { alg: "HS256", typ: "JWT" },
    {
      ...payload,
      exp: getNumericDate(60 * 60 * 24 * 7),
    },
    key,
  );
  return jwt;
}

export async function verificarToken(token: string) {
  try {
    const payload = await verify(token, key);
    return payload as { id: string; tipo: "usuario" | "farmacia"; exp: number };
  } catch (_error) {
    return null;
  }
}
