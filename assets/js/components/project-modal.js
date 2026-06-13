/* ==================================================================
   components/project-modal.js — modal reutilizable de proyectos
   ------------------------------------------------------------------
   Un único modal para todos los proyectos. Muestra, según el idioma
   activo: categoría, título, descripción, tres párrafos de información
   extendida, dos imágenes internas, la nube de palabras clave y el
   video de YouTube cuando el proyecto tiene un ID válido.
   Accesibilidad: role="dialog", foco atrapado, Escape cierra, el foco
   vuelve al elemento que lo abrió y el fondo no se desplaza.
   ================================================================== */
import { esc, extAttrs } from "../utils/dom.js";
import { isVisible } from "../utils/validation.js";
import { renderYouTubeEmbed } from "./youtube-player.js";

const FOCUSABLE = 'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

export function createProjectModal(ctx) {
  const { data, state, i18n } = ctx;
  let overlay = null;
  let lastOpener = null;

  function ensureDOM() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "project-modal";
    overlay.setAttribute("hidden", "");
    overlay.innerHTML =
      '<div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="project-modal-title" tabindex="-1">' +
      '<button type="button" class="modal-close" id="project-modal-close" aria-label=""><span aria-hidden="true">×</span></button>' +
      '<div class="modal-content" id="project-modal-content"></div>' +
      "</div>";
    document.body.appendChild(overlay);

    /* Cerrar: botón, clic en el fondo y Escape */
    overlay.querySelector("#project-modal-close").addEventListener("click", close);
    overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", (e) => {
      if (!isOpen()) return;
      if (e.key === "Escape") { e.stopPropagation(); close(); return; }
      if (e.key === "Tab") trapFocus(e);
    }, true);
    return overlay;
  }

  function isOpen() {
    return Boolean(overlay) && !overlay.hasAttribute("hidden");
  }

  function trapFocus(e) {
    const dialog = overlay.querySelector(".modal-dialog");
    const focusables = Array.from(dialog.querySelectorAll(FOCUSABLE))
      .filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (!focusables.length) { e.preventDefault(); dialog.focus(); return; }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function findProject(id) {
    return (data.projects || []).find((p) => p.id === id && isVisible(p));
  }

  function buildContent(project) {
    const { t, ui, getLocalizedFallback } = i18n;
    const title = t(project.title);
    const ext = project.extended || {};
    const paragraphs = (t(ext.paragraphs) || [])
      .map((p) => "<p>" + esc(p) + "</p>").join("");
    const images = (ext.images || []).filter(isVisible)
      .map((m) => ctx.images.renderMedia(m, title)).join("");
    const keywords = (ext.keywords || [])
      .map((k) => '<span class="pill">' + esc(k) + "</span>").join("");
    const video = renderYouTubeEmbed(ext.youtubeId, ui("projectVideo") + " — " + title);
    let externalBtn = "";
    if (project.projectUrl && String(project.projectUrl).trim() !== "" && project.showProjectButton !== false) {
      const label = project.projectButtonLabel ? t(project.projectButtonLabel)
        : getLocalizedFallback("buttons", "viewProject") || "Ver proyecto";
      externalBtn = '<div class="project-actions"><a class="btn btn-outline btn-sm" href="' + esc(project.projectUrl) + '"' +
        extAttrs(true) + ">" + esc(label) + " ↗</a></div>";
    }
    return (
      '<span class="project-cat">' + esc(t(project.category)) + "</span>" +
      '<h2 id="project-modal-title">' + esc(title) + "</h2>" +
      "<p class='modal-lede'>" + esc(t(project.description)) + "</p>" +
      (paragraphs
        ? '<h3 class="ai-sub">' + esc(ui("aboutProject")) + "</h3>" + paragraphs
        : "") +
      (images
        ? '<h3 class="ai-sub">' + esc(ui("projectGallery")) + '</h3><div class="modal-gallery">' + images + "</div>"
        : "") +
      (keywords
        ? '<h3 class="ai-sub">' + esc(ui("keywordCloud")) + '</h3><div class="pill-cloud keyword-cloud">' + keywords + "</div>"
        : "") +
      (video
        ? '<h3 class="ai-sub">' + esc(ui("projectVideo")) + "</h3>" + video
        : "") +
      externalBtn
    );
  }

  function open(projectId, opener) {
    const project = findProject(projectId);
    if (!project) return;
    ensureDOM();
    lastOpener = opener || document.activeElement;
    overlay.querySelector("#project-modal-close").setAttribute("aria-label", i18n.ui("closeModal"));
    const content = overlay.querySelector("#project-modal-content");
    content.innerHTML = buildContent(project);
    ctx.images.armMediaFallbacks(content);
    overlay.removeAttribute("hidden");
    document.body.classList.add("modal-open"); /* bloquea el scroll del fondo */
    const dialog = overlay.querySelector(".modal-dialog");
    dialog.scrollTop = 0;
    requestAnimationFrame(() => {
      overlay.classList.add("open");
      overlay.querySelector("#project-modal-close").focus();
    });
  }

  function close() {
    if (!isOpen()) return;
    overlay.classList.remove("open");
    overlay.setAttribute("hidden", "");
    document.body.classList.remove("modal-open");
    if (lastOpener && document.contains(lastOpener)) lastOpener.focus(); /* el foco vuelve al origen */
    lastOpener = null;
  }

  /* Delegación global: tarjetas con data-project-open (clic y teclado). */
  function bindGlobalTriggers() {
    document.addEventListener("click", (e) => {
      const card = e.target.closest("[data-project-open]");
      if (!card) return;
      if (e.target.closest("a")) return; /* los enlaces internos conservan su comportamiento */
      open(card.getAttribute("data-project-open"), card);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest && e.target.closest("[data-project-open]");
      if (!card || e.target.closest("a")) return;
      e.preventDefault();
      open(card.getAttribute("data-project-open"), card);
    });
  }

  return { open, close, isOpen, bindGlobalTriggers };
}
