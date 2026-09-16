const EPSILON = 1e-6

function valuesEqual(a, b, epsilon = EPSILON) {
  if (a === b) return true
  if (a === null || a === undefined) return b === null || b === undefined
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= epsilon
  return String(a) === String(b)
}

function isPermutation(a, b) {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((c, i) => c === sortedB[i])
}

function alignColumns(actual, expected) {
  if (isPermutation(actual.columns, expected.columns)) {
    const indexByColumn = new Map(expected.columns.map((c, i) => [c, i]))
    const order = actual.columns.map((c) => indexByColumn.get(c))
    const rows = actual.rows.map((row) => order.map((i) => row[i]))
    return { columns: expected.columns, rows }
  }
  return actual
}

function rowsEqual(actual, expected, epsilon) {
  if (actual.length !== expected.length) return false
  return actual.every((row, i) =>
    expected[i].length === row.length && expected[i].every((v, j) => valuesEqual(v, row[j], epsilon)),
  )
}

export function checkAnswer(actual, expected, options = {}) {
  const {
    orderMatters = false,
    ignoreColumnOrder = false,
    numericTolerance = EPSILON,
  } = options

  if (!actual || !actual.columns || !actual.rows) {
    return { correct: false, reason: 'No query result to compare.' }
  }

  const aligned = ignoreColumnOrder ? alignColumns(actual, expected) : actual

  if (aligned.columns.length !== expected.columns.length) {
    return {
      correct: false,
      reason: `Column count mismatch: got ${aligned.columns.length}, expected ${expected.columns.length}.`,
    }
  }

  if (aligned.rows.length !== expected.rows.length) {
    return {
      correct: false,
      reason: `Row count mismatch: got ${aligned.rows.length}, expected ${expected.rows.length}.`,
    }
  }

  const actualRows = aligned.rows.map((r) => r.map((v) => (typeof v === 'number' ? v : v ?? null)))
  const expectedRows = expected.rows.map((r) => r.map((v) => (typeof v === 'number' ? v : v ?? null)))

  if (!orderMatters) {
    const remaining = expectedRows.map((row) => ({ row, used: false }))
    for (const actualRow of actualRows) {
      const match = remaining.find(
        (r) => !r.used && rowsEqual([actualRow], [r.row], numericTolerance),
      )
      if (!match) {
        return {
          correct: false,
          reason: `Unexpected row: [${actualRow.join(', ')}].`,
        }
      }
      match.used = true
    }
    return { correct: true }
  }

  if (!rowsEqual(actualRows, expectedRows, numericTolerance)) {
    return {
      correct: false,
      reason: 'Rows do not match in the expected order.',
    }
  }
  return { correct: true }
}

export function checkMultipleChoice(question, selectedIndex) {
  return {
    correct: selectedIndex === question.answerIndex,
    selectedIndex,
    correctIndex: question.answerIndex,
  }
}

export default checkAnswer