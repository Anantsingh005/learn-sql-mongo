import { supabase } from './supabase.js'

const PROGRESS_KEY = 'dbquiz.progress'

export const COMPLETE_THRESHOLD = 75

export const MODES = ['mc', 'write', 'bug']

export function levelKey(mode, difficulty) {
  return `${mode}_${difficulty}`
}

function emptyGame() {
  return { completed: [], best: {} }
}

function emptyAll() {
  return { sql: emptyGame(), mongo: emptyGame() }
}

function normalize(data) {
  return {
    completed: Array.isArray(data?.completed) ? data.completed : [],
    best: data?.best && typeof data.best === 'object' ? data.best : {},
  }
}

function readAllLocal() {
  if (typeof window === 'undefined') return emptyAll()
  try {
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY))
    return { ...emptyAll(), ...(raw && typeof raw === 'object' ? raw : {}) }
  } catch {
    return emptyAll()
  }
}

function readLocal(game) {
  return normalize(readAllLocal()[game])
}

function writeLocal(game, data) {
  if (typeof window === 'undefined') return
  const all = readAllLocal()
  all[game] = data
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all))
}

function mergeResult(base, mode, difficulty, percent) {
  const completed = new Set(base.completed)
  const best = { ...base.best }
  const key = levelKey(mode, difficulty)
  if (percent >= COMPLETE_THRESHOLD) completed.add(key)
  best[key] = Math.max(best[key] ?? 0, Math.round(percent))
  return { completed: [...completed], best }
}

export async function getProgress(game, userId) {
  if (!supabase || !userId) return readLocal(game)
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select(game)
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    return normalize(data?.[game])
  } catch (err) {
    console.error('getProgress failed:', err)
    return readLocal(game)
  }
}

export async function recordLevelResult(game, difficulty, percent, userId, mode = 'mc') {
  if (!Number.isFinite(percent)) return null

  if (supabase && userId) {
    try {
      const current = await getProgress(game, userId)
      const nextGame = mergeResult(current, mode, difficulty, percent)
      const { error } = await supabase.from('user_progress').upsert(
        { user_id: userId, [game]: nextGame },
        { onConflict: 'user_id' }
      )
      if (error) throw error
      return nextGame
    } catch (err) {
      console.error('recordLevelResult failed:', err)
    }
  }

  const local = readLocal(game)
  const nextGame = mergeResult(local, mode, difficulty, percent)
  writeLocal(game, nextGame)
  return nextGame
}

export function isLevelUnlocked(difficulty, progress, mode = 'mc') {
  const completed = progress?.completed ?? []
  if (difficulty === 'all') {
    return ['easy', 'medium', 'hard'].every((lv) => completed.includes(levelKey(mode, lv)))
  }
  if (difficulty !== 'hard') return true
  return completed.includes(levelKey(mode, 'easy')) && completed.includes(levelKey(mode, 'medium'))
}

export default {
  COMPLETE_THRESHOLD,
  getProgress,
  recordLevelResult,
  isLevelUnlocked,
}