import { supabase } from './supabase.js'

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0
  return seconds
}

export async function fetchUserScores(userId) {
  if (!supabase || !userId) return { rows: [], stats: null }
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('id, game, score, time_seconds, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error

    const rows = data ?? []
    let totalTime = 0
    let best = null
    let sumScore = 0
    const byGame = { sql: 0, mongo: 0 }

    for (const row of rows) {
      totalTime += formatTime(row.time_seconds)
      sumScore += row.score
      if (best === null || row.score > best.score) best = row
      if (row.game === 'sql' || row.game === 'mongo') byGame[row.game] += 1
    }

    return {
      rows,
      stats: {
        sessions: rows.length,
        totalSeconds: totalTime,
        averageScore: rows.length ? Math.round(sumScore / rows.length) : null,
        best,
        byGame,
      },
    }
  } catch (err) {
    return { rows: [], stats: null, error: err }
  }
}

export default { fetchUserScores }