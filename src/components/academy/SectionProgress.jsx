import { useEffect, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

// A thin, section-scoped reading bar pinned just below the site header on wide
// screens. It tracks how far through the *current section* the reader has
// scrolled. Purely decorative (the mobile Contents bar already carries the
// accessible chapter progress), so it is aria-hidden and never intercepts input.
export default function SectionProgress({ targetId, accent = '#db2777' }) {
  const reduced = useReducedMotion()
  const [pct, setPct] = useState(0)

  useEffect(() => {
    if (!targetId) return undefined

    let frame = 0
    const update = () => {
      frame = 0
      const el = document.getElementById(targetId)
      if (!el) return
      const top = el.getBoundingClientRect().top
      const total = el.offsetHeight - (window.innerHeight - 84)
      const scrolled = 84 - top
      const value = total > 0 ? scrolled / total : scrolled > 0 ? 1 : 0
      setPct(Math.max(0, Math.min(1, value)))
    }
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [targetId])

  return (
    <div
      data-section-progress
      className="pointer-events-none sticky top-[70px] z-20 mb-3 hidden h-[3px] overflow-hidden rounded-full bg-line-soft min-[900px]:block"
      aria-hidden="true"
    >
      <div
        className={`h-full origin-left rounded-full ${
          reduced ? '' : 'transition-transform duration-150 ease-out'
        }`}
        style={{
          transform: `scaleX(${pct})`,
          background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
        }}
      />
    </div>
  )
}
