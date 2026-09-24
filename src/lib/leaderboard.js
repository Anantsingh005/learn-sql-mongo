import { supabase } from './supabase.js'

const MODES = new Set(['mc', 'write', 'bug'])
const LEVELS = new Set(['easy', 'medium', 'hard', 'all'])

function scope(query, { game, mode, level }) {
  let q = query.eq('game', game)
  if (mode && MODES.has(mode)) q = q.eq('mode', mode)
  if (level && LEVELS.has(level)) q = q.eq('level', level)
  return q
}

export async function saveScore({ game, mode, level, score, time, correctCount = 0, totalQuestions = 0, livesLeft = 0, userId, username }) {
  if (!supabase) return { error: new Error('Supabase is not configured.') }
  if (!userId) return { error: new Error('Not signed in.') }
  try {
    const { error } = await supabase.from('scores').insert({
      user_id: userId,
      username: (username || 'Anonymous').slice(0, 24),
      game,
      mode,
      level,
      score,
      time_seconds: time,
      correct_count: correctCount,
      total_questions: totalQuestions,
      lives_left: livesLeft,
    })
    return { error: error ?? null }
  } catch (err) {
    return { error: err }
  }
}

export async function fetchTopScores({ game = 'sql', mode = null, level = null, top = 10 } = {}) {
  if (!supabase) return { data: [], error: null }
  try {
    let query = supabase
      .from('scores')
      .select('id, user_id, game, mode, level, score, time_seconds, username, created_at, correct_count, total_questions, lives_left')
      .order('score', { ascending: false })
      .order('lives_left', { ascending: false })
      .order('time_seconds', { ascending: true })
      .limit(top)
    query = scope(query, { game, mode, level })
    const { data, error } = await query
    if (error) throw error
    return { data: data ?? [], error: null }
  } catch (err) {
    return { data: [], error: err }
  }
}

export async function fetchPlayerSnapshot({ game = 'sql', mode = null, level = null, userId, top = 10 } = {}) {
  if (!supabase) return { top: [], you: null, error: null }
  try {
    const [{ data: topRows }, bestRes] = await Promise.all([
      fetchTopScores({ game, mode, level, top }),
      userId
        ? scope(
            supabase
              .from('scores')
              .select('score, time_seconds, lives_left, correct_count, total_questions, username, mode, level')
              .eq('user_id', userId)
              .order('score', { ascending: false })
              .order('lives_left', { ascending: false })
              .order('time_seconds', { ascending: true })
              .limit(1),
            { game, mode, level },
          )
        : Promise.resolve({ data: [], error: null }),
    ])
    if (bestRes.error) throw bestRes.error

    let you = null
    const best = bestRes?.data?.[0]
    if (best && userId) {
      let q = supabase
        .from('scores')
        .select('id', { count: 'exact', head: true })
        .or(
          `score.gt.${best.score},and(score.eq.${best.score},lives_left.gt.${best.lives_left}),and(score.eq.${best.score},lives_left.eq.${best.lives_left},time_seconds.lt.${best.time_seconds})`,
        )
      q = scope(q, { game, mode, level })
      const { count, error } = await q
      if (error) throw error
      you = {
        rank: (count ?? 0) + 1,
        score: best.score,
        time_seconds: best.time_seconds,
        lives_left: best.lives_left,
        correct_count: best.correct_count,
        total_questions: best.total_questions,
        username: best.username,
        mode: best.mode,
        level: best.level,
      }
    }
    return { top: topRows ?? [], you, error: null }
  } catch (err) {
    return { top: [], you: null, error: err }
  }
}

export default { saveScore, fetchTopScores, fetchPlayerSnapshot }