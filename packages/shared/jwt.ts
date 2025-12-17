import { create, getNumericDate, verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

let key: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (!key) {
    const JWT_SECRET = Deno.env.get("JWT_SECRET");
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET no está configurado");
    }
    key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      true,
      ["sign", "verify"],
    );
  }
  return key;
}

export async function generarToken(payload: { id: string; tipo: "usuario" | "farmacia" }) {
  const cryptoKey = await getKey();
  const jwt = await create(
    { alg: "HS256", typ: "JWT" },
    {
      ...payload,
      exp: getNumericDate(60 * 60 * 24 * 7),
    },
    cryptoKey,
  );
  return jwt;
}

export async function verificarToken(token: string) {
  try {
    const cryptoKey = await getKey();
    const payload = await verify(token, cryptoKey);
    return payload as { id: string; tipo: "usuario" | "farmacia"; exp: number };
  } catch (_error) {
    return null;
  }
}
