/* ==================================================================
   core/config.js — rutas base del sitio
   ------------------------------------------------------------------
   Todas las rutas se resuelven RELATIVAS a este módulo
   (/assets/js/core/config.js → ../../../ = raíz del sitio), de modo
   que el proyecto funciona igual publicado en la raíz de un dominio
   o dentro de un subdirectorio (GitHub Pages de proyecto, etc.).
   ================================================================== */

/** URL absoluta de la raíz del sitio. */
export const SITE_ROOT_URL = new URL("../../../", import.meta.url);

/** URL del JSON central de contenido. */
export const DATA_URL = new URL("data/site-content.json", SITE_ROOT_URL);

/** Convierte una ruta relativa a la raíz del sitio en URL absoluta. */
export function rootAsset(path) {
  return new URL(String(path || "").replace(/^\/+/, ""), SITE_ROOT_URL).href;
}
