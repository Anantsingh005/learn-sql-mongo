export function isNarrow() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(width < 40rem)').matches
}
