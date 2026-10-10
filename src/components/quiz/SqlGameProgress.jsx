import { useAuth } from '../../context/AuthContext.jsx'
import { fetchUserScores } from '../../lib/profile.js'
import { useEffect, useState } from 'react'

function getTotalCorrect(rows = []) {
  return rows.reduce((sum, row) => sum + (Number(row.correct_count) || 0), 0)
}

function getTotalQuestions(rows = []) {
  return rows.reduce((sum, row) => sum + (Number(row.total_questions) || 0), 0)
}

function deriveLevel(rows = []) {
  const totalCorrect = getTotalCorrect(rows)
  const level = 1 + Math.floor(totalCorrect / 10)
  return Math.max(1, level)
}

const levels = ['All Levels', 'Easy', 'Medium', 'Hard']
const modes = [
  { key: 'mc', label: 'Multiple Choice', accent: 'brand' },
  { key: 'write', label: 'Write a Query', accent: 'leaf' },
  { key: 'bug', label: 'Fix the Bug', accent: 'amber' },
]

function Tile({ label, value, icon, signedOut }) {
  return (
    <div className="rounded-xl border border-line bg-white p-3.5">
      <div className="flex items-center gap-1.5 text-muted">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {icon}
        </svg>
        <span className="truncate text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-1.5">
        {signedOut ? (
          <span className="text-xs text-muted">Sign in to track</span>
        ) : (
          <span className="text-xl font-bold tabular-nums text-ink">{value}</span>
        )}
      </div>
    </div>
  )
}

function SqlGameProgress({ mode: selectedMode = 'mc', onModeChange, onLevelSelect }) {
  const { user } = useAuth()
  const [scores, setScores] = useState(null)
  const [activeLevel, setActiveLevel] = useState('All Levels')
  const [activeMode, setActiveMode] = useState(selectedMode)

  useEffect(() => {
    if (!user?.id) {
      setScores(null)
      return undefined
    }
    let active = true
    fetchUserScores(user.id).then((res) => {
      if (active) setScores(res)
    })
    return () => {
      active = false
    }
  }, [user?.id])

  useEffect(() => {
    setActiveMode(selectedMode)
  }, [selectedMode])

  const signedIn = Boolean(user)
  const rows = scores?.rows || []
  const totalCorrect = getTotalCorrect(rows)
  const totalQuestions = getTotalQuestions(rows)
  const wrong = totalQuestions - totalCorrect
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
  const level = deriveLevel(rows)
  const nextAt = 10
  const progressPct = totalCorrect % nextAt === 0 && totalCorrect > 0 ? 100 : Math.round(((totalCorrect % nextAt) / nextAt) * 100)
  const xOver = `${totalCorrect % nextAt || nextAt}/${nextAt}`

  const handleModeChange = (key) => {
    setActiveMode(key)
    if (onModeChange) onModeChange(key)
    const url = new URL(window.location.href)
    url.searchParams.set('mode', key)
    window.history.replaceState({}, '', url.pathname + url.search)
  }

  const handleLevelClick = () => {
    if (onLevelSelect) onLevelSelect(level)
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 3v16a2 2 0 0 0 2 2h16" />
              <path d="m7 16 4-6 4 4 4-8" />
            </svg>
          </span>
          <div>
            <h2 className="font-mono text-lg font-bold text-ink">SQL Game Progress</h2>
            <p className="text-sm text-muted">Track your progress across modes and levels</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {levels.map((lv) => (
            <button
              key={lv}
              type="button"
              onClick={() => setActiveLevel(lv)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                activeLevel === lv
                  ? 'bg-brand-600 text-white'
                  : 'bg-brand-50 text-brand-600 hover:bg-brand-100'
              }`}
            >
              {lv}
            </button>
          ))}
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">3 Modes · 4 Levels</span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {modes.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => handleModeChange(m.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              activeMode === m.key
                ? `bg-${m.accent}-600 text-white`
                : `bg-${m.accent}-50 text-${m.accent}-600 hover:bg-${m.accent}-100`
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">Your Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <Tile
                label="Total Questions"
                value={signedIn ? totalQuestions : '—'}
                signedOut={!signedIn}
                icon={
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </>
                }
              />
              <Tile
                label="Correct"
                value={signedIn ? totalCorrect : '—'}
                signedOut={!signedIn}
                icon={
                  <>
                    <polyline points="20 6 9 17 4 12" />
                  </>
                }
              />
              <Tile
                label="Wrong"
                value={signedIn ? wrong : '—'}
                signedOut={!signedIn}
                icon={
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                }
              />
              <Tile
                label="Accuracy"
                value={signedIn ? `${accuracy}%` : '—'}
                signedOut={!signedIn}
                icon={
                  <>
                    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                    <path d="m7 16 4-6 4 4 4-8" />
                  </>
                }
              />
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Level {signedIn ? level : '—'}</p>
                <p className="text-xs text-muted">x / 10</p>
              </div>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-plum-400 transition-all"
                style={{ width: `${signedIn ? progressPct : 0}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">Next level at 10 correct answers</p>
          </div>

          <button
            type="button"
            onClick={handleLevelClick}
            className="flex w-full items-center gap-2 rounded-xl border border-line bg-white p-4 text-left transition-colors hover:bg-brand-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" />
                <path d="m13 12-3 5h4l-3 5" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Challenge yourself!</p>
              <p className="text-xs text-muted">Try harder levels and improve your SQL skills.</p>
            </div>
          </button>

          {!signedIn && (
            <div className="rounded-xl border border-brand-100 bg-brand-50 p-3 text-sm text-brand-700">
              Sign in to track your stats
            </div>
          )}
        </div>
        <div className="rounded-xl border border-dashed border-line bg-mist/40 p-4 text-sm text-muted">
          Level rows
        </div>
      </div>
    </div>
  )
}

export default SqlGameProgress
