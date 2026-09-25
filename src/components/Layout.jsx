import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useIsAdmin } from '../hooks/useIsAdmin.js'

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
  }`

function AuthMenu() {
  const { user, profile, configured } = useAuth()

  if (!configured) {
    return (
      <Link to="/auth" className="rounded-full border border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-800">
        Sign in
      </Link>
    )
  }

  if (!user) {
    return (
      <Link to="/auth" className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">
        Sign in
      </Link>
    )
  }

  return (
    <NavLink
      to="/profile"
      className="flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
    >
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
      ) : (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-[12px] font-bold text-white">
          {(profile?.username ?? user.email ?? '?').charAt(0).toUpperCase()}
        </span>
      )}
      <span className="max-w-28 truncate">{profile?.username ?? user.email}</span>
    </NavLink>
  )
}

function Layout() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const { isAdmin } = useIsAdmin()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" onClick={close} className="font-mono text-lg font-bold tracking-tight text-white">
            DB<span className="text-indigo-400">Quiz</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/quiz/sql" className={linkClass}>
              SQL Quiz
            </NavLink>
            <NavLink to="/practice" className={linkClass}>
              More Practice
            </NavLink>
            <NavLink to="/leaderboard" className={linkClass}>
              Leaderboard
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
            )}
            <div className="ml-2">
              <AuthMenu />
            </div>
          </nav>
          <div className="flex items-center gap-1 md:hidden">
            <AuthMenu />
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className="rounded-md p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-slate-800 px-4 py-2 md:hidden">
            <div className="flex flex-col gap-1">
              <NavLink to="/" end className={linkClass} onClick={close}>
                Home
              </NavLink>
              <NavLink to="/quiz/sql" className={linkClass} onClick={close}>
                SQL Quiz
              </NavLink>
              <NavLink to="/practice" className={linkClass} onClick={close}>
                More Practice
              </NavLink>
              <NavLink to="/leaderboard" className={linkClass} onClick={close}>
                Leaderboard
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className={linkClass} onClick={close}>
                  Admin
                </NavLink>
              )}
              <div className="border-t border-slate-800 pt-2">
                <AuthMenu />
              </div>
            </div>
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        DBQuiz — learn SQL &amp; MongoDB by playing
      </footer>
    </div>
  )
}

export default Layout