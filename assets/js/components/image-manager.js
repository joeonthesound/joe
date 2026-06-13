/* ==================================================================
   components/image-manager.js — imágenes centralizadas desde el JSON
   ------------------------------------------------------------------
   Cada objeto "media" del JSON puede declarar:
     · src      → URL explícita (absoluta o relativa a la raíz del sitio)
     · r2Path   → ruta del objeto dentro del bucket de Cloudflare R2
     · localSrc → archivo local relativo a la raíz (último recurso visual)
     · alt / title / caption → cadenas o objetos multiidioma {es,en,...}
   Cadena de resolución de una imagen con r2Path:
     1. dominio personalizado de R2 (media.r2.primaryBaseUrl)
     2. dominio público *.r2.dev   (media.r2.altBaseUrl)
     3. placeholder de R2          (media.r2.placeholderPath, en ambos dominios)
     4. archivo local              (localSrc o media.localPlaceholder)
     5. placeholder SEO en HTML    (sin imagen, accesible e indexable)
   ================================================================== */
import { esc } from "../utils/dom.js";
import { rootAsset } from "../core/config.js";

function joinUrl(base, path) {
  return String(base).replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
}

export function createImageManager(ctx) {
  const { data, i18n } = ctx;

  function r2Config() {
    return (data.media && data.media.r2) || {};
  }

  function looksConfigured(base) {
    return typeof base === "string" && base.trim() !== "" && !/CAMBIA|REPLACE|EJEMPLO/i.test(base);
  }

  /** Lista ordenada y sin duplicados de URLs candidatas para un media. */
  function urlChainFor(media) {
    const cfg = r2Config();
    const urls = [];
    if (media && typeof media.src === "string" && media.src.trim() !== "") {
      urls.push(/^https?:\/\//i.test(media.src) ? media.src : rootAsset(media.src));
    }
    if (media && media.r2Path) {
      if (looksConfigured(cfg.primaryBaseUrl)) urls.push(joinUrl(cfg.primaryBaseUrl, media.r2Path));
      if (looksConfigured(cfg.altBaseUrl)) urls.push(joinUrl(cfg.altBaseUrl, media.r2Path));
      if (cfg.placeholderPath && cfg.placeholderPath !== media.r2Path) {
        if (looksConfigured(cfg.primaryBaseUrl)) urls.push(joinUrl(cfg.primaryBaseUrl, cfg.placeholderPath));
        if (looksConfigured(cfg.altBaseUrl)) urls.push(joinUrl(cfg.altBaseUrl, cfg.placeholderPath));
      }
    }
    const local = (media && media.localSrc) || (data.media && data.media.localPlaceholder);
    if (local) urls.push(rootAsset(local));
    return urls.filter((u, i) => urls.indexOf(u) === i);
  }

  /** Placeholder SEO accesible (sin imagen). */
  function placeholderHTML(media, contextTitle) {
    const ph = (media && media.placeholder) || {};
    if (ph.enabled === false) return "";
    const label = ph.label || i18n.ui("placeholderLabel");
    const seoText = ph.seoText || i18n.getLocalizedFallback("images", "defaultAlt");
    const title = i18n.t(media && media.title) || contextTitle || i18n.getLocalizedFallback("images", "defaultTitle");
    return '<div class="media-placeholder" role="img" aria-label="' + esc(seoText) + '" title="' + esc(title) + '">' +
      '<span class="ph-mark" aria-hidden="true">JA</span>' +
      '<span class="ph-label">' + esc(label) + '</span>' +
      '<span class="ph-seo">' + esc(seoText) + '</span>' +
      "</div>";
  }

  /** <figure> con imagen, alt/title por idioma, lazy y cadena de fallback. */
  function renderMedia(media, contextTitle) {
    if (!media || media.visible === false) return "";
    const chain = urlChainFor(media);
    if (!chain.length) return placeholderHTML(media, contextTitle);
    const alt = i18n.t(media.alt) || contextTitle || i18n.getLocalizedFallback("images", "defaultAlt");
    const title = i18n.t(media.title) || contextTitle || i18n.getLocalizedFallback("images", "defaultTitle");
    const captionText = i18n.t(media.caption);
    const w = media.width ? ' width="' + esc(media.width) + '"' : "";
    const h = media.height ? ' height="' + esc(media.height) + '"' : "";
    const cap = captionText ? "<figcaption>" + esc(captionText) + "</figcaption>" : "";
    return '<figure class="media-figure">' +
      '<img src="' + esc(chain[0]) + '" alt="' + esc(alt) + '" title="' + esc(title) + '"' +
      w + h + ' loading="' + esc(media.loading || "lazy") + '"' +
      " data-media-fallback='" + esc(JSON.stringify(chain.slice(1))) + "'" +
      " data-ph='" + esc(JSON.stringify({
        label: (media.placeholder && media.placeholder.label) || "",
        seoText: (media.placeholder && media.placeholder.seoText) || ""
      })) + "'>" +
      cap + "</figure>";
  }

  /** Activa el fallback en caliente: si una URL falla, prueba la siguiente;
      agotadas todas, sustituye la figura por el placeholder SEO. */
  function armMediaFallbacks(root) {
    root.querySelectorAll("img[data-media-fallback]").forEach((img) => {
      if (img.dataset.fallbackArmed) return;
      img.dataset.fallbackArmed = "1";
      img.addEventListener("error", function onError() {
        let remaining = [];
        try { remaining = JSON.parse(img.getAttribute("data-media-fallback") || "[]"); } catch (e) { remaining = []; }
        if (remaining.length) {
          const next = remaining.shift();
          img.setAttribute("data-media-fallback", JSON.stringify(remaining));
          img.src = next; /* el mismo listener atiende fallos sucesivos */
          return;
        }
        img.removeEventListener("error", onError);
        let phInfo = {};
        try { phInfo = JSON.parse(img.getAttribute("data-ph") || "{}"); } catch (e) { phInfo = {}; }
        const fig = img.closest(".media-figure");
        const holder = document.createElement("div");
        holder.innerHTML = placeholderHTML(
          { placeholder: { enabled: true, label: phInfo.label, seoText: phInfo.seoText } },
          img.getAttribute("alt")
        );
        if (fig && holder.firstChild) fig.replaceWith(holder.firstChild);
        else if (holder.firstChild) img.replaceWith(holder.firstChild);
      });
      /* Si la imagen ya falló antes de armar el listener (caché de error) */
      if (img.complete && img.naturalWidth === 0 && img.src) {
        img.dispatchEvent(new Event("error"));
      }
    });
  }

  return { urlChainFor, renderMedia, placeholderHTML, armMediaFallbacks };
}
