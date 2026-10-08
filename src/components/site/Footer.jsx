import { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
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
                  <option key={s.id} value={s.id}>
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
  const showFeedback = Boolean(user)

  return (
    <footer className="border-t border-line bg-white" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
        <div
          className={`grid gap-8 sm:grid-cols-2 lg:gap-10 xl:gap-12 ${
            showFeedback ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
          }`}
        >
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl text-[20px] font-bold leading-none tracking-[-0.02em] text-ink focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              aria-label="DBQuiz home"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-xs">
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
              <span>
                <span className="text-ink">DB</span>
                <span className="text-brand-600">Quiz</span>
              </span>
            </Link>
            <p className="mt-2 text-sm text-muted leading-relaxed max-w-xs">
              Practice SQL. Master databases. Build real skills with instant feedback.
            </p>
          </div>

          <nav aria-label="Product">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Product</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted hover:text-ink transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal & Social">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Legal & Social</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted hover:text-ink transition-colors duration-150"
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
                    className="text-sm text-muted hover:text-ink transition-colors duration-150 flex items-center gap-1.5"
                  >
                    {link.isEmail ? (
                      <svg className="h-3.5 w-3.5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                    ) : null}
                    <span>{link.label}</span>
                    <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {showFeedback && (
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Help Us Improve</h3>
              <p className="text-sm text-muted mb-2">Have a suggestion or found a bug?</p>
              <button
                onClick={() => setFeedbackOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 transition-colors duration-150"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Send Feedback
              </button>
              <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-line grid grid-cols-1 md:grid-cols-3 gap-4">
          <p className="text-xs text-muted text-center md:text-left">
            &copy; {new Date().getFullYear()} DBQuiz. All rights reserved.
          </p>
          <p className="text-xs text-muted text-center">
            Version 1.0.0
          </p>
          <p className="text-xs text-muted text-center md:text-right">
            Built with Supabase + React
          </p>
        </div>
      </div>
    </footer>
  )
}