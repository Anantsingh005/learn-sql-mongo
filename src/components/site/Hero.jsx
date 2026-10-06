import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { clearLocalProgress } from '../../lib/progress.js'
import { useAuth } from '../../context/AuthContext.jsx'
import WorkspaceVisual from './WorkspaceVisual.jsx'
import { ArrowRightIcon } from './icons.jsx'

const PARALLAX_MAX = 8

const TYPE_STEP = 55
const LINE_TWO_START = 620

function typeChars(text, base) {
  return [...text].map((char, i) => (
    <span
      // eslint-disable-next-line react/no-array-index-key
      key={`${char}-${i}`}
      className="type-char"
      style={{ animationDelay: `${base + i * TYPE_STEP}ms` }}
    >
      {char}
    </span>
  ))
}

export default function Hero() {
  const [cleared, setCleared] = useState(false)
  const { user } = useAuth()
  const sceneRef = useRef(null)

  const handleClearLocal = () => {
    if (!window.confirm('Clear locally saved quiz progress on this browser?')) return
    clearLocalProgress()
    setCleared(true)
  }

  const handleCtaMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    e.currentTarget.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`
  }

  const handleCtaMouseLeave = (e) => {
    e.currentTarget.style.transform = ''
  }

  const handleCtaMouseDown = (e) => {
    e.currentTarget.style.transform = 'scale(0.97)'
  }

  const handleCtaMouseUp = (e) => {
    e.currentTarget.style.transform = ''
  }

  useEffect(() => {
    const node = sceneRef.current
    if (!node) return undefined

    const canHover = window.matchMedia?.('(hover: hover) and (pointer: fine)')
    const stillOk = window.matchMedia?.('(prefers-reduced-motion: no-preference)')
    if (canHover?.matches === false || stillOk?.matches === false) return undefined

    let frame = 0
    let dx = 0
    let dy = 0

    const paint = () => {
      frame = 0
      node.style.transform = `translate3d(${dx * PARALLAX_MAX}px, ${dy * PARALLAX_MAX}px, 0)`
    }

    const onMove = (event) => {
      dx = (event.clientX / window.innerWidth) * 2 - 1
      dy = (event.clientY / window.innerHeight) * 2 - 1
      if (!frame) frame = window.requestAnimationFrame(paint)
    }

    const onLeave = () => {
      dx = 0
      dy = 0
      if (!frame) frame = window.requestAnimationFrame(paint)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave, { passive: true })
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <section data-hero className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-6xl px-5 pb-3 pt-3 sm:px-8 sm:pb-5 sm:pt-5">
        <div className="grid items-center gap-6 md:gap-8 lg:grid-cols-2 lg:gap-6">
          <div>
            <p
              className="enter-rise inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600"
              style={{ animationDelay: '0ms' }}
            >
              <span aria-hidden="true" className="badge-pulse h-1.5 w-1.5 rounded-full bg-brand-500" />
              Practice · Learn · Improve
            </p>

            <h1 className="mt-2 font-serif font-extrabold text-[2.6rem] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[3rem] xl:text-[3.5rem] relative">
              <span
                className="enter-word block whitespace-pre text-body/90"
                style={{ animationDelay: '90ms' }}
              >
                {typeChars('Test your', 0)}
              </span>
              <span
                className="relative isolate block whitespace-pre"
                style={{ animationDelay: '230ms' }}
              >
                <span
                  className="enter-word grad-text block whitespace-pre"
                  style={{ animationDelay: '0ms' }}
                >
                  {typeChars('database skills', LINE_TWO_START)}
                  <span className="type-caret-window" aria-hidden="true">
                    <span className="type-caret caret-blink" />
                  </span>
                </span>
              </span>
            </h1>

            <p
              className="enter-rise mt-2 max-w-[30rem] text-[15px] leading-[1.5] text-body"
              style={{ animationDelay: '430ms' }}
            >
              Build, run, and fix real SQL queries — then take on MongoDB. Choose a game to start
              and sharpen your skills with real-world challenges.
            </p>

            <div
              className="enter-rise mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center"
              style={{ animationDelay: '560ms' }}
            >
              <Link
                to="/quiz/sql"
                className="cta-sheen group/cta relative inline-flex h-[46px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-600 px-6 text-[15px] font-semibold text-white shadow-[0_14px_28px_-16px_rgba(21,84,199,0.85)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-[0_20px_34px_-16px_rgba(21,84,199,0.9)] focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-mist sm:w-auto ripple-magnetic"
                onMouseMove={handleCtaMouseMove}
                onMouseLeave={handleCtaMouseLeave}
                onMouseDown={handleCtaMouseDown}
                onMouseUp={handleCtaMouseUp}
              >
                Start Learning
                <ArrowRightIcon
                  size={17}
                  strokeWidth={2.1}
                  className="transition-transform duration-200 group-hover/cta:translate-x-1"
                />
              </Link>

              <Link
                to="/leaderboard"
                className="group/cta inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-6 text-[15px] font-semibold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 hover:shadow-[0_14px_26px_-18px_rgba(16,42,67,0.5)] focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-mist sm:w-auto ripple-magnetic"
                onMouseMove={handleCtaMouseMove}
                onMouseLeave={handleCtaMouseLeave}
                onMouseDown={handleCtaMouseDown}
                onMouseUp={handleCtaMouseUp}
              >
                View Leaderboard
                <ArrowRightIcon
                  size={17}
                  strokeWidth={2.1}
                  className="text-brand-500 transition-transform duration-200 group-hover/cta:translate-x-1"
                />
              </Link>
            </div>

            {!user && (
              <div
                className="enter-rise mt-4 flex flex-wrap items-center gap-x-3 gap-y-1"
                style={{ animationDelay: '680ms' }}
              >
                <button
                  type="button"
                  onClick={handleClearLocal}
                  className="rounded text-[13px] text-muted underline decoration-line underline-offset-4 transition-colors duration-200 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-4 focus-visible:ring-offset-mist"
                >
                  Clear your progress
                </button>

                {cleared && (
                  <p role="status" className="text-[13px] text-leaf-600">
                    Local progress cleared.
                  </p>
                )}
              </div>
            )}
          </div>

          <div
            ref={sceneRef}
            className="parallax-scene mx-auto w-full max-w-[240px] sm:max-w-[300px] md:max-w-[340px] xl:max-w-[400px] 2xl:max-w-[480px]"
          >
            <div className="enter-rise relative w-full" style={{ animationDelay: '330ms' }}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <WorkspaceVisual />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
