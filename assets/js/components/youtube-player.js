/* ==================================================================
   components/youtube-player.js — video opcional de YouTube
   ------------------------------------------------------------------
   Solo se renderiza cuando el ID es válido (11 caracteres [A-Za-z0-9_-]).
   Sin ID válido devuelve cadena vacía: no queda espacio en blanco.
   Usa el dominio youtube-nocookie.com (modo de privacidad mejorada).
   ================================================================== */
import { esc } from "../utils/dom.js";
import { isValidYouTubeId } from "../utils/validation.js";

export function renderYouTubeEmbed(youtubeId, title) {
  if (!isValidYouTubeId(youtubeId)) return "";
  const id = String(youtubeId).trim();
  return '<div class="video-frame">' +
    '<iframe src="https://www.youtube-nocookie.com/embed/' + esc(id) + '"' +
    ' title="' + esc(title || "YouTube video") + '"' +
    ' loading="lazy"' +
    ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"' +
    ' referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>' +
    "</div>";
}
