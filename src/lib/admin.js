import { supabase } from './supabase.js'
import { fetchTopScores } from './leaderboard.js'
import { allSqlQuestions } from '../data/sql/index.js'

export const TABLE_META = {
  profiles: {
    table: 'profiles',
    label: 'Profiles',
    rowKey: 'id',
    order: 'created_at',
    dir: 'asc',
    canInsert: false,
    columns: [
      { key: 'id', label: 'ID', type: 'uuid', editable: false },
      { key: 'username', label: 'Username', type: 'text', editable: true },
      { key: 'name', label: 'Name', type: 'text', editable: true },
      { key: 'created_at', label: 'Created', type: 'datetime', editable: false },
      { key: 'updated_at', label: 'Updated', type: 'datetime', editable: false },
    ],
  },
  scores: {
    table: 'scores',
    label: 'Scores',
    rowKey: 'id',
    order: 'score',
    dir: 'desc',
    canInsert: true,
    columns: [
      { key: 'id', label: 'ID', type: 'number', editable: false },
      { key: 'user_id', label: 'User ID', type: 'uuid', editable: true },
      { key: 'game', label: 'Game', type: 'text', editable: true },
      { key: 'score', label: 'Score', type: 'number', editable: true },
      { key: 'time_seconds', label: 'Time (s)', type: 'number', editable: true },
      { key: 'username', label: 'Username', type: 'text', editable: true },
      { key: 'created_at', label: 'Created', type: 'datetime', editable: false },
    ],
  },
  user_progress: {
    table: 'user_progress',
    label: 'User Progress',
    rowKey: 'user_id',
    order: 'updated_at',
    dir: 'desc',
    canInsert: false,
    columns: [
      { key: 'user_id', label: 'User ID', type: 'uuid', editable: false },
      { key: 'sql', label: 'SQL', type: 'json', editable: true },
      { key: 'mongo', label: 'Mongo', type: 'json', editable: true },
      { key: 'updated_at', label: 'Updated', type: 'datetime', editable: false },
    ],
  },
  admins: {
    table: 'admins',
    label: 'Admins',
    rowKey: 'user_id',
    order: 'created_at',
    dir: 'desc',
    canInsert: true,
    columns: [
      { key: 'user_id', label: 'User ID', type: 'uuid', editable: true },
      { key: 'created_at', label: 'Added', type: 'datetime', editable: false },
    ],
  },
}

export async function fetchIsAdmin() {
  if (!supabase) return false
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('user_id')
      .limit(1)
      .maybeSingle()
    return !error && Boolean(data?.user_id)
  } catch {
    return false
  }
}

export async function fetchTableRows(tableMeta) {
  if (!supabase) return { data: [], error: null }
  try {
    const { data, error } = await supabase
      .from(tableMeta.table)
      .select('*')
      .order(tableMeta.order, { ascending: tableMeta.dir === 'asc' })
    return { data: data ?? [], error }
  } catch (err) {
    return { data: [], error: err }
  }
}

export async function createRow(table, values) {
  if (!supabase) return { error: new Error('Supabase is not configured.') }
  try {
    const { data, error } = await supabase.from(table).insert(values).select().single()
    return { data, error }
  } catch (err) {
    return { error: err }
  }
}

export async function updateRow(table, match, patch) {
  if (!supabase) return { error: new Error('Supabase is not configured.') }
  try {
    const { data, error } = await supabase.from(table).update(patch).match(match).select().single()
    return { data, error }
  } catch (err) {
    return { error: err }
  }
}

export async function deleteRow(table, match) {
  if (!supabase) return { error: new Error('Supabase is not configured.') }
  try {
    const { error } = await supabase.from(table).delete().match(match)
    return { error }
  } catch (err) {
    return { error: err }
  }
}

export async function fetchStats() {
  const empty = {
    profiles: 0,
    scores: 0,
    avgScore: null,
    totalSeconds: 0,
    completed: 0,
    admins: 0,
    byGame: { sql: 0, mongo: 0 },
    top: [],
  }
  if (!supabase) return empty
  try {
    const [pc, sc, avgRes, sumRes, gamesRes, progRes, acRes, topRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('scores').select('*', { count: 'exact', head: true }),
      supabase.from('scores').select('avg(score)').maybeSingle(),
      supabase.from('scores').select('sum(time_seconds)').maybeSingle(),
      supabase.from('scores').select('game, count()'),
      supabase.from('user_progress').select('sql, mongo'),
      supabase.from('admins').select('*', { count: 'exact', head: true }),
      fetchTopScores('sql', 5),
    ])
    const byGame = { sql: 0, mongo: 0 }
    const gamesData = gamesRes.data ?? []
    gamesData.forEach((row) => {
      if (row.game === 'sql' || row.game === 'mongo') byGame[row.game] = Number(row.count) || 0
    })
    let completed = 0
    const rows = progRes.data ?? []
    for (const row of rows) {
      completed += (row.sql?.completed ?? []).length + (row.mongo?.completed ?? []).length
    }
    return {
      profiles: pc.count ?? 0,
      scores: sc.count ?? 0,
      avgScore: Number(avgRes.data?.avg ?? 0) || null,
      totalSeconds: Number(sumRes.data?.sum ?? 0) || 0,
      completed,
      admins: acRes.count ?? 0,
      byGame,
      top: topRes.data ?? [],
    }
  } catch {
    return empty
  }
}

export function questionAnalytics() {
  const total = allSqlQuestions.length
  const byType = {}
  const byDiff = { easy: 0, medium: 0, hard: 0 }
  const matrix = {}
  const topics = {}
  const schemaRefs = {}
  const dupIds = []
  const issues = []
  const seen = new Set()

  for (const q of allSqlQuestions) {
    byType[q.type] = (byType[q.type] ?? 0) + 1
    if (byDiff[q.difficulty] === undefined) byDiff[q.difficulty] = 0
    byDiff[q.difficulty] += 1
    const cell = `${q.type}/${q.difficulty}`
    matrix[cell] = (matrix[cell] ?? 0) + 1
    if (q.topic) topics[q.topic] = (topics[q.topic] ?? 0) + 1
    const ref = typeof q.schema === 'string' ? q.schema : 'inline'
    schemaRefs[ref] = (schemaRefs[ref] ?? 0) + 1

    if (seen.has(q.id)) dupIds.push(q.id)
    seen.add(q.id)

    if (!q.id) issues.push('question missing id')
    if (!q.question) issues.push(`${q.id ?? '(no id)'} missing question text`)
    if (!q.difficulty) issues.push(`${q.id ?? '(no id)'} missing difficulty`)
    if (q.type === 'mc') {
      if (!Array.isArray(q.options) || q.options.length < 2) issues.push(`${q.id} has fewer than 2 options`)
      const n = q.options?.length ?? 0
      if (typeof q.answerIndex !== 'number' || q.answerIndex < 0 || q.answerIndex >= n) {
        issues.push(`${q.id} has invalid answerIndex`)
      }
    }
    if (q.type === 'write' || q.type === 'bug') {
      if (!q.expected) issues.push(`${q.id} missing expected output`)
      if (q.type === 'bug' && !q.fixedQuery) issues.push(`${q.id} missing fixedQuery`)
    }
  }

  return { total, byType, byDiff, matrix, topics, schemaRefs, dupIds, issues }
}

export default {
  TABLE_META,
  fetchIsAdmin,
  fetchTableRows,
  createRow,
  updateRow,
  deleteRow,
  fetchStats,
  questionAnalytics,
}