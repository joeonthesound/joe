/* ==================================================================
   components/project-grid.js — tarjetas de proyectos clicables
   ------------------------------------------------------------------
   Cada tarjeta abre el modal del proyecto (clic, Enter o Espacio).
   El botón externo "Ver proyecto" (projectUrl) se conserva y no
   interfiere con la apertura del modal.
   ================================================================== */
import { esc, extAttrs } from "../utils/dom.js";
import { isVisible } from "../utils/validation.js";

export function createProjectGrid(ctx) {
  const { data, i18n } = ctx;

  function shouldShowProjectButton(project) {
    return Boolean(
      project &&
      project.projectUrl &&
      String(project.projectUrl).trim() !== "" &&
      project.showProjectButton !== false
    );
  }

  function renderProjectCard(project) {
    if (!isVisible(project)) return "";
    const { t, ui, getLocalizedFallback } = i18n;
    const title = t(project.title);
    const tags = (project.tags || []).map((tg) => '<span class="chip">' + esc(tg) + "</span>").join("");
    let buttonHTML = "";
    if (shouldShowProjectButton(project)) {
      const label = project.projectButtonLabel ? t(project.projectButtonLabel)
        : getLocalizedFallback("buttons", "viewProject") || "Ver proyecto";
      buttonHTML = '<div class="project-actions"><a class="btn btn-outline btn-sm" href="' + esc(project.projectUrl) +
        '"' + extAttrs(true) + ' aria-label="' + esc(label + ": " + title) + '">' +
        esc(label) + " ↗</a></div>";
    }
    const detailsLabel = ui("projectDetails");
    return '<article class="card project-card reveal" data-project-open="' + esc(project.id) + '"' +
      ' role="button" tabindex="0" aria-haspopup="dialog"' +
      ' aria-label="' + esc(detailsLabel + ": " + title) + '">' +
      ctx.images.renderMedia(project.media, title) +
      '<span class="project-cat">' + esc(t(project.category)) + "</span>" +
      "<h3>" + esc(title) + "</h3>" +
      "<p>" + esc(t(project.description)) + "</p>" +
      '<div class="chiprow">' + tags + "</div>" +
      '<span class="project-more" aria-hidden="true">' + esc(detailsLabel) + " →</span>" +
      buttonHTML +
      "</article>";
  }

  function renderProjectsGrid() {
    return (data.projects || []).filter(isVisible).map(renderProjectCard).join("");
  }

  return { renderProjectCard, renderProjectsGrid, shouldShowProjectButton };
}
