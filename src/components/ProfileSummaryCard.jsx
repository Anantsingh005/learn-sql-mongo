import { Link } from 'react-router-dom'

function initialFor({ profile, user }) {
  return (profile?.username ?? user?.email ?? '?').charAt(0).toUpperCase()
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function ProfileSummaryCard({ user, profile, avatar, editLabel = 'Edit profile', onEdit, editTo, onSignOut, Heading = 'h1' }) {
  const editClasses =
    'inline-flex items-center gap-1.5 rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800'
  const signOutClasses =
    'inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50'

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line/80 bg-gradient-to-br from-brand-50 via-white to-plum-50">
      <div className="pointer-events-none absolute -top-16 -right-14 h-44 w-44 rounded-full border border-brand-200/70" />
      <div className="pointer-events-none absolute -bottom-20 -left-14 h-40 w-40 rounded-full border border-plum-200/70" />

      <div className="relative flex flex-col items-center gap-4 px-6 py-7 sm:flex-row sm:gap-6 sm:px-8">
        {avatar ? (
          <img
            src={avatar}
            alt="Your avatar"
            className="h-20 w-20 shrink-0 rounded-full border border-brand-200 object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-brand-200 bg-gradient-to-br from-brand-100 to-plum-100 text-3xl font-black text-ink shadow-sm">
            {initialFor({ profile, user })}
          </div>
        )}

        <div className="min-w-0 text-center sm:text-left">
          <Heading className="truncate text-2xl font-bold text-ink">{profile?.username ?? 'player'}</Heading>
          {profile?.name && <div className="truncate text-sm text-muted">{profile.name}</div>}
          <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted sm:justify-start">
            <span className="max-w-full truncate">{user.email}</span>
            <span>Member since {formatDate(profile?.created_at)}</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:ml-auto sm:flex-col sm:items-end">
          {editTo ? (
            <Link to={editTo} className={editClasses}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              {editLabel}
            </Link>
          ) : (
            <button type="button" onClick={onEdit} className={editClasses}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              {editLabel}
            </button>
          )}
          <button type="button" onClick={onSignOut} className={signOutClasses}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
