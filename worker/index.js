import { handle } from "./room.js";
import { json } from "./http.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    try {
      return await handle(request, env, url);
    } catch (err) {
      console.error(JSON.stringify({
        message: "api failed",
        method: request.method,
        path: url.pathname,
        error: err instanceof Error ? err.message : "error",
      }));
      return json(request, 500, { error: "server" });
    }
  },
};
