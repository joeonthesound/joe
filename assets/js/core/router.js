/* ==================================================================
   core/router.js — router SPA (#/ruta?parametros)
   ================================================================== */

export function createRouter(ctx) {
  const { data, i18n } = ctx;

  function parseHash() {
    const raw = (location.hash || "#/inicio").replace(/^#/, "");
    const qIndex = raw.indexOf("?");
    const path = (qIndex > -1 ? raw.slice(0, qIndex) : raw) || "/inicio";
    const params = {};
    if (qIndex > -1) {
      raw.slice(qIndex + 1).split("&").forEach(function (pair) {
        const kv = pair.split("=");
        if (kv[0]) params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || "");
      });
    }
    return { path: path, params: params };
  }

  function renderRoute() {
    const app = document.getElementById("app");
    const parsed = parseHash();
    const route = data.routes[parsed.path] || data.routes["/inicio"];
    /* preselección desde la URL: #/contacto?tipo=cartas|consultor|planilla */
    if (parsed.params.tipo) ctx.wizard.preselect(parsed.params.tipo);

    const BLOCKS = ctx.renderer.BLOCKS;
    const html = (route.blocks || []).map(function (name) {
      return BLOCKS[name] ? BLOCKS[name]() : "";
    }).join("");
    app.innerHTML = '<div class="route-page">' + html + "</div>";
    document.title = i18n.t(route.title) + " — Josueth Acevedo Cruz";
    ctx.images.armMediaFallbacks(app);
    ctx.reveals.observe(app);
    if (document.getElementById("wizard")) ctx.wizard.renderWizard();
    ctx.renderer.updateNavCurrent(parsed.path);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    /* cerrar menú móvil al navegar */
    const nav = document.getElementById("main-nav");
    nav.classList.remove("open");
    document.getElementById("menu-toggle").setAttribute("aria-expanded", "false");
  }

  return { parseHash, renderRoute };
}
