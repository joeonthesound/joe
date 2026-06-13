/* ==================================================================
   core/content-loader.js — carga del JSON central de contenido
   ================================================================== */
import { DATA_URL } from "./config.js";
import { esc } from "../utils/dom.js";

/** Descarga y parsea /data/site-content.json. Lanza error si falla. */
export async function loadSiteContent() {
  const res = await fetch(DATA_URL, { cache: "no-cache" });
  if (!res.ok) {
    throw new Error("No se pudo cargar site-content.json (HTTP " + res.status + ")");
  }
  return res.json();
}

/** Mensaje de error visible y accesible si el contenido no carga
    (p. ej. al abrir con file:// sin servidor local). */
export function renderFatalError(error) {
  const app = document.getElementById("app");
  const isFile = location.protocol === "file:";
  const hint = isFile
    ? "Estás abriendo el sitio con el protocolo file://. Inicia un servidor local, por ejemplo: python -m http.server 8000, y entra a http://localhost:8000/"
    : "Revisa la conexión o vuelve a intentarlo en unos segundos.";
  if (app) {
    app.innerHTML =
      '<section class="section" style="padding-top:calc(var(--header-h) + 56px)"><div class="container">' +
      '<div class="card" role="alert">' +
      "<h2>El contenido no pudo cargarse / Content could not be loaded</h2>" +
      "<p>" + esc(hint) + "</p>" +
      '<p class="footer-meta">' + esc(error && error.message ? error.message : String(error)) + "</p>" +
      "</div></div></section>";
  }
  /* También en consola para diagnóstico */
  console.error("[site] Error cargando contenido:", error);
}
