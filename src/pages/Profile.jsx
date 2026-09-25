import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getProgress, isLevelUnlocked, clearLocalProgress } from '../lib/progress.js'
import { fetchUserScores, resetUserProgress } from '../lib/profile.js'
import { fetchPlayerSnapshot } from '../lib/leaderboard.js'
import { isSupabaseConfigured } from '../lib/supabase.js'

const USERNAME_RE = /^[A-Za-z0-9_.-]{1,24}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MODES = [
  { key: 'mc', label: 'Multiple Choice', short: 'MC' },
  { key: 'write', label: 'Write a Query', short: 'Write' },
  { key: 'bug', label: 'Fix the Bug', short: 'Bug' },
]

const BOARD_MODES = [
  ...MODES.map(({ key, short }) => ({ key, label: short })),
  { key: 'global', label: 'Global' },
]

const MODE_TITLE = { mc: 'Multiple Choice', write: 'Write a Query', bug: 'Fix the Bug' }
const LEVEL_TITLE = { easy: 'Easy', medium: 'Medium', hard: 'Hard', all: 'All Levels' }

const LEVELS = [
  { key: 'easy', label: 'Easy', desc: 'Warm up', short: 'E', bar: 'from-emerald-400 to-teal-400', tag: 'text-emerald-300', ring: 'border-emerald-500/50', chip: 'bg-emerald-500/15 text-emerald-300', glow: 'shadow-[0_0_18px_rgba(16,185,129,0.25)]', hex: '#34d399' },
  { key: 'medium', label: 'Medium', desc: 'Getting sharp', short: 'M', bar: 'from-amber-400 to-orange-400', tag: 'text-amber-300', ring: 'border-amber-500/50', chip: 'bg-amber-500/15 text-amber-300', glow: 'shadow-[0_0_18px_rgba(245,158,11,0.25)]', hex: '#fbbf24' },
  { key: 'hard', label: 'Hard', desc: 'The real boss fight', short: 'H', bar: 'from-rose-400 to-pink-400', tag: 'text-rose-300', ring: 'border-rose-500/50', chip: 'bg-rose-500/15 text-rose-300', glow: 'shadow-[0_0_18px_rgba(244,63,94,0.25)]', hex: '#fb7185' },
  { key: 'all', label: 'All Levels', desc: 'Every question, mixed', short: 'A', bar: 'from-cyan-400 to-fuchsia-400', tag: 'text-cyan-300', ring: 'border-cyan-500/40', chip: 'bg-cyan-500/15 text-cyan-300', glow: 'shadow-[0_0_18px_rgba(34,211,238,0.25)]', hex: '#22d3ee' },
]

const LOCK_HINTS = {
  hard: '75% on Easy+Medium',
  all: '75% on all three',
}

const levelFilter = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
  { key: 'all', label: 'All Levels' },
]

const MODE_ACCENTS = {
  mc: {
    strip: 'from-indigo-400 to-cyan-400',
    chip: 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300',
    glow: 'shadow-[0_0_14px_rgba(129,140,248,0.35)]',
    tag: 'text-indigo-300',
  },
  write: {
    strip: 'from-emerald-400 to-teal-400',
    chip: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    glow: 'shadow-[0_0_14px_rgba(52,211,153,0.35)]',
    tag: 'text-emerald-300',
  },
  bug: {
    strip: 'from-rose-400 to-orange-400',
    chip: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
    glow: 'shadow-[0_0_14px_rgba(251,113,133,0.35)]',
    tag: 'text-rose-300',
  },
  global: {
    strip: 'from-cyan-400 to-fuchsia-400',
    chip: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
    glow: 'shadow-[0_0_14px_rgba(34,211,238,0.35)]',
    tag: 'text-cyan-300',
  },
}

const LEVEL_ACCENTS = {
  easy: {
    chip: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]',
  },
  medium: {
    chip: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]',
  },
  hard: {
    chip: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
    glow: 'shadow-[0_0_12px_rgba(244,63,94,0.35)]',
  },
  all: {
    chip: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
    glow: 'shadow-[0_0_12px_rgba(34,211,238,0.3)]',
  },
}

function modeShort(mode) {
  return MODES.find((m) => m.key === mode)?.short ?? '—'
}

