const enabled = import.meta.env?.DEV || import.meta.env?.VITE_DEBUG === '1'

export function debugLog(...args) {
  if (!enabled) return
  console.log('[dbquiz]', ...args)
}

export function debugError(...args) {
  if (!enabled) return
  console.error('[dbquiz]', ...args)
}