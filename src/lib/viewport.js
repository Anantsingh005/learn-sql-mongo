/**
 * True when the viewport is narrower than Tailwind's `sm` breakpoint (40rem).
 *
 * The one place the app needs to know the screen size in JavaScript rather than
 * CSS, because "which filters are offered on arrival" is a question about state
 * — whether a category is selected at all — and not something a media query can
 * answer. 40rem is deliberately the same value Tailwind breaks at, so this
 * cannot drift from the CSS.
 *
 * Sampled on demand rather than tracked live: it decides what a phone is handed
 * at load, and re-deciding on rotate would blank a board the user had already
 * loaded. Callers pass it into a `useState` initialiser to pin that decision.
 */
export function isNarrow() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(width < 40rem)').matches
}
