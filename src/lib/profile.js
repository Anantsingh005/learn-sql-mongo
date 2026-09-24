import { supabase } from './supabase.js'

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0
  return seconds
}

function rowPercent(row) {
  if (!row?.total_questions) return null
  return Math.round((row.correct_count / row.total_questions) * 100)
}

export async function fetchUserScores(userId) {
  if (!supabase || !userId) return { rows: [], stats: null }
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('id, game, mode, level, score, time_seconds, created_at, correct_count, total_questions, lives_left')
      .eq('user_id', userId)
      .is('reset_at', null)
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error

    const rows = data ?? []
    let totalTime = 0
    let best = null
    let sumPct = 0
    let countPct = 0
    const byGame = { sql: 0, mongo: 0 }

    for (const row of rows) {
      totalTime += formatTime(row.time_seconds)
      const pct = rowPercent(row)
      if (pct !== null) {
        sumPct += pct
        countPct += 1
        if (best === null || pct > rowPercent(best)) best = row
      }
      if (row.game === 'sql' || row.game === 'mongo') byGame[row.game] += 1
    }

    return {
      rows,
      stats: {
        sessions: rows.length,
        totalSeconds: totalTime,
        averageScore: countPct ? Math.round(sumPct / countPct) : null,
        best,
        byGame,
      },
    }
  } catch (err) {
    return { rows: [], stats: null, error: err }
  }
}

export async function resetUserProgress(includeScores) {
  if (!supabase) return { error: { message: 'Supabase not available' } }
  try {
    const { data, error } = await supabase.rpc('reset_user_progress', {
      p_include_scores: Boolean(includeScores),
    })
    if (error) return { error }
    return { data, error: null }
  } catch (err) {
    return { error: err }
  }
}

export default { fetchUserScores, resetUserProgress }