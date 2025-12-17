import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  POST: () => {
    const headers = new Headers();
    headers.set(
      "Set-Cookie",
      "auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict",
    );
    headers.set("Location", "/auth/login");

    return new Response(null, {
      status: 303,
      headers,
    });
  },
};
