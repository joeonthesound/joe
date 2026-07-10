/* ==================================================================
   core/router.js — router SPA con History API (URLs reales /xx/ruta)
   Reemplaza al router por hash. Rutas reales: /es/proyectos, /en/contacto, ...
   ================================================================== */

export function createRouter(ctx) {
  const { data, i18n } = ctx;

  /* Idioma de esta carcasa = primer segmento de la URL (/en/..., /es/...).
     No cambia durante la sesión: cambiar de idioma recarga en /xx/. */
  const LANG = (location.pathname.replace(/\/+$/, "").split("/").filter(Boolean)[0])
            || (data.settings && data.settings.defaultLanguage) || "es";
  const BASE = "/" + LANG + "/";

  /* Convierte un href de contenido ("#/contacto?tipo=x" o "/contacto") en una
     URL real ("/en/contacto?tipo=x"). Úsalo en renderer.js al pintar enlaces. */
  function toUrl(href) {
    if (!href) return href;
    if (/^([a-z]+:|\/\/|mailto:|tel:|#$)/i.test(href)) return href; /* externo / ancla vacía */
    let raw = href.replace(/^#/, "");                /* "#/contacto?x" -> "/contacto?x" */
    if (raw.charAt(0) !== "/") raw = "/" + raw;
    if (raw === BASE || raw.indexOf(BASE) === 0) return raw;   /* ya es URL real con idioma: no re-prefijar */
    const qi = raw.indexOf("?");
    const path = qi > -1 ? raw.slice(0, qi) : raw;
    const query = qi > -1 ? raw.slice(qi) : "";
    if (path === "/inicio" || path === "/") return BASE + query;   /* home limpio: /en/ */
    return BASE + path.replace(/^\//, "") + query;
  }

  function parsePath() {
    const segs = location.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    const routePart = segs.slice(1).join("/");        /* quita el idioma */
    const path = "/" + (routePart || "inicio");
    const params = {};
    new URLSearchParams(location.search).forEach(function (v, k) { params[k] = v; });
    return { path: path, params: params };
  }

  function navigate(href) {
    const url = toUrl(href);
    if (!url) return;
    if (url === location.pathname + location.search) return;        /* ya estamos ahí */
    history.pushState({}, "", url);
    renderRoute();
  }

  function updateCanonical(path) {
    const clean = location.origin + BASE + (path === "/inicio" ? "" : path.replace(/^\//, ""));
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = clean;
    /* description por ruta (opcional): añade data.seoByRoute[path].description en el JSON */
    const seo = data.seoByRoute && data.seoByRoute[path];
    if (seo && seo.description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) { m = document.createElement("meta"); m.name = "description"; document.head.appendChild(m); }
      m.content = i18n.t(seo.description);
    }
  }

  function renderRoute() {
    const app = document.getElementById("app");
    const parsed = parsePath();
    const route = data.routes[parsed.path] || data.routes["/inicio"];
    /* preselección desde la URL: /contacto?tipo=cartas|consultor|planilla */
    if (parsed.params.tipo) ctx.wizard.preselect(parsed.params.tipo);

    const BLOCKS = ctx.renderer.BLOCKS;
    const html = (route.blocks || []).map(function (name) {
      return BLOCKS[name] ? BLOCKS[name]() : "";
    }).join("");
    app.innerHTML = '<div class="route-page">' + html + "</div>";

    document.title = i18n.t(route.title) + " — Josueth Acevedo Cruz";
    updateCanonical(parsed.path);

    ctx.images.armMediaFallbacks(app);
    ctx.reveals.observe(app);
    if (document.getElementById("wizard")) ctx.wizard.renderWizard();
    ctx.renderer.updateNavCurrent(parsed.path);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    /* cerrar menú móvil al navegar */
    const nav = document.getElementById("main-nav");
    if (nav) nav.classList.remove("open");
    const toggle = document.getElementById("menu-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  /* Intercepta clics en enlaces internos (reales o legacy "#/...") -> pushState.
     Así, aunque algún href siga siendo "#/...", navega sin recargar. */
  function onClick(e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    if (a.hasAttribute("data-native")) return;
    const href = a.getAttribute("href");
    if (!href) return;
    const isLegacyHash = href.charAt(0) === "#" && href.charAt(1) === "/";
    const isInternalReal = href.charAt(0) === "/" && href.indexOf(BASE) === 0;
    if (!isLegacyHash && !isInternalReal) return;   /* externos y anclas: pasan de largo */
    e.preventDefault();
    navigate(href);
  }

  function start() {
    window.addEventListener("popstate", renderRoute);
    document.addEventListener("click", onClick);
  }

  /* parseHash se mantiene como alias por compatibilidad con código antiguo */
  return {
    parsePath: parsePath, parseHash: parsePath,
    renderRoute: renderRoute, navigate: navigate, toUrl: toUrl, start: start
  };
}
