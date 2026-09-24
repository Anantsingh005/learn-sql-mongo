import { supabase } from './supabase.js'

export async function saveScore({ game, score, time, userId, username }) {
  if (!supabase) return { error: new Error('Supabase is not configured.') }
  if (!userId) return { error: new Error('Not signed in.') }
  try {
    const { error } = await supabase.from('scores').insert({
      user_id: userId,
      username: (username || 'Anonymous').slice(0, 24),
      game,
      score,
      time_seconds: time,
    })
    return { error: error ?? null }
  } catch (err) {
    return { error: err }
  }
}

export async function fetchTopScores(game = 'sql', top = 10) {
  if (!supabase) return { data: [], error: null }
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('id, user_id, game, score, time_seconds, username, created_at')
      .eq('game', game)
      .order('score', { ascending: false })
      .order('time_seconds', { ascending: true })
      .limit(top)
    if (error) throw error
    return { data: data ?? [], error: null }
  } catch (err) {
    return { data: [], error: err }
  }
}

export async function fetchPlayerSnapshot(game = 'sql', userId, top = 10) {
  if (!supabase) return { top: [], you: null, error: null }
  try {
    const [{ data: topRows }, bestRes] = await Promise.all([
      fetchTopScores(game, top),
      userId
        ? supabase
            .from('scores')
            .select('score, time_seconds, username')
            .eq('game', game)
            .eq('user_id', userId)
            .order('score', { ascending: false })
            .order('time_seconds', { ascending: true })
            .limit(1)
        : Promise.resolve({ data: [], error: null }),
    ])
    if (bestRes.error) throw bestRes.error

    let you = null
    const best = bestRes?.data?.[0]
    if (best && userId) {
      const { count, error } = await supabase
        .from('scores')
        .select('id', { count: 'exact', head: true })
        .eq('game', game)
        .or(`score.gt.${best.score},and(score.eq.${best.score},time_seconds.lt.${best.time_seconds})`)
      if (error) throw error
      you = { rank: (count ?? 0) + 1, score: best.score, time_seconds: best.time_seconds, username: best.username }
    }
    return { top: topRows ?? [], you, error: null }
  } catch (err) {
    return { top: [], you: null, error: err }
  }
}

export default { saveScore, fetchTopScores, fetchPlayerSnapshot }