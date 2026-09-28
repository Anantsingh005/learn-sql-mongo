import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchPlayerSnapshot } from '../lib/leaderboard.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { isNarrow } from '../lib/viewport.js'

const GAMES = [
  { id: 'sql', label: 'SQL' },
  { id: 'mongo', label: 'Mongo' },
]

const MODES = [
  { key: 'mc', label: 'MC', icon: 'A', full: 'Multiple Choice' },
  { key: 'write', label: 'Write', icon: '>_', full: 'Write the Query' },
  { key: 'bug', label: 'Fix Bug', icon: '!', full: 'Fix the Bug' },
  { key: 'global', label: 'Global', icon: '∞', full: 'Global · all modes & levels' },
]

const LEVELS = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
  { key: 'all', label: 'All Levels' },
]

const MODE_ACCENTS = {
  mc: {
    strip: 'from-indigo-400 to-cyan-400',
    chip: 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300',
    iconBox: 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300',
    glow: 'shadow-[0_0_14px_rgba(129,140,248,0.35)]',
    tag: 'text-indigo-300',
  },
  write: {
    strip: 'from-emerald-400 to-teal-400',
    chip: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    iconBox: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    glow: 'shadow-[0_0_14px_rgba(52,211,153,0.35)]',
    tag: 'text-emerald-300',
  },
  bug: {
    strip: 'from-rose-400 to-orange-400',
    chip: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
    iconBox: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
    glow: 'shadow-[0_0_14px_rgba(251,113,133,0.35)]',
    tag: 'text-rose-300',
  },
  global: {
    strip: 'from-cyan-400 to-fuchsia-400',
    chip: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
    iconBox: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
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

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function getUserName(row) {
  return row.username || 'Anonymous'
}

function rankClass(rank) {
  if (rank === 1)
    return 'border-amber-400/60 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
  if (rank === 2)
    return 'border-slate-300/50 bg-slate-200/15 text-slate-200 shadow-[0_0_10px_rgba(226,232,240,0.2)]'
  if (rank === 3)
    return 'border-amber-700/70 bg-amber-700/20 text-amber-500 shadow-[0_0_10px_rgba(180,83,9,0.25)]'
  return 'border-slate-700 bg-slate-800/70 text-slate-500'
}

/**
 * One row of the board.
 *
 * A phone cannot fit six columns — the horizontal padding alone is 192px — so
 * below `sm` the Correct/Lives/Time cells are hidden and their values are
 * repeated as a single meta line under the player's name instead. Nothing is
 * dropped, it just moves onto a second line. The player cell is `w-full` so it
 * absorbs the leftover width and the name truncates rather than widening the
 * table, which would bring `overflow-x-auto` back into play.
 *
 * `rank` and `name` are passed explicitly so the pinned "you" row at the bottom
 * — which is the same row, just detached from the top-10 slice — can render
 * through here too, rather than as a hand-kept copy of this markup.
 */
function Row({ rank, row, isYou, pinned = false, name }) {
  const correct = row.correct_count ?? 0
  const total = row.total_questions ?? 0
  const lives = row.lives_left ?? 0
  return (
    <tr className={`${isYou ? 'bg-indigo-500/10' : ''} ${!isYou || pinned ? 'border-t border-slate-800/70' : ''}`}>
      <td className="px-2 py-2.5 sm:px-4">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-black ${rankClass(rank)}`}>
          {rank}
        </span>
      </td>
      <td className="w-full px-2 py-2.5 sm:px-4">
        <span className={`block truncate text-sm ${isYou ? 'font-semibold text-white' : 'text-slate-300'}`}>
          {name ?? getUserName(row)}
          {isYou ? <span className="ml-2 rounded-full bg-indigo-500/25 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">you</span> : null}
        </span>
        <span className="mt-0.5 block truncate text-[11px] tabular-nums text-slate-500 sm:hidden">
          {correct}/{total} · {lives}♥ · {formatTime(row.time_seconds)}
        </span>
      </td>
      <td className="px-2 py-2.5 text-right font-bold tabular-nums text-white sm:px-4 sm:text-left">
        {row.score}
      </td>
      <td className="hidden px-4 py-2.5 tabular-nums text-slate-400 sm:table-cell">
        {correct}/{total}
      </td>
      <td className="hidden px-4 py-2.5 sm:table-cell">{lives}♥</td>
      <td className="hidden px-4 py-2.5 font-mono text-slate-500 sm:table-cell">
        {formatTime(row.time_seconds)}
      </td>
    </tr>
  )
}

export default function Leaderboard() {
  const { user, profile } = useAuth()
  const [params] = useSearchParams()

  // `null` rather than a fallback, so "no valid ?mode= in the URL" stays
  // distinguishable from "explicitly asked for mc" — the phone branch below is
  // only allowed to claim the blank slate when the URL did not already fill it.
  const initialMode = ['mc', 'write', 'bug', 'global'].includes(params.get('mode'))
    ? params.get('mode')
    : null
  const initialLevel = ['easy', 'medium', 'hard', 'all'].includes(params.get('level'))
    ? params.get('level')
    : 'easy'
  const initialGame = GAMES.some((g) => g.id === params.get('game')) ? params.get('game') : 'sql'

  // A phone is handed the board unfiltered: no mode highlighted, no level row,
  // nothing fetched, and a prompt to pick. The first tap on a mode selects it and
  // brings the level row in with it, which is the whole point — three stacked
  // filter rows is a lot of chrome to push a phone's table below the fold.
  // Desktops keep arriving on the first category so the page has content on
  // load, and the level row is simply always shown there.
  //
  // An explicit `?mode=` beats both, which is what keeps Profile's "View all →"
  // link landing on the exact board it points at.
  const [mode, setMode] = useState(() => initialMode ?? (isNarrow() ? null : 'mc'))
  const [level, setLevel] = useState(initialLevel)
  const [game, setGame] = useState(initialGame)
  const [rows, setRows] = useState([])
  const [you, setYou] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  function change({ nextGame, nextMode, nextLevel }) {
    const g = nextGame ?? game
    const m = nextMode ?? mode
    const l = nextLevel ?? level
    // Global deliberately leaves `level` alone rather than clearing it. Clearing
    // it was never read anywhere — the fetch already scopes the level away for
    // global itself — and it left the state one-way: tapping Global and then a
    // real mode came back with `level === null`, so no chip looked selected and
    // the query quietly loaded the all-levels board instead.
    if (g !== game) setGame(g)
    if (m !== mode) setMode(m)
    if (l !== level) setLevel(l)
    setRows([])
    setYou(null)
    setLoading(true)
    setError(null)
  }

  useEffect(() => {
    let active = true
    if (!isSupabaseConfigured) return undefined
    // A phone with nothing selected yet has no board to ask for. Bailing here
    // also keeps `mode: null` from reaching the query, where it would read as
    // "global" and quietly load the wrong board.
    if (mode === null) return undefined
    const scopedMode = mode === 'global' ? null : mode
    const scopedLevel = mode === 'global' ? null : level
    fetchPlayerSnapshot({ game, mode: scopedMode, level: scopedLevel, userId: user?.id, top: 10 }).then((res) => {
      if (!active) return
      setRows(res.top ?? [])
      setYou(res.you ?? null)
      setError(res.error)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [game, mode, level, user?.id])

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="mt-4 text-slate-500">
          Leaderboard is unavailable until Supabase is configured.
        </p>
      </div>
    )
  }

  // `mode` is null on a phone until something is tapped, and the cards below
  // read `accent.strip` and `accent.glow` unconditionally — so this fallback is
  // what stops an unselected board from dereferencing an undefined accent.
  const accent = MODE_ACCENTS[mode] ?? MODE_ACCENTS.mc
  const activeMode = MODES.find((m) => m.key === mode)

  // A board is only ever built from finished quizzes, so a brand-new account has
  // no row in `scores` and is genuinely absent from every board. That is the
  // intended behaviour — but nothing said so, and the empty state below only
  // fires when the *whole* scope is empty, so with other players on the board a
  // new account saw a normal-looking leaderboard with no hint that they were
  // missing from it. `you === null` while signed in is exactly "no score in this
  // scope", and it is already on hand from fetchPlayerSnapshot, so this costs no
  // extra query.
  const notOnBoardYet = !!user && !you && !loading && !error && mode !== null
  // `easy` because isLevelUnlocked gates the quiz deep-link: linking to a locked
  // level would silently drop the player on the mode picker instead. It degrades
  // to that picker rather than dead-ending, but easy always starts.
  const playHref = mode && mode !== 'global' ? `/quiz/sql?mode=${mode}&level=easy` : '/quiz/sql'

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 text-center">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-gradient">
          Scoreboard · Ranked
        </div>
        <h1 className="mt-2 bg-gradient-to-r from-indigo-300 via-sky-300 to-fuchsia-300 bg-clip-text font-mono text-2xl font-black tracking-tight text-transparent sm:text-4xl">
          The Leaderboard
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {user ? `Signed in as ${user.email ?? 'you'}` : 'Sign in to save your scores.'}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent.strip} opacity-80`} />
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            {GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => change({ nextGame: g.id })}
                className={
                  'relative flex min-h-11 w-full items-center justify-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors sm:min-h-0 sm:w-auto sm:py-1 ' +
                  (game === g.id
                    ? 'pop-on bg-slate-700 text-white'
                    : 'bg-slate-800/70 text-slate-500 hover:bg-slate-700/70 hover:text-slate-300')
                }
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {MODES.map((m) => {
              const a = MODE_ACCENTS[m.key]
              const active = mode === m.key
              return (
                <button
                  key={m.key}
                  onClick={() => change({ nextMode: m.key })}
                  title={m.full}
                  className={
                    'group relative flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all sm:min-h-0 sm:w-auto sm:py-1.5 ' +
                    (active
                      ? `pop-on ${a.chip} ${a.glow}`
                      : 'border-slate-800 bg-slate-800/50 text-slate-500 hover:border-slate-700 hover:text-slate-300')
                  }
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-mono text-xs font-black ${active ? a.iconBox : 'border-slate-700 bg-slate-800/70 text-slate-400'}`}>
                    {m.icon}
                  </span>
                  {m.label}
                </button>
              )
            })}
          </div>

          {/* Renders only once a mode is chosen, which is what makes it the
              reveal. On a phone that happens on the first tap; on a desktop
              `mode` is never null, so the row is there from the first paint. */}
          {mode && mode !== 'global' && (
            <div className="reveal-levels mt-3">
              <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 sm:hidden">
                Level
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
                {LEVELS.map((lv) => {
                  const a = LEVEL_ACCENTS[lv.key]
                  const active = level === lv.key
                  return (
                    <button
                      key={lv.key}
                      onClick={() => change({ nextLevel: lv.key })}
                      className={
                        'relative flex min-h-11 w-full items-center justify-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-all sm:min-h-0 sm:w-auto sm:py-1 ' +
                        (active
                          ? `pop-on ${a.chip} ${a.glow}`
                          : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800 hover:text-slate-300')
                      }
                    >
                      {lv.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`relative mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-[0_0_24px_rgba(99,102,241,0.08)] ${accent.glow}`}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent.strip} opacity-80`} />
        {/* Checked before `loading`, because on a phone the initial state is
            "nothing chosen" while `loading` is still true from useState — and a
            spinner would imply a request that was deliberately never made. */}
        {mode === null ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/70 font-mono text-lg font-black text-slate-500">
              ?
            </div>
            <p className="mt-3 text-slate-400">
              Pick a mode above — Multiple Choice, Write the Query, Fix the Bug or Global — to load the board.
            </p>
          </div>
        ) : loading ? (
          <p className="p-8 text-center text-slate-500">Loading…</p>
        ) : error ? (
          <p className="p-8 text-center text-rose-400">{error.message}</p>
        ) : rows.length === 0 && !you ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/70 font-mono text-lg font-black text-slate-500">
              {activeMode?.icon}
            </div>
            <p className="mt-3 text-slate-400">
              {user
                ? 'Nobody has scored on this board yet. Finish a quiz and take the top spot!'
                : 'No scores yet for this board yet.'}
            </p>
            <Link
              to={playHref}
              className="mt-4 inline-block rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-400"
            >
              Play {activeMode?.full ?? 'a quiz'}
            </Link>
            {!user && (
              <p className="mt-3 text-xs text-slate-500">
                <Link to="/auth" className="text-indigo-300 underline-offset-2 hover:underline">
                  Sign in
                </Link>{' '}
                to save your score.
              </p>
            )}
          </div>
        ) : (
          <div>
            {/* Above the table, not instead of it — the common case is a board
                full of other players and just this one absent, which is
                precisely the case the old empty state could not express. */}
            {notOnBoardYet && (
              <div className="mx-4 mb-4 mt-4 flex flex-col gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 sm:mx-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-300">
                  You&apos;re signed in as{' '}
                  <span className="font-semibold text-white">{profile?.username ?? user.email ?? 'you'}</span>, but you
                  have no score on this board yet. Finish a quiz and you&apos;ll appear here.
                </p>
                <Link
                  to={playHref}
                  className="shrink-0 self-start rounded-lg bg-indigo-500 px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-400 sm:self-auto"
                >
                  Play {activeMode?.full ?? 'a quiz'}
                </Link>
              </div>
            )}
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/60">
                  <th className="px-2 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:px-4">#</th>
                  <th className="w-full px-2 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:px-4">Player</th>
                  <th className="px-2 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:px-4 sm:text-left">Score</th>
                  <th className="hidden px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:table-cell">Correct</th>
                  <th className="hidden px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:table-cell">Lives</th>
                  <th className="hidden px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:table-cell">Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <Row
                    key={row.id ?? `${row.createdAt}-${i}`}
                    rank={i + 1}
                    row={row}
                    isYou={!!(user?.id && row.user_id === user.id)}
                  />
                ))}
                {you && you.rank > rows.length ? (
                  <Row rank={you.rank} row={you} isYou pinned name={you.username || 'You'} />
                ) : null}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-slate-600">
        Ranked by score · then lives · then fastest time
      </p>
    </div>
  )
}