import { useEffect, useState } from 'react'

/**
 * Animates a number from 0 to `target` with an ease-out curve once `start`
 * becomes true (e.g. when the element scrolls into view).
 */
export function useCountUp(target, { duration = 1100, start = false } = {}) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!start) return undefined

    let raf = 0
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start, target, duration])

  return value
}

export default useCountUp