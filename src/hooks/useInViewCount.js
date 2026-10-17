import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion.js'

/**
 * Counts a number up from 0 to `value` the first time `active` becomes true,
 * for stat read-outs that should tick up as their section scrolls into view.
 * Under `prefers-reduced-motion` the value lands immediately with no tween.
 * The count restarts from 0 whenever the owning element remounts, so each
 * cascading row counts up on its own.
 */
export function useInViewCount(value, active, duration = 700) {
  const reduced = useReducedMotion()
  const target = Number.isFinite(value) ? value : 0
  const [display, setDisplay] = useState(0)
  const frameRef = useRef(0)

  useEffect(() => {
    if (!active) {
      // Defer to a frame so the reset stays out of the effect's synchronous path.
      const id = requestAnimationFrame(() => setDisplay(0))
      return () => cancelAnimationFrame(id)
    }
    if (reduced || target === 0) {
      const id = requestAnimationFrame(() => setDisplay(target))
      return () => cancelAnimationFrame(id)
    }

    let start = 0
    const tick = (now) => {
      if (!start) start = now
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(target * eased))
      if (t < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, active, reduced, duration])

  return display
}

export default useInViewCount
