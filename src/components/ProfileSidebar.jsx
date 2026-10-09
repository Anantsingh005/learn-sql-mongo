import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchUserScores } from '../lib/profile.js'

const TIPS = [
  'Small steps every day lead to big results!',
  'Read the question twice before you write the query.',
  'A wrong query teaches you more than a safe one.',
  'Ten minutes a day beats one cram session a month.',
  'Stuck on a JOIN? Sketch both tables on paper first.',
]

const ICONS = {
  sessions: (
    <>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </>
  ),
  avg: (
    <>
      <path d="M4 20h16" />
      <path d="M7 20v-5" />
      <path d="M12 20V9" />
      <path d="M17 20v-7" />
    </>
  ),
  streak: (
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  ),
  badges: (
    <>
      <circle cx="12" cy="15" r="5" />
      <path d="M8.5 10.5 6 3h12l-2.5 7.5" />
      <path d="m9.8 14.4 1.6 1.6 3-3" />
    </>
  ),
  progress: (
    <>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m7 16 4-6 4 4 4-8" />
    </>
  ),
  achievements: (
    <>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </>
  ),
  activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  settings: (
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  bulb: (
    <>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
}

const LINKS = [
  { label: 'My Progress', to: '/profile', icon: ICONS.progress },
  { label: 'Achievements', to: null, icon: ICONS.achievements, soon: true },
  { label: 'Activity', to: '/profile', icon: ICONS.activity },
  { label: 'Settings', to: '/profile', icon: ICONS.settings },
]

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function dayStreak(rows) {
  const days = new Set()
  for (const row of rows) {
    const d = new Date(row.created_at)
    if (Number.isNaN(d.getTime())) continue
    days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
  }
  if (days.size === 0) return 0
  const key = (dt) => `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`
  const cur = new Date()
  if (!days.has(key(cur))) {
    cur.setDate(cur.getDate() - 1)
    if (!days.has(key(cur))) return 0
  }
  let streak = 0
  while (days.has(key(cur))) {
    streak += 1
    cur.setDate(cur.getDate() - 1)
  }
  return streak
}

function Tile({ label, value, icon, soon }) {
  return (
    <div className="rounded-xl border border-line bg-white p-3.5">
      <div className="flex items-center gap-1.5 text-muted">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {icon}
        </svg>
        <span className="truncate text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="text-xl font-bold tabular-nums text-ink">{value}</span>
        {soon && (
          <span className="rounded-full bg-brand-100 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-brand-700">
            Soon
          </span>
        )}
      </div>
    </div>
  )
}

function StatIcon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export default function ProfileSidebar() {
  const { user, profile } = useAuth()
  const [scores, setScores] = useState(null)
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    let active = true
    if (!user?.id) return undefined
    fetchUserScores(user.id).then((res) => {
      if (active) setScores(res)
    })
    return () => {
      active = false
    }
  }, [user?.id])

  useEffect(() => {
    const id = window.setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 6000)
    return () => window.clearInterval(id)
  }, [])

  const signedIn = Boolean(user)
  const loading = signedIn && scores === null
  const stat = signedIn ? scores?.stats ?? null : null

  const sessions = loading ? '…' : stat ? String(stat.sessions) : '—'
  const avg = loading ? '…' : stat?.averageScore != null ? `${stat.averageScore}%` : '—'
  const streak = loading ? '…' : stat ? String(dayStreak(scores.rows)) : '—'

  const name = profile?.name || profile?.username || (signedIn ? 'Player' : 'Guest')
  const email = user?.email || 'Not signed in'
  const initial = (profile?.username || user?.email || '?').charAt(0).toUpperCase()
  const avatarUrl = profile?.avatar_url || ''

  return (
    <aside className="enter-rise relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(45,0,34,0.05)] lg:sticky lg:top-[86px]">
      <div className="pointer-events-none absolute -top-14 -right-12 h-32 w-32 rounded-full border border-brand-200/70" />
      <div className="pointer-events-none absolute -bottom-16 -left-12 h-32 w-32 rounded-full border border-plum-200/70" />

      <div className="relative border-b border-line bg-gradient-to-br from-brand-50 via-white to-plum-50 px-5 py-6">
        <div className="flex items-center gap-3.5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-14 w-14 shrink-0 rounded-full border border-brand-200 object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-brand-200 bg-gradient-to-br from-brand-100 to-plum-100 text-2xl font-black text-ink shadow-sm">
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-base font-bold text-ink">{name}</div>
            <div className="truncate text-sm text-muted">{email}</div>
            <div className="truncate text-xs text-muted">
              Member since {formatDate(profile?.created_at)}
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-b border-line px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <Tile label="Total Sessions" value={sessions} icon={ICONS.sessions} />
          <Tile label="Avg Score %" value={avg} icon={ICONS.avg} />
          <Tile label="Day Streak" value={streak} icon={ICONS.streak} />
          <Tile label="Badges Earned" value="—" icon={ICONS.badges} soon />
        </div>
      </div>

      <nav className="relative border-b border-line px-4 py-3" aria-label="Profile links">
        <ul className="flex flex-col">
          {LINKS.map((item) => {
            const rowClass =
              'flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[15px] transition-colors'
            const icon = <span className="text-muted">{<StatIcon>{item.icon}</StatIcon>}</span>
            if (item.soon) {
              return (
                <li key={item.label}>
                  <span className={`${rowClass} cursor-default text-muted`} aria-disabled="true">
                    {icon}
                    <span className="flex-1">{item.label}</span>
                    <span className="rounded-full bg-line px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-muted">
                      Soon
                    </span>
                  </span>
                </li>
              )
            }
            return (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className={`${rowClass} text-body hover:bg-brand-50 hover:text-brand-700`}
                >
                  {icon}
                  <span className="flex-1">{item.label}</span>
                  <span className="text-muted">
                    <StatIcon>{ICONS.chevron}</StatIcon>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="relative px-4 py-4">
        <div className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-brand-600">
              <StatIcon>{ICONS.bulb}</StatIcon>
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">Keep going!</p>
              <p key={tipIndex} className="enter-fade mt-0.5 text-xs leading-relaxed text-body">
                {TIPS[tipIndex]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
