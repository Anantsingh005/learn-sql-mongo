import { supabase } from './supabase.js'

export async function saveAttempts(userId, { game = 'sql', mode, attempts }) {
  if (!supabase || !userId) return { error: null }
  if (!Array.isArray(attempts) || attempts.length === 0) return { error: null }
  const rows = attempts
    .filter((a) => a?.question?.id)
    .map((a) => ({
      user_id: userId,
      game,
      mode,
      difficulty: a.question.difficulty ?? 'easy',
      question_id: a.question.id,
      correct: Boolean(a.correct),
    }))
  if (rows.length === 0) return { error: null }
  try {
    const { error } = await supabase.from('question_attempts').insert(rows)
    if (error) return { error }
    return { error: null }
  } catch (err) {
    return { error: err }
  }
}

export async function fetchAttempts(userId, { game = 'sql', mode, difficulty }) {
  if (!supabase || !userId) return []
  try {
    let query = supabase
      .from('question_attempts')
      .select('question_id, correct, created_at')
      .eq('user_id', userId)
      .eq('game', game)
      .is('reset_at', null)
    if (mode) query = query.eq('mode', mode)
    if (difficulty) query = query.eq('difficulty', difficulty)
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  } catch (err) {
    console.error('fetchAttempts failed:', err)
    return []
  }
}

export default { saveAttempts, fetchAttempts }