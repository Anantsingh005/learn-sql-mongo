import { useEffect, useState } from 'react'

function mediaQuery() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  return window.matchMedia('(prefers-reduced-motion: reduce)')
}

/**
 * Tracks `prefers-reduced-motion: reduce`. Consumers use it to skip count-ups,
 * confetti and looping/entrance animations so those land as instant states.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => mediaQuery()?.matches ?? false)

  useEffect(() => {
    const mq = mediaQuery()
    if (!mq) return undefined
    const onChange = () => setReduced(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

export default useReducedMotion
