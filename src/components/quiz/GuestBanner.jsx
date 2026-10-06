import { Link } from 'react-router-dom'

function GuestBanner({ limit }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-brand-700">
        <span className="font-bold">You're playing as a guest</span> — the first {limit} questions per
        level are free. Create an account to unlock the full question bank, all levels, hints, and extra time.
      </div>
      <Link
        to="/auth?mode=signup"
        className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        Create account
      </Link>
    </div>
  )
}

export default GuestBanner