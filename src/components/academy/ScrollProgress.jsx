import { useEffect, useState } from 'react'

/** Fixed reading-progress bar across the top of the viewport while a chapter is open. */
export default function ScrollProgress({ accent = '#38bdf8' }) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    let frame = 0
    const update = () => {
      frame = 0
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setPct(scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0)
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
  }, [])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] bg-slate-900/70">
      <div
        className="h-full origin-left transition-[width] duration-150 ease-out"
        style={{
          width: `${pct * 100}%`,
          background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
          boxShadow: `0 0 12px ${accent}99`,
        }}
      />
    </div>
  )
}
