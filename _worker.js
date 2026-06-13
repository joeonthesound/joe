const LANGUAGES = new Set([
  "es",
  "br",
  "en",
  "fr",
  "de",
  "ar",
  "zh",
  "ja"
]);

const STATIC_FILE_PATTERN =
  /\.(?:css|js|mjs|json|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|xml|txt|pdf|mp4|webm)$/i;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: {
          Allow: "GET, HEAD"
        }
      });
    }

    /*
     * Intenta servir primero el recurso exacto.
     * Esto permite cargar CSS, JavaScript, JSON, imágenes, etc.
     */
    const assetResponse = await env.ASSETS.fetch(request);

    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    /*
     * Un recurso con extensión que no existe debe conservar el 404.
     * No debe recibir index.html.
     */
    if (STATIC_FILE_PATTERN.test(url.pathname)) {
      return assetResponse;
    }

    const segments = url.pathname
      .split("/")
      .filter(Boolean);

    const language = segments[0];

    /*
     * /de/projekte/  → /de/index.html
     * /es/proyectos/ → /es/index.html
     */
    if (LANGUAGES.has(language)) {
      const shellUrl = new URL(`/${language}/index.html`, url.origin);

      const shellRequest = new Request(shellUrl, {
        method: request.method,
        headers: request.headers
      });

      return env.ASSETS.fetch(shellRequest);
    }

    /*
     * La raíz utiliza /index.html.
     */
    if (url.pathname === "/") {
      const rootUrl = new URL("/index.html", url.origin);

      return env.ASSETS.fetch(
        new Request(rootUrl, {
          method: request.method,
          headers: request.headers
        })
      );
    }

    return new Response("Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8"
      }
    });
  }
};