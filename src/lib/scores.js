import { supabase } from './supabase.js'

export async function saveScore({ game, score, time, userId }) {
  if (!supabase || !userId) return { error: new Error('Not signed in or Supabase not configured.') }
  return supabase.from('quiz_scores').insert({
    user_id: userId,
    game,
    score,
    time,
  })
}

export async function fetchTopScores(game = 'sql', limit = 10) {
  if (!supabase) return { data: [], error: null }
  return supabase
    .from('quiz_scores')
    .select('score, time, created_at, profiles (username)')
    .eq('game', game)
    .order('score', { ascending: false })
    .order('time', { ascending: true })
    .limit(limit)
}

export default { saveScore, fetchTopScores }