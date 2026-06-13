/* ==================================================================
   utils/validation.js — validaciones puras y reutilizables
   ================================================================== */

/** Email con formato razonable. */
export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

/** Un ID de video de YouTube válido tiene exactamente 11 caracteres [A-Za-z0-9_-]. */
export function isValidYouTubeId(value) {
  return /^[A-Za-z0-9_-]{11}$/.test(String(value || "").trim());
}

/** ¿El objeto está visible? (visible !== false) */
export function isVisible(obj) {
  return Boolean(obj) && obj.visible !== false;
}
