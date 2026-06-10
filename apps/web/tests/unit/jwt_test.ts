import { assert, assertEquals } from "$std/assert/mod.ts";
import { generarToken, verificarToken } from "@shared/jwt.ts";

Deno.test({
  name: "genera y verifica un token JWT válido",
  permissions: { env: true, net: true },
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
  name: "rechaza un token alterado",
  permissions: { env: true, net: true },
  async fn() {
    Deno.env.set("JWT_SECRET", "test-secret-jwt");

    const token = await generarToken({ id: "farmacia-456", tipo: "farmacia" });
    const tokenAlterado = `${token.slice(0, -1)}x`;

    const payload = await verificarToken(tokenAlterado);
    assertEquals(payload, null);
  },
});
