import { Link } from 'react-router-dom'

function GuestBanner({ limit }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-indigo-600/40 bg-indigo-500/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-indigo-100">
        <span className="font-bold">You're playing as a guest</span> — the first {limit} questions per
        level are free. Create an account to unlock the full question bank, all levels, hints, and extra time.
      </div>
      <Link
        to="/auth?mode=signup"
        className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
      >
        Create account
      </Link>
    </div>
  )
}

export default GuestBanner