function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '—'
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${Math.floor(totalSeconds % 60)}s`
  return `${Math.round(totalSeconds)}s`
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function initialFor({ profile, user }) {
  return (profile?.username ?? user?.email ?? '?').charAt(0).toUpperCase()
}

function rowPercent(row) {
  if (!row?.total_questions) return null
  return Math.round((row.correct_count / row.total_questions) * 100)
}

function gameStats(rows, game) {
  const filtered = (rows ?? []).filter((r) => r?.game === game)
  if (filtered.length === 0) return { sessions: 0, totalSeconds: 0, averageScore: null, bestPct: null }
  let totalSeconds = 0
  let sumPct = 0
  let countPct = 0
  let bestPct = null
  for (const r of filtered) {
    const t = Number.isFinite(r.time_seconds) && r.time_seconds > 0 ? r.time_seconds : 0
    totalSeconds += t
    const p = rowPercent(r)
    if (p !== null) {
      sumPct += p
      countPct += 1
      if (bestPct === null || p > bestPct) bestPct = p
    }
  }
  return { sessions: filtered.length, totalSeconds, averageScore: countPct ? Math.round(sumPct / countPct) : null, bestPct }
}

function rankStyle(rank) {
  if (rank === 1) return 'border-amber-400/60 bg-amber-500/15 text-amber-300'
  if (rank === 2) return 'border-slate-300/50 bg-slate-200/15 text-slate-200'
  if (rank === 3) return 'border-amber-700/70 bg-amber-700/20 text-amber-500'
  return 'border-slate-700 bg-slate-800 text-slate-400'
}

function ProgressRing({ pct = 0, color = '#818cf8', locked = false, done = false, short = '', active = false, size = 52, stroke = 5 }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, pct))
  const offset = circumference * (1 - clamped / 100)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth={stroke} />
        {!locked && clamped > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {locked ? (
          <span className="text-sm">🔒</span>
        ) : done ? (
          <span className="text-sm font-black text-emerald-300">✔</span>
        ) : (
          <span className={`text-xs font-black ${active ? 'text-white' : 'text-slate-500'}`}>{short}</span>
        )}
      </div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete, disabled }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-600 outline-none transition-colors focus:border-indigo-500 disabled:opacity-50"
      />
    </label>
  )
}

function Section({ title, children, danger }) {
  return (
    <section className={`rounded-2xl border bg-slate-900 p-5 ${danger ? 'border-rose-800/60' : 'border-slate-800'}`}>
      <h3 className={`mb-4 text-sm font-semibold uppercase tracking-wider ${danger ? 'text-rose-400' : 'text-slate-400'}`}>{title}</h3>
      {children}
    </section>
  )
}

function Feedback({ error, message }) {
  if (!error && !message) return null
  return <p className={`text-sm ${error ? 'text-rose-400' : 'text-emerald-400'}`}>{error || message}</p>
}

function avatarPreviewUrl(profile) {
  return profile?.avatar_url || ''
}

export default function Profile() {
  const { user, profile, signOut, updateProfileFields, changeEmail, changeAvatar, updatePassword } = useAuth()
  const [progress, setProgress] = useState(null)
  const [scores, setScores] = useState(null)
  const [leaderboard, setLeaderboard] = useState(null)
  const [boardTab, setBoardTab] = useState(null)
  const [boardLevel, setBoardLevel] = useState('easy')

  const [showEdit, setShowEdit] = useState(false)

  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [identityBusy, setIdentityBusy] = useState(false)
  const [identityError, setIdentityError] = useState(null)
  const [identityMessage, setIdentityMessage] = useState(null)

  const [emailField, setEmailField] = useState('')
  const [emailBusy, setEmailBusy] = useState(false)
  const [emailError, setEmailError] = useState(null)
  const [emailMessage, setEmailMessage] = useState(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordError, setPasswordError] = useState(null)
  const [passwordMessage, setPasswordMessage] = useState(null)

  const [resetStep, setResetStep] = useState(0)
  const [pendingScores, setPendingScores] = useState(false)
  const [resetBusy, setResetBusy] = useState(false)
  const [resetError, setResetError] = useState(null)
  const [resetMessage, setResetMessage] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarError, setAvatarError] = useState(null)
  const [avatarMessage, setAvatarMessage] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    let active = true
    if (!user?.id) return undefined
    Promise.all([getProgress('sql', user.id), getProgress('mongo', user.id)])
      .then(([sql, mongo]) => {
        if (!active) return
        setProgress({ sql, mongo })
      })
      .catch(() => {
        if (!active) return
        setProgress({ sql: { completed: [], best: {} }, mongo: { completed: [], best: {} } })
      })
    fetchUserScores(user.id).then((res) => {
      if (!active) return
      setScores(res)
      const first = res?.rows?.[0]
      setBoardTab((prev) => {
        if (prev) return prev
        return first?.mode && ['mc', 'write', 'bug'].includes(first.mode) ? first.mode : 'mc'
      })
      setBoardLevel((prev) => {
        if (prev && ['easy', 'medium', 'hard', 'all'].includes(prev)) return prev
        return first?.level && ['easy', 'medium', 'hard', 'all'].includes(first.level) ? first.level : 'easy'
      })
    })
    return () => {
      active = false
    }
  }, [user?.id, refreshKey])

  useEffect(() => {
    let active = true
    if (!user?.id || !boardTab) return undefined
    setLeaderboard(null)
    if (isSupabaseConfigured) {
      const scopedMode = boardTab === 'global' ? null : boardTab
      const scopedLevel = boardTab === 'global' ? null : boardLevel
      fetchPlayerSnapshot({ game: 'sql', mode: scopedMode, level: scopedLevel, userId: user.id, top: 10 }).then((res) => {
        if (!active) return
        setLeaderboard(res)
      })
    }
    return () => {
      active = false
    }
  }, [user?.id, boardTab, boardLevel])

  useEffect(() => {
    setUsername(profile?.username ?? '')
    setName(profile?.name ?? '')
  }, [profile?.username, profile?.name])

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview('')
      return undefined
    }
    const url = URL.createObjectURL(avatarFile)
    setAvatarPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center text-sm text-slate-500">
        Profile is unavailable until Supabase is configured.
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-2xl font-bold text-white">Your profile</h1>
        <p className="mt-3 text-sm text-slate-400">Sign in to see your account details and game progress.</p>
        <Link to="/auth" className="mt-6 inline-block rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
          Sign in
        </Link>
      </div>
    )
  }

  const sqlProgress = progress?.sql ?? { completed: [], best: {} }
  const mongoProgress = progress?.mongo ?? { completed: [], best: {} }
  const recentRows = (scores?.rows ?? []).slice(0, 10)
  const avatar = avatarPreview || avatarPreviewUrl(profile)

  const handleSaveIdentity = async (e) => {
    e.preventDefault()
    setIdentityError(null)
    setIdentityMessage(null)
    if (!USERNAME_RE.test(username.trim())) {
      setIdentityError('Username must be 1–24 characters using letters, numbers, _ . or -.')
      return
    }
    if (!name.trim()) {
      setIdentityError('Please enter your name.')
      return
    }
    setIdentityBusy(true)
    const { error } = await updateProfileFields({ username: username.trim(), name: name.trim() })
    setIdentityBusy(false)
    if (error) {
      setIdentityError(error.message ?? 'Could not save your details.')
      return
    }
    setIdentityMessage('Profile updated.')
  }

  const handlePickAvatar = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError(null)
    setAvatarMessage(null)
    setAvatarFile(file)
  }

  const handleUploadAvatar = async () => {
    if (!avatarFile) return
    setAvatarBusy(true)
    setAvatarError(null)
    setAvatarMessage(null)
    const { error } = await changeAvatar(avatarFile)
    setAvatarBusy(false)
    if (error) {
      setAvatarError(error.message ?? 'Could not upload the image.')
      setAvatarFile(null)
      return
    }
    setAvatarMessage('Avatar updated.')
    setAvatarFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveAvatar = async () => {
    setAvatarBusy(true)
    setAvatarError(null)
    setAvatarMessage(null)
    const { error } = await updateProfileFields({ avatar_url: null })
    setAvatarBusy(false)
    if (error) {
      setAvatarError(error.message ?? 'Could not remove the avatar.')
      return
    }
    setAvatarMessage('Avatar removed.')
  }

  const handleChangeEmail = async (e) => {
    e.preventDefault()
    setEmailError(null)
    setEmailMessage(null)
    if (!EMAIL_RE.test(emailField.trim())) {
      setEmailError('Please enter a valid email address.')
      return
    }
    if (emailField.trim().toLowerCase() === user.email?.toLowerCase()) {
      setEmailError('That is already your sign-in email.')
      return
    }
    setEmailBusy(true)
    const { error } = await changeEmail(emailField)
    setEmailBusy(false)
    if (error) {
      setEmailError(error.message ?? 'Could not change the email.')
      return
    }
    setEmailMessage('Email updated.')
    setEmailField('')
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordMessage(null)
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    setPasswordBusy(true)
    const { error } = await updatePassword(newPassword)
    setPasswordBusy(false)
    if (error) {
      setPasswordError(error.message ?? 'Could not update the password.')
      return
    }
    setPasswordMessage('Password updated.')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleResetLevels = async (includeScores) => {
    setResetBusy(true)
    setResetError(null)
    setResetMessage(null)
    const res = await resetUserProgress(includeScores)
    setResetBusy(false)
    if (res.error) {
      setResetError(res.error.message ?? 'Could not reset progress.')
      return
    }
    clearLocalProgress()
    setRefreshKey((k) => k + 1)
    setResetStep(0)
    setResetMessage(includeScores ? 'Progress and session history reset.' : 'Level progress reset.')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900">
        <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full border border-indigo-500/20" />
        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full border border-fuchsia-500/20" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full border border-cyan-500/10" />

        <div className="relative flex flex-col items-center gap-4 px-6 py-8 sm:flex-row sm:gap-6">
          {avatar ? (
            <img
              src={avatar}
              alt="Your avatar"
              className="h-20 w-20 shrink-0 rounded-full border border-indigo-400/40 object-cover shadow-[0_0_24px_rgba(99,102,241,0.4)]"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-indigo-400/40 bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-3xl font-black text-white shadow-[0_0_24px_rgba(99,102,241,0.4)]">
              {initialFor({ profile, user })}
            </div>
          )}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white">{profile?.username ?? 'player'}</h1>
            {profile?.name && <div className="text-sm text-slate-300">{profile.name}</div>}
            <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-500 sm:justify-start">
              <span>{user.email}</span>
              <span>Member since {formatDate(profile?.created_at)}</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:ml-auto sm:flex-col sm:items-end">
            <button
              type="button"
              onClick={() => setShowEdit((s) => !s)}
              className="rounded-full border border-indigo-700/60 px-4 py-2 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-500/10"
            >
              {showEdit ? 'Close editor' : 'Edit profile'}
            </button>
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-rose-700/60 px-4 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {showEdit && (
        <div className="space-y-4">
          <Section title="Avatar">
            <div className="flex flex-wrap items-center gap-4">
              {avatar ? (
                <img src={avatar} alt="Avatar preview" className="h-16 w-16 rounded-full border border-slate-700 object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-xl font-black text-white">
                  {initialFor({ profile, user })}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePickAvatar} />
                <button
                  type="button"
                  disabled={avatarBusy}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 disabled:opacity-40"
                >
                  {avatarFile ? 'Choose another' : 'Change photo'}
                </button>
                {avatarFile && (
                  <button
                    type="button"
                    disabled={avatarBusy}
                    onClick={handleUploadAvatar}
                    className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
                  >
                    {avatarBusy ? 'Uploading…' : 'Save photo'}
                  </button>
                )}
                {profile?.avatar_url && !avatarFile && (
                  <button
                    type="button"
                    disabled={avatarBusy}
                    onClick={handleRemoveAvatar}
                    className="rounded-full border border-rose-700/60 px-4 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10 disabled:opacity-40"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">PNG, JPEG or WebP, up to 2 MB.</p>
            <div className="mt-2"><Feedback error={avatarError} message={avatarMessage} /></div>
          </Section>

          <Section title="Profile details">
            <form onSubmit={handleSaveIdentity} className="grid gap-4 sm:grid-cols-2">
              <Field label="Username" value={username} onChange={setUsername} placeholder="player99" autoComplete="username" />
              <Field label="Name" value={name} onChange={setName} placeholder="Your full name" autoComplete="name" />
              <div className="sm:col-span-2">
                <Feedback error={identityError} message={identityMessage} />
                <button
                  type="submit"
                  disabled={identityBusy}
                  className="mt-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {identityBusy ? 'Saving…' : 'Save details'}
                </button>
              </div>
            </form>
          </Section>

          <Section title="Email">
            <p className="mb-4 text-sm text-slate-400">
              You are signed in as <span className="text-slate-200">{user.email}</span>. Changing your email takes effect instantly — no confirmation email is sent.
            </p>
            <form onSubmit={handleChangeEmail} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Field label="New email" type="email" value={emailField} onChange={setEmailField} placeholder="you@example.com" autoComplete="email" />
              </div>
              <button
                type="submit"
                disabled={emailBusy || !emailField.trim()}
                className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {emailBusy ? 'Working…' : 'Change email'}
              </button>
            </form>
            <div className="mt-2"><Feedback error={emailError} message={emailMessage} /></div>
          </Section>

          <Section title="Password">
            <form onSubmit={handleChangePassword} className="grid gap-4 sm:grid-cols-2">
              <Field label="New password" type="password" value={newPassword} onChange={setNewPassword} placeholder="••••••••" autoComplete="new-password" />
              <Field label="Confirm password" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" autoComplete="new-password" />
              <div className="sm:col-span-2">
                <Feedback error={passwordError} message={passwordMessage} />
                <button
                  type="submit"
                  disabled={passwordBusy || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="mt-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {passwordBusy ? 'Working…' : 'Update password'}
                </button>
              </div>
            </form>
          </Section>

          <Section title="Reset progress" danger>
            <p className="mb-2 text-sm text-slate-400">
              Reset your SQL and Mongo level progress back to zero — locked levels, best scores, and completed markers are cleared.
            </p>
            <p className="mb-4 text-sm text-slate-500">
              Your leaderboard scores stay on the public board.
            </p>
            {resetStep === 0 ? (
              <button
                type="button"
                onClick={() => {
                  setResetError(null)
                  setResetMessage(null)
                  setResetStep(1)
                }}
                className="rounded-full border border-rose-700/60 px-5 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10"
              >
                Reset progress
              </button>
            ) : null}
            {resetStep === 1 ? (
              <div className="rounded-xl border border-rose-800/60 bg-rose-950/30 p-4">
                <p className="mb-3 text-sm text-slate-300">
                  This resets <span className="font-semibold text-white">SQL and Mongo level progress to zero</span> — locked levels, best scores and completed markers are cleared.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={resetBusy}
                    onClick={() => setResetStep(2)}
                    className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Yes, reset progress
                  </button>
                  <button
                    type="button"
                    disabled={resetBusy}
                    onClick={() => setResetStep(0)}
                    className="rounded-full border border-slate-600 px-5 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 disabled:opacity-40"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
            {resetStep === 2 ? (
              <div className="rounded-xl border border-rose-800/60 bg-rose-950/30 p-4">
                <p className="mb-3 text-sm text-slate-300">
                  Do you also want to clear your <span className="font-semibold text-white">Practice &amp; sessions and Recent sessions</span>? Your score and attempt history will be archived.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={resetBusy}
                    onClick={() => {
                      setPendingScores(true)
                      setResetStep(3)
                    }}
                    className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Yes, reset everything
                  </button>
                  <button
                    type="button"
                    disabled={resetBusy}
                    onClick={() => {
                      setPendingScores(false)
                      setResetStep(3)
                    }}
                    className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    No, just level progress
                  </button>
                  <button
                    type="button"
                    disabled={resetBusy}
                    onClick={() => setResetStep(0)}
                    className="rounded-full border border-slate-600 px-5 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 disabled:opacity-40"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
            {resetStep === 3 ? (
              <div className="rounded-xl border border-rose-800/60 bg-rose-950/30 p-4">
                <p className="mb-3 text-sm text-slate-300">
                  Are you absolutely sure? This{' '}
                  <span className="font-semibold text-white">{pendingScores ? 'clears your level progress and archives your session history' : 'clears your level progress'}</span>
                  — it cannot be undone.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={resetBusy}
                    onClick={() => handleResetLevels(pendingScores)}
                    className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {resetBusy ? 'Resetting…' : 'Yes, I’m sure — reset'}
                  </button>
                  <button
                    type="button"
                    disabled={resetBusy}
                    onClick={() => setResetStep(2)}
                    className="rounded-full border border-slate-600 px-5 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 disabled:opacity-40"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={resetBusy}
                    onClick={() => setResetStep(0)}
                    className="rounded-full border border-slate-600 px-5 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 disabled:opacity-40"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
            <div className="mt-2"><Feedback error={resetError} message={resetMessage} /></div>
          </Section>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">SQL game progress</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">3 modes · 4 levels</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {MODES.map((mode) => {
            const a = MODE_ACCENTS[mode.key]
            return (
              <div key={mode.key} className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${a.strip} opacity-80`} />
                <div className="mb-3 flex items-center gap-2">
                  <span className={`rounded-lg border px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider ${a.chip}`}>
                    {mode.key.toUpperCase()}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">{mode.label}</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {LEVELS.map((lv) => {
                    const key = `${mode.key}_${lv.key}`
                    const pct = sqlProgress.best[key] ?? 0
                    const done = (sqlProgress.completed ?? []).includes(key)
                    const active = pct > 0
                    const unlocked = isLevelUnlocked(lv.key, sqlProgress, mode.key)
                    return (
                      <Link
                        key={lv.key}
                        to={`/profile/report/${mode.key}/${lv.key}`}
                        title={`View ${mode.label} · ${lv.label} report`}
                        className="group flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 transition-all hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-800/60"
                      >
                        <ProgressRing
                          pct={pct}
                          color={lv.hex}
                          locked={!unlocked}
                          done={done}
                          short={lv.short}
                          active={unlocked && active}
                        />
                        <div className="min-w-0 flex-1">
                          <div className={`truncate text-sm font-semibold ${unlocked ? 'text-white' : 'text-slate-400'}`}>{lv.label}</div>
                          <div className="truncate text-[10px] text-slate-500">{unlocked ? lv.desc : LOCK_HINTS[lv.key] ?? 'locked'}</div>
                          <div className="mt-1 text-[10px]">
                            {done ? (
                              <span className="font-semibold text-emerald-300">✔ completed</span>
                            ) : active ? (
                              <span className={`font-mono font-bold ${lv.tag}`}>{pct}%</span>
                            ) : unlocked ? (
                              <span className="text-slate-600">not started</span>
                            ) : (
                              <span className="rounded-full border border-slate-700 bg-slate-800/60 px-1.5 py-px font-semibold text-slate-500">locked</span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-600 transition-transform group-hover:translate-x-0.5" aria-hidden="true">›</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        {(mongoProgress.completed ?? []).length > 0 || Object.keys(mongoProgress.best ?? {}).length > 0 ? (
          <p className="mt-3 text-xs text-slate-500">
            Mongo progress saved: {mongoProgress.completed.length} completed level{(mongoProgress.completed.length === 1 ? '' : 's')}.
          </p>
        ) : null}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Leaderboard</h2>
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
          <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${(MODE_ACCENTS[boardTab] ?? MODE_ACCENTS.mc).strip} opacity-80`} />
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${(MODE_ACCENTS[boardTab] ?? MODE_ACCENTS.mc).tag}`}>
              SQL · {MODE_TITLE[boardTab] ?? 'Global'}
              {boardTab !== 'global' ? ` · ${LEVEL_TITLE[boardLevel] ?? 'All'}` : ''}
            </span>
            <Link
              to={`/leaderboard?game=sql&mode=${boardTab ?? 'mc'}&level=${boardLevel ?? 'easy'}`}
              className="text-xs font-medium text-indigo-300 transition-colors hover:text-indigo-200"
            >
              View all →
            </Link>
          </div>

          {boardTab && (
            <>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {BOARD_MODES.map((m) => {
                  const active = boardTab === m.key
                  const a = MODE_ACCENTS[m.key]
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setBoardTab(m.key)}
                      className={
                        'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ' +
                        (active
                          ? `${a.chip} ${a.glow}`
                          : 'bg-slate-800/70 text-slate-500 hover:bg-slate-700 hover:text-slate-300')
                      }
                    >
                      {m.label}
                    </button>
                  )
                })}
              </div>
              {boardTab !== 'global' && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {levelFilter.map((lv) => {
                    const active = boardLevel === lv.key
                    const a = LEVEL_ACCENTS[lv.key]
                    return (
                      <button
                        key={lv.key}
                        type="button"
                        onClick={() => setBoardLevel(lv.key)}
                        className={
                          'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ' +
                          (active
                            ? `${a.chip} ${a.glow}`
                            : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800 hover:text-slate-300')
                        }
                      >
                        {lv.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {!leaderboard ? (
            <p className="py-4 text-center text-sm text-slate-500">Loading…</p>
          ) : leaderboard.error ? (
            <p className="py-4 text-center text-sm text-rose-400">{leaderboard.error.message}</p>
          ) : leaderboard.top.length === 0 && !leaderboard.you ? (
            <p className="py-4 text-center text-sm text-slate-500">
              No scores yet for {MODE_TITLE[boardTab] ?? 'this category'}
              {boardTab !== 'global' ? ` · ${LEVEL_TITLE[boardLevel]}` : ''} — sign in and finish a quiz to land on the board!
            </p>
          ) : (
            <ul className="divide-y divide-slate-800/60">
              {leaderboard.top.map((row, idx) => {
                const rank = idx + 1
                const isYou = user?.id && row.user_id === user.id
                return (
                  <li
                    key={row.id ?? idx}
                    className={`flex items-center gap-2 px-2 py-1.5 ${isYou ? '-mx-1.5 rounded-lg bg-indigo-500/10' : ''}`}
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${rankStyle(rank)}`}>
                      {rank}
                    </span>
                    <span className={`min-w-0 flex-1 truncate text-sm ${isYou ? 'font-semibold text-white' : 'text-slate-300'}`}>
                      {row.username || 'Anonymous'}
                      {isYou ? <span className="ml-2 rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">you</span> : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-3 text-xs tabular-nums">
                      <span className="font-bold text-emerald-300">
                        {row.score}
                        <span className="ml-0.5 font-medium text-slate-500">pts</span>
                      </span>
                      <span className="text-slate-400">
                        {row.correct_count ?? 0}/{row.total_questions ?? 0}
                      </span>
                      <span className={row.lives_left > 0 ? 'text-emerald-300/80' : 'text-slate-600'}>♥{row.lives_left ?? 0}</span>
                      <span className="w-10 text-right text-slate-500">{formatTime(row.time_seconds)}</span>
                    </span>
                  </li>
                )
              })}
              {leaderboard.you && leaderboard.you.rank > leaderboard.top.length ? (
                <li className="-mx-1.5 -mb-1 mt-1.5 flex items-center gap-2 rounded-lg bg-indigo-500/10 px-2 py-1.5">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${rankStyle(leaderboard.you.rank)}`}>
                    {leaderboard.you.rank}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                    {leaderboard.you.username || 'You'}
                    <span className="ml-2 rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">you</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-xs tabular-nums">
                    <span className="font-bold text-emerald-300">
                      {leaderboard.you.score}
                      <span className="ml-0.5 font-medium text-slate-500">pts</span>
                    </span>
                    <span className="text-slate-400">
                      {leaderboard.you.correct_count ?? 0}/{leaderboard.you.total_questions ?? 0}
                    </span>
                    <span className={leaderboard.you.lives_left > 0 ? 'text-emerald-300/80' : 'text-slate-600'}>♥{leaderboard.you.lives_left ?? 0}</span>
                    <span className="w-10 text-right text-slate-500">{formatTime(leaderboard.you.time_seconds)}</span>
                  </span>
                </li>
              ) : null}
            </ul>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Practice &amp; sessions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {['sql', 'mongo'].map((gameId) => {
            const g = gameStats(scores?.rows, gameId)
            const label = gameId === 'sql' ? 'SQL' : 'Mongo'
            return (
              <div key={gameId} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Sessions</div>
                    <div className="mt-1 text-lg font-bold text-white">{scores ? String(g.sessions) : '…'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total play time</div>
                    <div className="mt-1 text-lg font-bold text-white">{scores ? formatDuration(g.totalSeconds) : '…'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Average score</div>
                    <div className="mt-1 text-lg font-bold text-white">{scores ? (g.averageScore === null ? '—' : `${g.averageScore}%`) : '…'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Best score</div>
                    <div className="mt-1 text-lg font-bold text-white">{scores ? (g.bestPct === null ? '—' : `${g.bestPct}%`) : '…'}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <h3 className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-white">Recent sessions</h3>
          {recentRows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              No sessions yet.{' '}
              <Link to="/quiz/sql" className="text-indigo-300 hover:text-indigo-200">Play a level</Link> to record one.
            </p>
          ) : (
            <ul className="divide-y divide-slate-800/60">
              {recentRows.map((row) => (
                <li key={row.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                      {row.game}
                    </span>
                    {row.mode ? (
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                        {modeShort(row.mode)} · {LEVEL_TITLE[row.level] ?? row.level}
                      </span>
                    ) : null}
                    <span className="text-slate-500">{formatDate(row.created_at)}</span>
                  </span>
                  <span className="text-slate-300">
                    <span className="font-semibold text-white">{row.score}<span className="ml-0.5 font-medium text-slate-500">pts</span></span>
                    {' '}· {formatDuration(row.time_seconds)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}