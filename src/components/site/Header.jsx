import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useIsAdmin } from '../../hooks/useIsAdmin.js'
import Logo from './Logo.jsx'
import { ENTER_POP, NAV } from './motion.js'

/**
 * The site header: 70px height, translucent at rest with backdrop blur,
 * crisp border, centered segmented navigation pill for desktop,
 * and a fully opaque, clean mobile drawer for phone screens.
 */
export default function Header({ links: staticLinks }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { isAdmin } = useIsAdmin()

  const links = useMemo(() => {
    const base = staticLinks ?? NAV
    return isAdmin ? [...base, { to: '/admin', label: 'Admin' }] : base
  }, [staticLinks, isAdmin])

  const routeKey = location.pathname
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let frame = 0
    const measure = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        setScrolled(window.scrollY > 8)
      })
    }
    measure()
    window.addEventListener('scroll', measure, { passive: true })
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', measure)
    }
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 h-[70px] border-b backdrop-blur-md transition-[background-color,box-shadow] duration-300 ${
        scrolled
          ? 'border-line bg-white shadow-[0_10px_30px_-18px_rgba(16,42,67,0.25)]'
          : 'border-line bg-transparent lg:bg-white/90'
      }`}
    >
      <div className="mx-auto grid h-[70px] max-w-6xl grid-cols-[1fr_auto] items-center gap-3 px-4 sm:gap-4 sm:px-8 lg:grid-cols-[1fr_auto_1fr]">
        <div className="flex justify-start">
          <Logo onClick={closeMenu} />
        </div>

        {/* Desktop Navigation - UNCHANGED for desktop */}
        <DesktopNav links={links} />

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <AuthControl />
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 lg:hidden ${
              menuOpen
                ? 'border-brand-200 bg-brand-50 text-brand-600 shadow-xs'
                : 'border-slate-200/80 bg-slate-50/80 text-slate-700 hover:bg-slate-100 hover:text-ink'
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && <MobileMenu key={routeKey} links={links} onClose={closeMenu} />}
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/* Desktop nav + smooth gliding pill indicator (DESKTOP ONLY)                 */
/* -------------------------------------------------------------------------- */

function DesktopNav({ links }) {
  const navRef = useRef(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0, height: 0, visible: false })
  const location = useLocation()

  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const active = nav.querySelector('[data-nav-active="true"]') || nav.querySelector('[aria-current="page"]')
    if (!active) {
      setIndicator((s) => ({ ...s, visible: false }))
      return
    }

    const navRect = nav.getBoundingClientRect()
    const activeRect = active.getBoundingClientRect()
    setIndicator({
      left: activeRect.left - navRect.left,
      width: activeRect.width,
      height: activeRect.height,
      visible: true,
    })
  }, [location.pathname, links])

  useEffect(() => {
    const nav = navRef.current
    if (!nav || typeof ResizeObserver !== 'function') return undefined

    const measure = () => {
      const active = nav.querySelector('[data-nav-active="true"]') || nav.querySelector('[aria-current="page"]')
      if (!active) {
        setIndicator((s) => ({ ...s, visible: false }))
        return
      }
      const navRect = nav.getBoundingClientRect()
      const activeRect = active.getBoundingClientRect()
      setIndicator({
        left: activeRect.left - navRect.left,
        width: activeRect.width,
        height: activeRect.height,
        visible: true,
      })
    }

    const observer = new ResizeObserver(measure)
    observer.observe(nav)
    return () => observer.disconnect()
  }, [location.pathname, links])

  return (
    <nav
      ref={navRef}
      className="relative hidden items-center rounded-full bg-[#f1f0f0] p-1 border border-slate-200/70 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] lg:flex"
      aria-label="Main"
    >
      {/* Sliding pill indicator */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute h-[32px] rounded-full bg-white shadow-sm border border-slate-200/80 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          left: indicator.left,
          width: indicator.width,
          opacity: indicator.visible ? 1 : 0,
        }}
      />

      {links.map((item, index) => {
        const isActive = item.end
          ? location.pathname === item.to
          : location.pathname.startsWith(item.to)

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            data-nav-active={isActive ? 'true' : undefined}
            className={`enter-rise relative z-10 flex h-[32px] items-center rounded-full px-3.5 text-[13.5px] font-medium transition-colors duration-200 ${
              isActive
                ? 'text-brand-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

/* -------------------------------------------------------------------------- */
/* Auth control — sign in, or the profile dropdown                            */
/* -------------------------------------------------------------------------- */

function AuthControl() {
  const { user, profile, configured, signOut } = useAuth()
  const { isAdmin } = useIsAdmin()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const dropdownRef = useRef(null)
  const triggerRef = useRef(null)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (e) => {
      if (e.key === 'Escape') close()
    }
    const onPointerDown = (e) => {
      if (dropdownRef.current?.contains(e.target)) return
      if (triggerRef.current?.contains(e.target)) return
      close()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [open, close])

  const handleSignOut = useCallback(async () => {
    if (busy) return
    setBusy(true)
    close()
    try {
      await signOut()
    } finally {
      setBusy(false)
    }
  }, [busy, close, signOut])

  if (!configured) return null

  if (!user) {
    return (
      <Link
        to="/auth"
        className="inline-flex h-[34px] sm:h-[38px] items-center justify-center gap-1 rounded-full bg-brand-600 px-3.5 sm:px-5 text-[12.5px] sm:text-[13.5px] font-semibold text-white shadow-sm shadow-brand-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md hover:shadow-brand-600/25 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        <span>Sign in</span>
      </Link>
    )
  }

  return (
    <div className="relative" ref={triggerRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className="group/profile inline-flex h-[34px] sm:h-[38px] items-center gap-1.5 sm:gap-2 rounded-full border border-slate-200/90 bg-white/90 py-1 pl-1.5 pr-2.5 sm:pr-3 text-[12.5px] sm:text-[13.5px] font-medium text-slate-700 shadow-xs backdrop-blur-sm transition-all duration-200 hover:border-brand-200 hover:bg-brand-50/50 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover ring-1 ring-slate-200" />
        ) : (
          <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 text-[10px] sm:text-[11px] font-bold text-white shadow-xs">
            {(profile?.username ?? user.email ?? '?').charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden max-w-28 truncate sm:inline">{profile?.username ?? user.email}</span>
        <svg
          className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-hover/profile:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className={`${ENTER_POP} absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-[0_18px_40px_-16px_rgba(16,42,67,0.25)] backdrop-blur-md z-50`}
          role="menu"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-ink">{profile?.username ?? user.email}</p>
            <p className="mt-0.5 truncate text-xs text-muted">{user.email}</p>
          </div>
          <div className="my-1 border-t border-slate-100" />
          {isAdmin && (
            <NavLink to="/admin" onClick={close} className={menuItem} role="menuitem">
              <AdminIcon />
              Admin
            </NavLink>
          )}
          <NavLink to="/profile" onClick={close} className={menuItem} role="menuitem">
            <UserIcon />
            Profile
          </NavLink>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={busy}
            aria-busy={busy}
            className={`${menuItem} w-full text-danger disabled:cursor-wait disabled:opacity-60`}
            role="menuitem"
          >
            <SignOutIcon />
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  )
}

const menuItem =
  'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100 hover:text-ink'

function UserIcon() {
  return (
    <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function AdminIcon() {
  return (
    <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg className="h-4 w-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/* Mobile Menu — dedicated overlay and solid drawer for phone screens         */
/* -------------------------------------------------------------------------- */

function MobileMenu({ links, onClose }) {
  const { user, profile, signOut } = useAuth()
  const [busy, setBusy] = useState(false)

  // Prevent background body scroll when mobile menu is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])

  const handleSignOut = async () => {
    if (busy) return
    setBusy(true)
    onClose()
    try {
      await signOut()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* Backdrop scrim overlay */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-md transition-opacity duration-200 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Solid slide-down mobile menu panel over the blurred screen */}
      <div
        className="fixed inset-x-0 top-[70px] z-50 max-h-[calc(100vh-70px)] overflow-y-auto border-b border-slate-200 bg-white shadow-2xl transition-all duration-200 lg:hidden"
        role="dialog"
        aria-label="Mobile navigation"
      >
        <div className="mx-auto max-w-lg px-4 py-4 sm:px-6">
          <nav className="flex flex-col gap-1.5" aria-label="Mobile menu">
            {links.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-50 text-brand-600 font-semibold ring-1 ring-brand-200/80 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-ink active:bg-slate-100'
                  }`
                }
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-3">
                      <span
                        className={`h-2 w-2 rounded-full transition-colors ${
                          isActive ? 'bg-brand-600' : 'bg-slate-300'
                        }`}
                      />
                      {item.label}
                    </span>
                    <svg
                      className={`h-4 w-4 transition-transform ${
                        isActive ? 'text-brand-600 translate-x-0.5' : 'text-slate-400'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User profile / Auth in mobile menu if logged in */}
          {user && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-3 px-3 py-2">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 text-xs font-bold text-white shadow-xs">
                    {(profile?.username ?? user.email ?? '?').charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{profile?.username ?? user.email}</p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <NavLink
                  to="/profile"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <UserIcon />
                  Profile
                </NavLink>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={busy}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-semibold text-danger hover:bg-red-100"
                >
                  <SignOutIcon />
                  {busy ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}