/* ==================================================================
   utils/dom.js — utilidades de DOM y texto
   ================================================================== */

/** Escapa texto para insertarlo de forma segura en HTML. */
export function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Atributos para enlaces externos. */
export function extAttrs(external) {
  return external ? ' target="_blank" rel="noopener noreferrer"' : "";
}

/** Observador de animaciones .reveal al hacer scroll (degrada sin IntersectionObserver). */
export function createRevealObserver() {
  let observer = null;
  function observe(root) {
    if (!("IntersectionObserver" in window)) {
      root.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add("in"); observer.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    }
    root.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  }
  return { observe };
}
