/* ==================================================================
   core/i18n.js — resolución de textos multiidioma
   ================================================================== */

export function createI18n(ctx) {
  const { data, state } = ctx;
  const settings = data.settings || {};

  /* t(): resuelve un valor multiidioma {es,en,...} según el idioma activo.
     Las cadenas simples se devuelven tal cual. */
  function t(obj) {
    if (obj == null) return "";
    if (typeof obj === "string" || typeof obj === "number") return obj;
    if (Array.isArray(obj)) return obj;
    return obj[state.lang] || obj[settings.defaultLanguage] || obj.es || obj.en || Object.values(obj)[0] || "";
  }

  /* ui(): textos de interfaz desde data.languages */
  function ui(key) {
    const packs = data.languages || {};
    const pack = packs[state.lang] || packs[settings.defaultLanguage] || packs.es || {};
    if (pack[key] != null) return pack[key];
    const fallbackPack = packs[settings.defaultLanguage] || packs.es || {};
    return fallbackPack[key] != null ? fallbackPack[key] : key;
  }

  /* getLocalizedFallback(): fallbacks globales (imágenes, botones) */
  function getLocalizedFallback(group, key, lang) {
    const l = lang || state.lang;
    const g = (data.fallbacks && data.fallbacks[group]) || {};
    if (group === "buttons") {
      const b = g[key] || {};
      return b[l] || b.es || b.en || "";
    }
    const langPack = g[l] || g.es || g.en || {};
    return langPack[key] || "";
  }

  return { t, ui, getLocalizedFallback };
}
