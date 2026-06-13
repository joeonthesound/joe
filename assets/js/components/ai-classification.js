/* ==================================================================
   components/ai-classification.js — clasificación IA + JSON-LD
   ================================================================== */
import { esc } from "../utils/dom.js";
import { isVisible } from "../utils/validation.js";

export function createAIClassification(ctx) {
  const { data, state, i18n, locale } = ctx;

  /* URL canónica del idioma activo para los datos estructurados */
  function localizedUrl() {
    const base = (data.settings && data.settings.siteBaseUrl) || "https://josuethacevedo.com";
    return base.replace(/\/+$/, "") + locale.languagePath(state.lang);
  }

  function injectJSONLD() {
    if (!data.jsonld) return;
    let el = document.getElementById("dynamic-jsonld");
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = "dynamic-jsonld";
      document.head.appendChild(el);
    }
    const ai = data.aiClassification || {};
    const url = localizedUrl();
    const person = Object.assign({}, data.jsonld.person, { url });
    if (ai.professionalLabels && ai.professionalLabels.en) {
      person.disambiguatingDescription = ai.primaryCategory;
    }
    const service = Object.assign({}, data.jsonld.service, { url });
    const graph = {
      "@context": "https://schema.org",
      "@graph": [
        person,
        service,
        { "@type": "ProfilePage", "mainEntity": { "@id": person.url }, "about": ai.primaryCategory || "" }
      ]
    };
    el.textContent = JSON.stringify(graph);
  }

  function renderAIClassification() {
    const ai = data.aiClassification;
    if (!isVisible(ai)) return "";
    const { t } = i18n;
    const titles = (ai.machineBlockTitles && (ai.machineBlockTitles[state.lang] || ai.machineBlockTitles.es)) || {};
    const badges = (t(ai.visibleBadges) || []).map((b) => '<span class="pill pill-accent">' + esc(b) + "</span>").join("");
    const labels = ((ai.professionalLabels && (ai.professionalLabels[state.lang] || ai.professionalLabels.es)) || [])
      .map((l) => '<span class="pill">' + esc(l) + "</span>").join("");
    const industries = (ai.industries || []).map((i) => '<span class="pill">' + esc(i) + "</span>").join("");
    function dl(label, arr) {
      if (!arr || !arr.length) return "";
      return "<dt>" + esc(label) + "</dt><dd>" + esc(arr.join(" · ")) + "</dd>";
    }
    /* Bloque discreto pero indexable (sin display:none) para ATS / buscadores / agentes IA */
    const machine =
      '<details class="ai-machine"><summary>' + esc(titles.summary || "Structured profile data") + "</summary>" +
      '<dl class="ai-data">' +
      dl("Primary category", [ai.primaryCategory]) +
      dl("Secondary categories", ai.secondaryCategories) +
      dl(titles.labels || "Professional labels", (ai.professionalLabels && ai.professionalLabels.en) || []) +
      dl(titles.industries || "Industries", ai.industries) +
      dl(titles.capabilities || "Core capabilities", ai.coreCapabilities) +
      dl(titles.keywords || "Search intent keywords", ai.searchIntentKeywords) +
      dl(titles.ats || "ATS keywords", ai.atsKeywords) +
      dl(titles.idealFor || "Ideal for", ai.idealFor) +
      dl(titles.notLimitedTo || "Not limited to", ai.notLimitedTo) +
      "</dl></details>";
    injectJSONLD();
    return '<section class="section" id="ai-profile-classification" aria-label="AI profile classification"><div class="container">' +
      '<div class="ai-section reveal">' +
      '<p class="eyebrow">' + esc(t(ai.sectionEyebrow)) + "</p>" +
      "<h2>" + esc(t(ai.sectionTitle)) + "</h2>" +
      '<p class="ai-lede">' + esc(t(ai.sectionText)) + "</p>" +
      '<div class="pill-cloud">' + badges + "</div>" +
      '<p class="ai-sub">' + esc(titles.labels || "Professional labels") + "</p>" +
      '<div class="pill-cloud">' + labels + "</div>" +
      '<p class="ai-sub">' + esc(titles.industries || "Industries") + "</p>" +
      '<div class="pill-cloud">' + industries + "</div>" +
      machine +
      "</div></div></section>";
  }

  return { renderAIClassification, injectJSONLD };
}
