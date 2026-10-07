import { useEffect, useState } from 'react'

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Loops a typewriter over `text` forever: type -> hold -> erase -> pause ->
 * repeat. Returns the number of characters currently visible (0..text.length).
 * With prefers-reduced-motion the full text is returned and nothing animates.
 */
export function useTypeLoop(
  text,
  {
    typeMs = 55,
    eraseMs = 32,
    holdMs = 1800,
    gapMs = 500,
    startDelayMs = 700,
    wordPauseMs = 180,
  } = {},
) {
  const [reduced] = useState(prefersReducedMotion)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (reduced) return undefined

    let timer = 0
    let stopped = false
    let typed = 0
    let phase = 'type'

    function schedule(ms) {
      timer = window.setTimeout(tick, ms)
    }

    function tick() {
      if (stopped) return

      if (phase === 'type') {
        if (typed >= text.length) {
          phase = 'hold'
          schedule(holdMs)
          return
        }
        const char = text[typed]
        typed += 1
        setCount(typed)
        schedule(char === ' ' ? typeMs + wordPauseMs : typeMs)
        return
      }

      if (phase === 'hold') {
        phase = 'erase'
        schedule(0)
        return
      }

      if (phase === 'erase') {
        if (typed <= 0) {
          phase = 'gap'
          schedule(gapMs)
          return
        }
        typed -= 1
        setCount(typed)
        schedule(eraseMs)
        return
      }

      phase = 'type'
      schedule(0)
    }

    schedule(startDelayMs)

    return () => {
      stopped = true
      window.clearTimeout(timer)
    }
  }, [reduced, text, typeMs, eraseMs, holdMs, gapMs, startDelayMs, wordPauseMs])

  return reduced ? text.length : count
}

export default useTypeLoop
