/* ==================================================================
   _worker.js — Cloudflare Pages (Advanced Mode)
   ------------------------------------------------------------------
   Fallback SPA por idioma para URLs reales /{idioma}/{ruta}/.

   Comportamiento:
   1) Intenta servir el asset estático real tal cual (CSS, JS, imágenes,
      fuentes, /data/site-content.json, sitemap.xml, robots.txt, etc.).
   2) Si NO existe, y la ruta cae bajo un idioma soportado y NO parece
      un archivo (sin extensión), devuelve /{idioma}/index.html con 200,
      conservando la URL visible (no redirige).
   3) Cualquier otro recurso inexistente devuelve un 404 HTTP real.

   - No intercepta recursos: si el asset existe, se sirve directo.
   - Un .js/.css/.json/.png inexistente NUNCA recibe HTML: devuelve 404.
   - No cambia la URL visible (no usa Location/redirect).
   - No genera bucles (cada petición se resuelve en un solo paso).

   UBICACIÓN: raíz del directorio de salida publicado en Cloudflare Pages.
   IMPORTANTE: si existe _worker.js, Cloudflare ignora _redirects y
   /functions. Usa este archivo O _redirects, no ambos.
   ================================================================== */

const SUPPORTED = ["es", "br", "en", "fr", "de", "ar", "zh", "ja"];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1) Asset estático real (incluye index.html de cada idioma e /data/*).
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return asset;

    // 2) ¿Ruta de SPA bajo un idioma soportado?
    const segments = pathname.split("/").filter(Boolean); // "/de/projekte/" -> ["de","projekte"]
    const lang = segments[0];
    const last = segments.length ? segments[segments.length - 1] : "";
    const looksLikeFile = last.indexOf(".") !== -1; // p.ej. imagen.png, datos.json

    if (SUPPORTED.indexOf(lang) !== -1 && !looksLikeFile) {
      const shellURL = new URL("/" + lang + "/index.html", url.origin);
      const shell = await env.ASSETS.fetch(new Request(shellURL.toString(), request));
      if (shell.status === 200) {
        // Carcasa del idioma con 200, SIN cambiar la URL visible.
        return new Response(shell.body, { status: 200, headers: shell.headers });
      }
    }

    // 3) Recurso o ruta inexistente: 404 HTTP real.
    return asset;
  }
};