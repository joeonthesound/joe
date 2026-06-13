/* ==================================================================
   app.js — punto de entrada (composición de módulos y arranque)
   ------------------------------------------------------------------
   Este archivo NO contiene contenido del sitio: todo el contenido
   vive en /data/site-content.json. Aquí solo se cargan los datos,
   se componen los módulos y se conectan los eventos globales.
   ================================================================== */
import { loadSiteContent, renderFatalError } from "./core/content-loader.js";
import { createLocale } from "./core/locale.js";
import { createI18n } from "./core/i18n.js";
import { createRevealObserver } from "./utils/dom.js";
import { createImageManager } from "./components/image-manager.js";
import { createProjectModal } from "./components/project-modal.js";
import { createProjectGrid } from "./components/project-grid.js";
import { createAIClassification } from "./components/ai-classification.js";
import { createWizard } from "./components/opportunity-form.js";
import { createRenderer } from "./core/renderer.js";
import { createRouter } from "./core/router.js";

async function main() {
  const data = await loadSiteContent();
  const settings = data.settings || {};
  const locale = createLocale(settings);

  const state = {
    /* El idioma de la página lo declara <html data-lang="xx"> (cada
       directorio de idioma). Como respaldo: la URL y la preferencia. */
    lang: locale.getLanguageFromDocument() || locale.detectPreferredLanguage(),
    theme: settings.defaultTheme || "light"
  };

  /* Contexto compartido entre módulos (evita variables globales) */
  const ctx = { data, settings, state, locale };
  ctx.i18n = createI18n(ctx);
  ctx.reveals = createRevealObserver();
  ctx.images = createImageManager(ctx);
  ctx.modal = createProjectModal(ctx);
  ctx.grid = createProjectGrid(ctx);
  ctx.ai = createAIClassification(ctx);
  ctx.wizard = createWizard(ctx);
  ctx.renderer = createRenderer(ctx);
  ctx.router = createRouter(ctx);

  /* ---------- Arranque ---------- */
  ctx.renderer.applyTheme();
  ctx.renderer.renderChrome();
  ctx.renderer.renderNav();
  ctx.ai.injectJSONLD();
  ctx.modal.bindGlobalTriggers();
  if (!location.hash) location.replace("#/inicio");
  ctx.router.renderRoute();

  window.addEventListener("hashchange", ctx.router.renderRoute);

  document.getElementById("menu-toggle").addEventListener("click", function () {
    const nav = document.getElementById("main-nav");
    const open = nav.classList.toggle("open");
    this.setAttribute("aria-expanded", String(open));
    this.setAttribute("aria-label", open ? ctx.i18n.ui("menuClose") : ctx.i18n.ui("menuOpen"));
  });

  document.getElementById("theme-toggle").addEventListener("click", function () {
    state.theme = state.theme === "light" ? "dark" : "light";
    ctx.renderer.applyTheme();
  });

  document.getElementById("lang-select").addEventListener("change", function () {
    const nextLang = this.value;
    const currentHash = location.hash || "#/inicio";
    locale.rememberLanguage(nextLang);
    if (locale.getLanguageFromPath() || document.documentElement.getAttribute("data-lang")) {
      /* Navegación relativa: conserva subdirectorios de despliegue */
      location.href = locale.languageUrl(nextLang, currentHash);
      return;
    }
    state.lang = nextLang;
    ctx.renderer.renderChrome();
    ctx.renderer.renderNav();
    ctx.router.renderRoute();
    ctx.ai.injectJSONLD();
  });

  /* navegación por teclado: Escape cierra el menú móvil
     (el modal de proyectos gestiona su propio Escape con prioridad) */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !ctx.modal.isOpen()) {
      document.getElementById("main-nav").classList.remove("open");
      document.getElementById("menu-toggle").setAttribute("aria-expanded", "false");
    }
  });
}

main().catch(renderFatalError);
