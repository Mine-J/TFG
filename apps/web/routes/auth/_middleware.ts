import { FreshContext } from "$fresh/server.ts";
import { verificarToken } from "../../../../packages/shared/jwt.ts";

export async function handler(req: Request, ctx: FreshContext) {
  const headers = req.headers;
  const cookie = headers.get("Cookie");
  const cookies = cookie?.split(";");
  const authToken = cookies?.find((c) => c.trim().startsWith("auth_token="))?.split("=")[1];

  if (authToken) {
    const payload = await verificarToken(authToken);
    if (payload) {
      const headers = new Headers();
      headers.set("location", "/");
      return new Response(null, {
        status: 303,
        headers,
      });
    }
  }
  return await ctx.next();
}
