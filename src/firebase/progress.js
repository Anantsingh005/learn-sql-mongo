import { doc, getDoc, setDoc } from 'firebase/firestore'
import { firestore } from './client.js'

const PROGRESS_KEY = 'dbquiz.progress'

export const COMPLETE_THRESHOLD = 75

export const MODES = ['mc', 'write', 'bug']

export function levelKey(mode, difficulty) {
  return `${mode}_${difficulty}`
}

function emptyAll() {
  return { sql: {}, mongo: {} }
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

export async function getProgress(game, userId) {
  if (!firestore || !userId) return readLocal(game)
  try {
    const ref = doc(firestore, 'user_progress', userId)
    const snap = await getDoc(ref)
    const data = snap.exists() ? (snap.data()?.[game] ?? {}) : {}
    return normalize(data)
  } catch (err) {
    console.error('getProgress failed:', err)
    return readLocal(game)
  }
}

export async function recordLevelResult(game, difficulty, percent, userId, mode = 'mc') {
  if (!Number.isFinite(percent)) return null

  if (firestore && userId) {
    try {
      const ref = doc(firestore, 'user_progress', userId)
      const snap = await getDoc(ref)
      const prev = snap.exists() ? snap.data() : { userId }
      const gamePrev = prev[game] ?? {}
      const completed = new Set(gamePrev.completed ?? [])
      const best = { ...(gamePrev.best ?? {}) }
      const key = levelKey(mode, difficulty)
      if (percent >= COMPLETE_THRESHOLD) completed.add(key)
      best[key] = Math.max(best[key] ?? 0, Math.round(percent))
      const nextGame = { completed: [...completed], best }
      const next = { ...prev, userId, [game]: nextGame }
      await setDoc(ref, next, { merge: true })
      return normalize(nextGame)
    } catch (err) {
      console.error('recordLevelResult failed:', err)
    }
  }

  const local = readLocal(game)
  const completed = new Set(local.completed)
  const best = { ...local.best }
  const key = levelKey(mode, difficulty)
  if (percent >= COMPLETE_THRESHOLD) completed.add(key)
  best[key] = Math.max(best[key] ?? 0, Math.round(percent))
  const data = { completed: [...completed], best }
  writeLocal(game, data)
  return data
}

export function isLevelUnlocked(difficulty, progress, mode = 'mc') {
  if (difficulty !== 'hard') return true
  const completed = progress?.completed ?? []
  return completed.includes(levelKey(mode, 'easy')) && completed.includes(levelKey(mode, 'medium'))
}

export default {
  COMPLETE_THRESHOLD,
  getProgress,
  recordLevelResult,
  isLevelUnlocked,
}