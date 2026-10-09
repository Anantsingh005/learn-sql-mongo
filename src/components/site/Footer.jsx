import { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useInView } from '../../hooks/useInView.js'
import { submitFeedback, FEEDBACK_SUBJECTS } from '../../lib/feedback.js'
import { ENTER_POP } from './motion.js'

const FOOTER_LINKS = {
  product: [
    { label: 'Home', to: '/' },
    { label: 'SQL Quiz', to: '/quiz/sql' },
    { label: 'Academy', to: '/academy' },
    { label: 'Practice', to: '/practice' },
    { label: 'Leaderboard', to: '/leaderboard' },
  ],
  legal: [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
  ],
  social: [
    {
      label: 'Contact',
      href: 'https://mail.google.com/mail/u/0/#inbox?compose=XBcJlDMdDMQtMZdGDPLxfKlsVlPRWDcVwsDkkkqnzhCjlNTvqSwvTWpVxHZGxcXrRtbTCnlFLrdXTrNQ',
      isEmail: true,
    },
    { label: 'GitHub', href: 'https://github.com/Anantsingh005', external: true },
  ],
}

function FeedbackModal({ isOpen, onClose }) {
  const [subject, setSubject] = useState('general')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const panelRef = useRef(null)
  const firstFieldRef = useRef(null)
  const restoreFocusRef = useRef(null)

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    setStatus('submitting')
    setErrorMessage('')

    const { error } = await submitFeedback({ subject, message })

    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
    } else {
      setStatus('success')
      setMessage('')
      setSubject('general')
    }
  }, [subject, message])

  useEffect(() => {
    if (!isOpen) return undefined

    restoreFocusRef.current = document.activeElement
    firstFieldRef.current?.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      const focusables = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), textarea, select, input, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusables?.length) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      if (restoreFocusRef.current instanceof HTMLElement) restoreFocusRef.current.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        className={`${ENTER_POP} w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-line overflow-hidden`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-shell/50">
          <h3 id="feedback-dialog-title" className="text-lg font-bold text-ink">
            Send Feedback
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-muted hover:text-ink hover:bg-line/40 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {status !== 'success' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label htmlFor="feedback-subject" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                Category
              </label>
              <select
                id="feedback-subject"
                ref={firstFieldRef}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              >
                {FEEDBACK_SUBJECTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="feedback-message" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                Message
              </label>
              <textarea
                id="feedback-message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What did you notice? How can we make it better?"
                required
                className="w-full rounded-lg border border-line bg-white p-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 resize-none"
              />
            </div>

            {status === 'error' && (
              <p role="alert" className="text-sm text-danger">
                {errorMessage || 'Failed to submit feedback. Please try again.'}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-muted hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {status === 'submitting' ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-ink">Thank you!</h4>
            <p className="text-sm text-muted">Your feedback helps make DBQuiz better for everyone.</p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Footer() {
  const { user } = useAuth()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [columnsRef, columnsInView] = useInView()
  const contactHref = FOOTER_LINKS.social.find((l) => l.isEmail)?.href ?? 'mailto:'

  const feedbackClass =
    'soft-pulse inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-16px_rgba(176,31,130,0.95)] transition-colors duration-150 hover:bg-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-plum-700'

  return (
    <footer
      className="relative overflow-hidden bg-[linear-gradient(135deg,#3a1466_0%,#4b1b7e_48%,#2d0b45_100%)] text-white"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">Footer</h2>

      {/* Soft decorative curves + glow, clipped to the band */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-40 h-96 w-96 rounded-full bg-plum-400/20 blur-3xl" />
        <div className="absolute -bottom-48 right-0 h-[420px] w-[420px] rounded-full bg-brand-500/20 blur-3xl" />
        <svg
          className="absolute -bottom-24 left-0 h-[380px] w-[760px] text-white/[0.05]"
          viewBox="0 0 760 380"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M-40 300C120 160 300 160 460 300s300 140 420 0"
            stroke="currentColor"
            strokeWidth="130"
            strokeLinecap="round"
          />
        </svg>
        <svg
          className="absolute -right-24 -top-28 h-[320px] w-[620px] text-white/[0.04]"
          viewBox="0 0 620 320"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M-20 240C140 120 320 120 460 240s200 110 320 20"
            stroke="currentColor"
            strokeWidth="110"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="relative mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
        <div ref={columnsRef} className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div
            className={`reveal sm:col-span-2 lg:col-span-1 ${columnsInView ? 'is-in' : ''}`}
            style={{ transitionDelay: '0ms' }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-plum-700"
              aria-label="DBQuiz home"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-500 to-plum-400 text-white shadow-lg">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
                </svg>
              </span>
              <span className="text-[20px] font-bold leading-none tracking-[-0.02em]">
                <span className="text-white">DB</span>
                <span className="text-brand-300">Quiz</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-plum-100/80">
              Practice SQL. Master databases.
            </p>
          </div>

          <nav
            aria-label="Product"
            className={`reveal ${columnsInView ? 'is-in' : ''}`}
            style={{ transitionDelay: '90ms' }}
          >
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-plum-200">Product</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-plum-100/90 transition-colors duration-150 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav
            aria-label="Legal & Social"
            className={`reveal ${columnsInView ? 'is-in' : ''}`}
            style={{ transitionDelay: '180ms' }}
          >
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-plum-200">
              Legal &amp; Social
            </h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-plum-100/90 transition-colors duration-150 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {FOOTER_LINKS.social.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-plum-100/90 transition-colors duration-150 hover:text-white"
                  >
                    {link.isEmail ? (
                      <svg className="h-3.5 w-3.5 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                    ) : null}
                    <span>{link.label}</span>
                    <svg className="h-3.5 w-3.5 text-plum-200/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div
            className={`reveal sm:col-span-2 lg:col-span-1 ${columnsInView ? 'is-in' : ''}`}
            style={{ transitionDelay: '270ms' }}
          >
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-plum-200">
              Help us improve
            </h3>
            <p className="mb-3 text-sm leading-relaxed text-plum-100/80">
              Have a suggestion or found a bug? Tell us what to fix next.
            </p>
            {user ? (
              <button type="button" onClick={() => setFeedbackOpen(true)} className={feedbackClass}>
                Send Feedback
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            ) : (
              <a href={contactHref} target="_blank" rel="noopener noreferrer" className={feedbackClass}>
                Send Feedback
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Rendered outside the animated columns: `.reveal` puts a transform on
            its children while entering, which would trap the modal's fixed
            positioning until the animation finishes. */}
        <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

        <div className="mt-8 grid grid-cols-1 gap-2 border-t border-white/10 pt-5 md:grid-cols-3">
          <p className="text-center text-xs text-plum-200/70 md:text-left">
            &copy; {new Date().getFullYear()} DBQuiz. All rights reserved.
          </p>
          <p className="text-center text-xs text-plum-200/70">
            Version 1.0.0
          </p>
          <p className="text-center text-xs text-plum-200/70 md:text-right">
            Built with Supabase + React
          </p>
        </div>
      </div>
    </footer>
  )
}