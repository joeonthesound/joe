/* ==================================================================
   core/locale.js — idioma: detección, normalización y navegación
   ================================================================== */

export function createLocale(settings) {
  function supportedLanguages() {
    return settings.availableLanguages || ["es", "en"];
  }

  function normalizeLanguageCode(value) {
    const raw = String(value || "").toLowerCase().replace("_", "-");
    const aliases = settings.languageAliases || {};
    if (aliases[raw]) return aliases[raw];
    const base = raw.split("-")[0];
    if (aliases[base]) return aliases[base];
    return base;
  }

  /* El idioma de la página se declara en <html data-lang="xx"> (fuente
     principal, robusta ante subdirectorios). Como respaldo se inspecciona
     la URL, que es la detección original del proyecto. */
  function getLanguageFromDocument() {
    const declared = normalizeLanguageCode(document.documentElement.getAttribute("data-lang"));
    if (supportedLanguages().includes(declared)) return declared;
    return getLanguageFromPath();
  }

  function getLanguageFromPath() {
    const segments = location.pathname.split("/").filter(Boolean);
    for (let i = segments.length - 1; i >= 0; i--) {
      const normalized = normalizeLanguageCode(segments[i]);
      if (supportedLanguages().includes(normalized)) return normalized;
    }
    return "";
  }

  function detectPreferredLanguage() {
    const supported = supportedLanguages();
    let saved = "";
    try { saved = normalizeLanguageCode(localStorage.getItem("site-lang")); } catch (e) { /* sin storage */ }
    if (supported.includes(saved)) return saved;
    const browserLangs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    for (const lang of browserLangs) {
      const normalized = normalizeLanguageCode(lang);
      if (supported.includes(normalized)) return normalized;
    }
    return settings.defaultLanguage || "es";
  }

  function htmlLangCode(lang) {
    return (settings.languageHtmlCodes && settings.languageHtmlCodes[lang]) || lang;
  }

  function isRTL(lang) {
    return (settings.rtlLanguages || []).includes(lang);
  }

  function languagePath(lang) {
    return (settings.languagePaths && settings.languagePaths[lang]) || ("/" + lang + "/");
  }

  /* URL del MISMO sitio en otro idioma. Si la página actual está dentro de
     un directorio de idioma, se navega de forma relativa (../xx/), lo que
     conserva cualquier subdirectorio de despliegue. */
  function languageUrl(lang, hash) {
    const suffix = hash || "";
    if (getLanguageFromPath()) {
      return new URL("../" + lang + "/", location.href).pathname + suffix;
    }
    return languagePath(lang) + suffix;
  }

  function rememberLanguage(lang) {
    try { localStorage.setItem("site-lang", lang); } catch (e) { /* sin storage */ }
  }

  return {
    supportedLanguages,
    normalizeLanguageCode,
    getLanguageFromDocument,
    getLanguageFromPath,
    detectPreferredLanguage,
    htmlLangCode,
    isRTL,
    languagePath,
    languageUrl,
    rememberLanguage
  };
}
