import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion.js'

/**
 * Returns a display value that eases from the previous number to the new one,
 * used for stat read-outs. Under `prefers-reduced-motion` the value lands
 * immediately with no tween.
 */
export function useCountUp(value, duration = 600) {
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)

  useEffect(() => {
    const from = fromRef.current
    if (from === value) return undefined

    // A zero-length span lands the value on the first frame, which is how the
    // reduced-motion case stays instant without a synchronous setState.
    const span = reduced ? 0 : duration
    let frame = 0
    const start = performance.now()
    const tick = (now) => {
      const t = span > 0 ? Math.min(1, (now - start) / span) : 1
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
      else fromRef.current = value
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, reduced, duration])

  return display
}

export default useCountUp
