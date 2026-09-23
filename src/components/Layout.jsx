import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
  }`

function AuthMenu() {
  const { user, profile, configured, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  if (!configured) {
    return (
      <Link to="/auth" className="rounded-md border border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-800">
        Sign in
      </Link>
    )
  }

  if (!user) {
    return (
      <Link to="/auth" className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">
        Sign in
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/30 text-[11px] font-bold text-indigo-300">
          {(profile?.username ?? user.email ?? '?').charAt(0).toUpperCase()}
        </span>
        <span className="max-w-28 truncate">{profile?.username ?? user.email}</span>
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-slate-700 bg-slate-900 p-1 shadow-xl">
            <div className="px-3 py-2">
              <div className="truncate text-sm font-medium text-white">{profile?.username ?? '…'}</div>
              <div className="truncate text-xs text-slate-500">{user.email}</div>
            </div>
            <div className="h-px bg-slate-800" />
            <button
              type="button"
              onClick={() => { setOpen(false); signOut() }}
              className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm font-medium text-rose-400 hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function Layout() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

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
            <NavLink to="/leaderboard" className={linkClass}>
              Leaderboard
            </NavLink>
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
              <NavLink to="/leaderboard" className={linkClass} onClick={close}>
                Leaderboard
              </NavLink>
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