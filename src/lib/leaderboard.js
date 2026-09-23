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
      .select('id, game, score, time_seconds, username, created_at')
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

export default { saveScore, fetchTopScores }