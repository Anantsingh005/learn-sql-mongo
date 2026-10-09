import { Link } from 'react-router-dom'

// Compact prompt shown in the sidebar slot for signed-out visitors on /academy,
// so the two-column grid keeps the same shape whether or not a user is signed in.
export default function SignInPrompt() {
  return (
    <aside className="enter-rise relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(45,0,34,0.05)]">
      <div className="pointer-events-none absolute -top-14 -right-12 h-32 w-32 rounded-full border border-brand-200/70" />
      <div className="pointer-events-none absolute -bottom-16 -left-12 h-32 w-32 rounded-full border border-plum-200/70" />

      <div className="relative border-b border-line bg-gradient-to-br from-brand-50 via-white to-plum-50 px-5 py-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-brand-200 bg-gradient-to-br from-brand-100 to-plum-100 text-2xl font-black text-ink shadow-sm">
          ?
        </div>
        <h2 className="mt-3 text-base font-bold text-ink">Sign in to track progress</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Save your reading progress and pick up exactly where you left off, on any device.
        </p>
      </div>

      <div className="relative space-y-2 px-5 py-5">
        <Link
          to="/auth"
          className="cta-sheen relative flex w-full items-center justify-center overflow-hidden rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          Sign in
        </Link>
        <Link
          to="/auth?mode=signup"
          className="flex w-full items-center justify-center rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-body transition-colors hover:bg-brand-50 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          Create account
        </Link>
      </div>
    </aside>
  )
}
