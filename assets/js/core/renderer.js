/* ==================================================================
   core/renderer.js — bloques de página, navegación, idioma y tema
   ------------------------------------------------------------------
   Cada ruta del JSON combina libremente los bloques de este registro.
   MIGRACIÓN A URLS REALES: los enlaces internos se pintan con
   ctx.router.toUrl(...) en vez de "#/...". Los externos no cambian
   (toUrl los deja intactos).
   ================================================================== */
import { esc, extAttrs } from "../utils/dom.js";
import { isVisible } from "../utils/validation.js";

export function createRenderer(ctx) {
  const { data, state, i18n, locale } = ctx;
  const SETTINGS = data.settings || {};
  const LINKS = data.links || {};
  const { t, ui } = i18n;

  /* Convierte cualquier href interno a URL real; deja pasar los externos.
     ctx.router ya existe cuando estas funciones se ejecutan. */
  function url(href) { return ctx.router.toUrl(href); }

  function linkOf(item) {
    if (!item) return "#";
    if (item.linkRef && LINKS[item.linkRef]) return LINKS[item.linkRef];
    return url(item.href || "#");
  }

  function sectionHead(eyebrow, heading, lead) {
    return '<div class="section-head reveal">' +
      (eyebrow ? '<p class="eyebrow">' + esc(t(eyebrow)) + "</p>" : "") +
      "<h2>" + esc(t(heading)) + "</h2>" +
      (lead ? '<p class="lead">' + esc(t(lead)) + "</p>" : "") +
      "</div>";
  }

  const BLOCKS = {
    hero: function () {
      const h = data.hero;
      if (!isVisible(h)) return "";
      const badges = (t(h.badges) || []).map(function (b) {
        return '<span class="badge">' + esc(b) + "</span>";
      }).join("");
      const btnStyle = { primary: "btn-primary", outline: "btn-outline", copper: "btn-copper", ghost: "btn-ghost" };
      const visibleButtons = (h.buttons || []).filter(isVisible);
      const primaryButton = visibleButtons[0] ? '<a class="btn btn-primary" href="' + esc(linkOf(visibleButtons[0])) + '"' +
        extAttrs(visibleButtons[0].external) + ">" + esc(t(visibleButtons[0].label)) + "</a>" : "";
      const portfolioButton = visibleButtons.find(function (b) { return b.linkRef === "portfolioOnline"; }) || visibleButtons[1];
      const secondaryButton = portfolioButton ? '<a class="btn ' + (btnStyle[portfolioButton.style] || "btn-outline") + '" href="' + esc(linkOf(portfolioButton)) + '"' +
        extAttrs(portfolioButton.external) + ">" + esc(t(portfolioButton.label)) + "</a>" : "";
      const supportLinks = visibleButtons.slice(1).filter(function (b) { return b !== portfolioButton; }).map(function (b) {
        return '<a class="btn ' + (btnStyle[b.style] || "btn-outline") + '" href="' + esc(linkOf(b)) + '"' +
          extAttrs(b.external) + ">" + esc(t(b.label)) + "</a>";
      }).join("");
      return '<section class="hero" aria-label="' + esc(h.name) + '"><div class="container">' +
        '<div class="hero-layout">' +
        '<div class="hero-copy reveal">' +
        '<p class="hero-kicker"><span class="dot" aria-hidden="true"></span>' + esc(t(h.kicker)) + "</p>" +
        "<h1>" + esc(h.name) + "</h1>" +
        '<p class="hero-title">' + t(h.title) + "</p>" +
        '<p class="hero-sub">' + esc(t(h.subtitle)) + "</p>" +
        '<div class="hero-cta">' + primaryButton + secondaryButton + "</div>" +
        (supportLinks ? '<div class="hero-support">' + supportLinks + "</div>" : "") +
        "</div>" +
        '<div class="hero-visual reveal">' +
        '<div class="hero-frame">' +
        '<div class="hero-logo-stage" aria-hidden="true"><span class="hero-logo-mark"></span></div>' +
        '<p class="hero-rule">' + esc(t(h.ruleLabel)) + "</p></div>" +
        '<div class="badges">' + badges + "</div>" +
        "</div></div></div></section>";
    },

    profile: function () {
      const p = data.profile;
      if (!isVisible(p)) return "";
      const paragraphs = (t(p.paragraphs) || []).map(function (x) { return "<p>" + x + "</p>"; }).join("");
      const facts = (t(p.facts) || []).map(function (f) {
        return '<li><span class="k">' + esc(f.k) + '</span><span class="v">' + esc(f.v) + "</span></li>";
      }).join("");
      return '<section class="section" id="perfil-profesional"><div class="container">' +
        sectionHead(p.eyebrow, p.heading, null) +
        '<div class="profile-cols">' +
        '<div class="profile-text reveal">' + paragraphs +
        '<div class="value-block">' + esc(t(p.valueBlock)) + "</div></div>" +
        '<div class="reveal">' + ctx.images.renderMedia(p.media, t(p.heading)) +
        '<ul class="fact-list">' + facts + "</ul></div>" +
        "</div></div></section>";
    },

    expertiseCards: function (limit) {
      const e = data.expertise;
      const cards = (e.cards || []).filter(isVisible).slice(0, limit || 99).map(function (c, i) {
        const tools = (c.tools || []).map(function (tl) { return '<span class="chip">' + esc(tl) + "</span>"; }).join("");
        return '<article class="card reveal">' +
          '<span class="card-index">' + String(i + 1).padStart(2, "0") + "</span>" +
          "<h3>" + esc(t(c.title)) + "</h3><p>" + esc(t(c.description)) + "</p>" +
          '<div class="chiprow">' + tools + "</div></article>";
      }).join("");
      return cards;
    },
    expertisePreview: function () {
      const e = data.expertise;
      if (!isVisible(e)) return "";
      return '<section class="section"><div class="container">' +
        sectionHead(e.eyebrow, e.heading, e.lead) +
        '<div class="grid grid-4">' + BLOCKS.expertiseCards(4) + "</div>" +
        '<div style="margin-top:26px" class="reveal"><a class="btn btn-ghost" href="' + esc(url("#/expertise")) + '">' +
        esc(state.lang === "es" ? "Ver las 8 áreas de especialidad →" : "See all 8 areas of expertise →") + "</a></div>" +
        "</div></section>";
    },
    expertiseFull: function () {
      const e = data.expertise;
      if (!isVisible(e)) return "";
      return '<section class="section" style="padding-top:calc(var(--header-h) + 56px)"><div class="container">' +
        sectionHead(e.eyebrow, e.heading, e.lead) +
        '<div class="grid grid-3">' + BLOCKS.expertiseCards() + "</div>" +
        "</div></section>";
    },

    collaboration: function () {
      const c = data.collaboration;
      if (!isVisible(c)) return "";
      function modelCard(m) {
        if (!isVisible(m)) return "";
        const items = (t(m.items) || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
        return '<article class="card model-card reveal">' +
          '<span class="model-tag">' + esc(t(m.tag)) + "</span>" +
          "<h3>" + esc(t(m.title)) + "</h3><p>" + esc(t(m.intro)) + "</p>" +
          '<ul class="tick-list">' + items + "</ul>" +
          '<div class="model-foot"><a class="btn btn-primary btn-sm" href="' + esc(url(m.cta.href)) + '">' + esc(t(m.cta.label)) + "</a></div>" +
          "</article>";
      }
      return '<section class="section"><div class="container">' +
        sectionHead(c.eyebrow, c.heading, null) +
        '<div class="model-grid">' + modelCard(c.consulting) + modelCard(c.payroll) + "</div>" +
        "</div></section>";
    },
    consultingPage: function () {
      const c = data.collaboration;
      const m = c.consulting;
      if (!isVisible(c) || !isVisible(m)) return "";
      const items = (t(m.items) || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
      return '<section class="section" style="padding-top:calc(var(--header-h) + 56px)"><div class="container">' +
        sectionHead(c.eyebrow, m.title, m.intro) +
        '<div class="grid grid-2 reveal"><div class="card"><ul class="tick-list">' + items + "</ul></div>" +
        '<div class="card"><h3>' + esc(state.lang === "es" ? "Cómo empieza" : "How it starts") + "</h3><p>" +
        esc(state.lang === "es"
          ? "Una primera conversación para entender el contexto, el problema y los objetivos. Después, una propuesta clara con alcance, entregables y tiempos."
          : "A first conversation to understand context, problem and goals. Then a clear proposal with scope, deliverables and timeline.") +
        '</p><div class="model-foot"><a class="btn btn-primary" href="' + esc(url(m.cta.href)) + '">' + esc(t(m.cta.label)) + "</a></div></div></div>" +
        "</div></section>";
    },
    payrollPage: function () {
      const c = data.collaboration;
      const m = c.payroll;
      if (!isVisible(c) || !isVisible(m)) return "";
      const pills = (t(m.items) || []).map(function (x) { return '<span class="pill">' + esc(x) + "</span>"; }).join("");
      return '<section class="section" style="padding-top:calc(var(--header-h) + 56px)"><div class="container">' +
        sectionHead(c.eyebrow, m.title, m.intro) +
        '<div class="pill-cloud reveal">' + pills + "</div>" +
        '<div style="margin-top:30px" class="reveal"><a class="btn btn-primary" href="' + esc(url(m.cta.href)) + '">' + esc(t(m.cta.label)) + "</a></div>" +
        "</div></section>";
    },

    availability: function () {
      const a = data.availability;
      if (!isVisible(a)) return "";
      const items = (t(a.items) || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
      const pills = (t(a.pills) || []).map(function (x) { return '<span class="pill pill-accent">' + esc(x) + "</span>"; }).join("");
      return '<section class="section"><div class="container">' +
        sectionHead(a.eyebrow, a.heading, null) +
        '<div class="grid grid-2"><ul class="tick-list reveal">' + items + "</ul>" +
        '<div class="reveal"><div class="pill-cloud">' + pills + "</div></div></div>" +
        "</div></section>";
    },

    resources: function () {
      const r = data.resources;
      if (!isVisible(r)) return "";
      const cards = (r.items || []).filter(isVisible).map(function (it) {
        return '<a class="card resource-card reveal" href="' + esc(linkOf(it)) + '"' + extAttrs(it.external) +
          ' aria-label="' + esc(t(it.title)) + '">' +
          '<span class="r-icon" aria-hidden="true">' + esc(it.icon || "→") + "</span>" +
          "<h3>" + esc(t(it.title)) + "</h3><p>" + esc(t(it.description)) + "</p>" +
          '<span class="r-cta">' + esc(t(it.cta)) + " →</span></a>";
      }).join("");
      return '<section class="section" id="documentos"><div class="container">' +
        sectionHead(r.eyebrow, r.heading, r.lead) +
        '<div class="resource-grid">' + cards + "</div>" +
        "</div></section>";
    },

    projects: function () {
      const ps = data.projectsSection || {};
      return '<section class="section" style="padding-top:calc(var(--header-h) + 56px)"><div class="container">' +
        sectionHead(ps.eyebrow, ps.heading, ps.lead) +
        '<div class="grid grid-2">' + ctx.grid.renderProjectsGrid() + "</div>" +
        "</div></section>";
    },

    aiClassification: function () { return ctx.ai.renderAIClassification(); },

    pageHeaderPerfil: function () {
      const ph = data.pageHeaders.perfil;
      return '<section class="section" style="padding-top:calc(var(--header-h) + 56px);padding-bottom:0;border:none"><div class="container">' +
        sectionHead(ph.eyebrow, ph.heading, ph.lead) + "</div></section>";
    },

    ctaBand: function () {
      const c = data.ctaBand;
      if (!isVisible(c)) return "";
      return '<section class="section"><div class="container"><div class="cta-band reveal">' +
        "<div><h2>" + esc(t(c.heading)) + "</h2><p>" + esc(t(c.text)) + "</p></div>" +
        '<a class="btn btn-primary" href="' + esc(url(c.button.href)) + '">' + esc(t(c.button.label)) + "</a>" +
        "</div></div></section>";
    },

    contactIntro: function () {
      const ph = data.pageHeaders.contacto;
      return '<section class="section" style="padding-top:calc(var(--header-h) + 56px);padding-bottom:24px;border:none"><div class="container">' +
        sectionHead(ph.eyebrow, ph.heading, ph.lead) + "</div></section>";
    },

    wizard: function () {
      return '<section class="section" style="padding-top:0;border:none"><div class="container"><div class="wizard" id="wizard" aria-live="polite">' +
        '<div class="wizard-head"><div class="wizard-progress">' +
        '<span class="step-label" id="wiz-step-label"></span>' +
        '<div class="bar" role="progressbar" id="wiz-bar-wrap" aria-valuemin="1" aria-valuemax="7"><i id="wiz-bar"></i></div>' +
        "</div></div>" +
        '<div class="wizard-body" id="wiz-body"></div>' +
        "</div></div></section>";
    },

    directContact: function () {
      const es = state.lang === "es";
      return '<section class="section"><div class="container"><div class="section-head reveal">' +
        "<h2>" + (es ? "¿Prefieres el contacto directo?" : "Prefer direct contact?") + "</h2></div>" +
        '<div class="hero-cta reveal">' +
        '<a class="btn btn-copper" href="' + esc(LINKS.whatsapp) + '" target="_blank" rel="noopener noreferrer">WhatsApp</a>' +
        '<a class="btn btn-outline" href="' + esc(LINKS.email) + '">Email</a>' +
        '<a class="btn btn-outline" href="' + esc(LINKS.linkedin) + '" target="_blank" rel="noopener noreferrer">LinkedIn</a>' +
        "</div></div></section>";
    }
  };

  /* ---------- Navegación, idioma, tema, footer ---------- */
  function renderNav() {
    const list = document.getElementById("nav-list");
    const faqLink = '<li><a href="/es/preguntas-y-respuestas/" data-native="true">F&Q</a></li>';
    list.innerHTML = (data.navigation || []).filter(isVisible).map(function (n) {
      return '<li><a href="' + esc(url(n.path)) + '" data-path="' + esc(n.path) + '">' + esc(t(n.label)) + "</a></li>";
    }).join("") + faqLink;
    const fl = document.getElementById("footer-links");
    fl.innerHTML = (data.navigation || []).filter(isVisible).map(function (n) {
      return '<li><a href="' + esc(url(n.path)) + '">' + esc(t(n.label)) + "</a></li>";
    }).join("") + faqLink +
      '<li><a href="' + esc(LINKS.linkedin) + '" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>' +
      '<li><a href="' + esc(LINKS.pressArticle) + '" target="_blank" rel="noopener noreferrer">La Prensa</a></li>';
  }

  function updateNavCurrent(path) {
    document.querySelectorAll("#nav-list a").forEach(function (a) {
      if (a.getAttribute("data-path") === path) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function renderChrome() {
    document.documentElement.lang = locale.htmlLangCode(state.lang);
    document.documentElement.dir = locale.isRTL(state.lang) ? "rtl" : "ltr";
    document.getElementById("brand-sub").textContent = ui("brandSub");
    document.getElementById("footer-tagline").textContent = ui("footerTagline");
    document.getElementById("footer-copy").textContent = "© " + new Date().getFullYear() + " Josueth Acevedo Cruz · " + ui("footerCopy");
    const langSelect = document.getElementById("lang-select");
    if (langSelect) {
      const labels = SETTINGS.languageLabels || {};
      const names = SETTINGS.languageNames || {};
      langSelect.innerHTML = locale.supportedLanguages().map(function (code) {
        return '<option value="' + esc(code) + '"' + (code === state.lang ? " selected" : "") + ">" + esc(labels[code] || code.toUpperCase()) + "</option>";
      }).join("");
      langSelect.setAttribute("aria-label", ui("langLabel"));
      langSelect.title = names[state.lang] || state.lang.toUpperCase();
    }
    document.getElementById("theme-toggle").setAttribute("aria-label", ui("themeLabel"));
    document.getElementById("menu-toggle").setAttribute("aria-label", ui("menuOpen"));
  }

  function applyTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
    document.getElementById("theme-toggle").textContent = state.theme === "light" ? "◐" : "◑";
  }

  return { BLOCKS, sectionHead, renderNav, updateNavCurrent, renderChrome, applyTheme };
}
