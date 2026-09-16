import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchTopScores } from '../lib/scores.js'
import { isSupabaseConfigured } from '../lib/supabase.js'

const GAMES = [
  { id: 'sql', label: 'SQL' },
  { id: 'mongo', label: 'Mongo' },
]

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function getUserName(row) {
  const p = row.profiles
  if (!p) return 'Anonymous'
  if (Array.isArray(p)) return p[0]?.username || 'Anonymous'
  return p.username || 'Anonymous'
}

export default function Leaderboard() {
  const { user } = useAuth()
  const [game, setGame] = useState('sql')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  function selectGame(id) {
    setGame(id)
    setRows([])
    setLoading(true)
    setError(null)
  }

  useEffect(() => {
    let active = true
    if (!isSupabaseConfigured) {
      return undefined
    }
    fetchTopScores(game, 10).then(({ data, error: err }) => {
      if (!active) return
      setRows(data ?? [])
      setError(err)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [game])

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="mt-4 text-stone-500">
          Leaderboard is unavailable until Supabase is configured.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">Leaderboard</h1>
      <div className="mt-4 flex gap-2">
        {GAMES.map((g) => (
          <button
            key={g.id}
            onClick={() => selectGame(g.id)}
            className={
              'rounded px-3 py-1 text-sm font-medium ' +
              (game === g.id
                ? 'bg-indigo-600 text-white'
                : 'bg-stone-200 text-stone-700 hover:bg-stone-300')
            }
          >
            {g.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-stone-400">
        {user ? `Signed in as ${user.email ?? 'you'}` : 'Sign in to save your scores.'}
      </p>
      <div className="mt-6 overflow-hidden rounded-lg border border-stone-200">
        {loading ? (
          <p className="p-6 text-center text-stone-500">Loading…</p>
        ) : error ? (
          <p className="p-6 text-center text-rose-600">{error.message}</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-center text-stone-500">
            No scores yet. Finish a quiz to see it here!
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Player</th>
                <th className="px-4 py-2 font-medium">Score</th>
                <th className="px-4 py-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id ?? `${row.created_at}-${i}`} className="border-t border-stone-100">
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2">{getUserName(row)}</td>
                  <td className="px-4 py-2">{row.score}</td>
                  <td className="px-4 py-2">{formatTime(row.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
