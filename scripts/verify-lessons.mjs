/**
 * Verifies every example in the Academy book.
 *
 * Any `code` block that declares an `expect` is executed against the real
 * academySchema in sql.js and its rows are compared to what the book claims.
 * `expectError: true` blocks must actually fail. Blocks with neither are prose
 * illustrations and are only checked for being parseable.
 *
 *   node scripts/verify-lessons.mjs
 */
import initSqlJs from 'sql.js'
import { CHAPTERS } from '../src/data/academy/book.js'
import { academySchema } from '../src/data/academy/bookSchema.js'
import {
  questionsForSection,
  sectionsWithoutQuestions,
} from '../src/data/academy/questions/index.js'

const sql = await initSqlJs()

function buildSchema(db, schema) {
  for (const [table, def] of Object.entries(schema)) {
    const cols = def.columns.map((c) => `"${c}"`).join(', ')
    // Every table in the shop has a single-column `id` key, so give it a real
    // primary key. Chapter 7's foreign key needs a unique parent column to
    // point at, and `INTEGER PRIMARY KEY` also makes `last_insert_rowid()` work.
    const pk = def.columns.includes('id') ? ', PRIMARY KEY (id)' : ''
    db.run(`CREATE TABLE "${table}" (${cols}${pk}${def.constraints ? `, ${def.constraints}` : ''});`)
    for (const row of def.rows) {
      const values = row
        .map((v) => {
          if (v === null || v === undefined) return 'NULL'
          if (typeof v === 'number') return String(v)
          return `'${String(v).replace(/'/g, "''")}'`
        })
        .join(', ')
      db.run(`INSERT INTO "${table}" VALUES (${values});`)
    }
  }
}

function sameCell(a, b) {
  if (a === null || a === undefined) return b === null || b === undefined
  if (b === null || b === undefined) return false
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-6
  return String(a) === String(b)
}

function sameRows(actual, expected) {
  if (actual.length !== expected.length) return false
  return actual.every((row, i) => row.every((cell, j) => sameCell(cell, expected[i]?.[j])))
}

function fmt(value) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return String(Math.round(value * 1e6) / 1e6)
  return JSON.stringify(value)
}

/**
 * Every block gets its own database, so a statement that writes rows (Ch 7) can
 * never leak into the next example. `PRAGMA foreign_keys` is off by default in
 * SQLite, and Chapter 7 teaches real constraint violations, so switch it on.
 */
function freshDb() {
  const db = new sql.Database()
  db.run('PRAGMA foreign_keys = ON;')
  buildSchema(db, academySchema)
  return db
}

/** First result set of a statement, or empty columns/rows when there is none. */
function firstResult(res) {
  if (!res.length) return { columns: [], rows: [] }
  return { columns: res[0].columns, rows: res[0].values }
}

function run(block) {
  const db = freshDb()
  try {
    return firstResult(db.exec(block.code))
  } finally {
    db.close()
  }
}

/**
 * A `dml` block changes the database instead of returning rows, so it carries an
 * `after.query` whose result must match `after.columns` / `after.rows` — that is
 * the visible proof the statement did what the prose claims.
 */
function runDml(block) {
  const db = freshDb()
  try {
    db.exec(block.code)
    return firstResult(db.exec(block.after.query))
  } finally {
    db.close()
  }
}

let checks = 0
let failures = 0

function fail(where, message) {
  failures++
  console.log(`FAIL ${where}\n     ${message}`)
}

/**
 * Compare what the database returned against what the page promises. Returns
 * true when they match, having already reported any mismatch.
 */
function matchesExpectation(where, actual, expect, label) {
  if (!sameRows(actual.rows, expect.rows)) {
    fail(
      where,
      `${label} does not match the book.\n     book:   ${JSON.stringify(expect.rows)}` +
        `\n     actual: ${JSON.stringify(actual.rows)}`,
    )
    return false
  }

  if (expect.rows.length === 0) return true

  const colsOk =
    expect.columns.length === actual.columns.length &&
    expect.columns.every((c, j) => c === actual.columns[j])
  if (!colsOk) {
    fail(
      where,
      `${label} column names do not match.\n     book:   ${JSON.stringify(expect.columns)}` +
        `\n     actual: ${JSON.stringify(actual.columns)}`,
    )
    return false
  }

  return true
}

for (const chapter of CHAPTERS) {
  console.log(`\n=== Ch ${chapter.number} · ${chapter.title} (${chapter.slug})`)

  for (const section of chapter.sections) {
    for (const [i, block] of section.blocks.entries()) {
      if (block.type !== 'code' && block.type !== 'dml') continue
      const where = `${chapter.slug} / ${section.number} / block ${i + 1}`
      const isDml = block.type === 'dml'
      const expect = isDml ? block.after : block.expect
      const shown = expect?.query ?? block.code

      let actual
      try {
        actual = isDml ? runDml(block) : run(block)
      } catch (e) {
        if (block.expectError) {
          checks++
          console.log(`ok   ${where} — fails as documented (${e.message.split('\n')[0]})`)
        } else {
          fail(where, `query threw: ${e.message}\n     ${shown}`)
        }
        continue
      }

      if (block.expectError) {
        fail(where, `expected this to fail but it ran fine:\n     ${shown}`)
        continue
      }

      if (!expect) {
        checks++
        console.log(`ok   ${where} — runs (no documented result)`)
        continue
      }

      checks++
      const label = expect.label ?? (isDml ? 'table afterwards' : 'result')
      if (!matchesExpectation(where, actual, expect, label)) continue

      console.log(
        `ok   ${where} — ${label}: ${actual.rows.length} ${actual.rows.length === 1 ? 'row' : 'rows'}` +
          (actual.rows.length ? ` [${fmt(actual.rows[0][0])}, …]` : ''),
      )
    }
  }
}

// The flow diagrams and standalone result blocks quote numbers the reader can
// count. Check the row counts so a table cannot silently drift from its caption.
// A `visual` with an unrecognised name would render nothing at all, and a `dml`
// block with no `after` state would assert nothing — both are silent failures,
// so they are treated as errors here.
const VISUALS = new Set(['clause-order', 'join-types'])
let counts = 0
for (const chapter of CHAPTERS) {
  for (const section of chapter.sections) {
    for (const [i, block] of section.blocks.entries()) {
      const where = `${chapter.slug} / ${section.number} / block ${i + 1}`
      if (block.type === 'flow') {
        for (const [j, step] of block.steps.entries()) {
          counts++
          const wide = step.columns.length !== step.rows[0]?.length
          if (wide) {
            fail(
              `${where} / flow ${j + 1}`,
              `row width does not match the column list (${step.columns.length} vs ${step.rows[0]?.length})`,
            )
          }
        }
      }
      if (block.type === 'result') {
        counts++
        if (block.columns.length !== block.rows[0]?.length) {
          fail(
            where,
            `row width does not match the column list (${block.columns.length} vs ${block.rows[0]?.length})`,
          )
        }
      }
      if (block.type === 'visual' && !VISUALS.has(block.name)) {
        fail(where, `unknown visual "${block.name}" — it would render nothing`)
      }
      if (block.type === 'dml' && !block.expectError && !block.after) {
        fail(where, 'dml block has no after-state, so it asserts nothing')
      }
    }
  }
}

const totalSections = CHAPTERS.reduce((n, c) => n + c.sections.length, 0)
console.log(
  `\n${checks} queries checked · ${counts} tables shape-checked · ${totalSections} sections across ${CHAPTERS.length} chapters`,
)
console.log(failures === 0 ? 'ALL LESSON EXAMPLES VERIFIED' : `${failures} FAILURES`)

// ---------------------------------------------------------------------------
// Section quizzes
//
// The book's prose is checked above; this checks the questions that sit at the
// end of each section. A question with a `check` is asking "which of these
// queries returns this?", so the answer key is only correct if the right query
// really does return those rows against academySchema. Everything else is
// structure: a bad `answerIndex` renders a quiz nobody can pass.
//
// A question may also carry `distractorIndices`: the options that exist only to
// be wrong, and which the database must therefore refuse. The `check` can only
// ever run the *correct* option, so without this a "exactly one of these four
// runs" question can quietly have a second option that runs too — which is
// precisely the bug that shipped in q3.5.2, where the explanation claimed a
// distractor worked and it was actually a syntax error. Naming the indices makes
// the claim machine-checked instead of a promise in prose.
// ---------------------------------------------------------------------------

console.log('\n=== Section quizzes')

const MIN_PER_SECTION = 1
const MAX_PER_SECTION = 5
const seenIds = new Set()
let qChecks = 0
let dChecks = 0
let coveredSections = 0

/**
 * Pull the statement out of a quiz option.
 *
 * Options are written the way the reader sees them, in two styles: the bare
 * statement on its own, or the statement in backticks with a clause of prose
 * after it saying why it is wrong. A backticked span wins when there is one;
 * otherwise the whole option is used, but only if it actually looks like a
 * statement, so a prose option is never handed to the database as SQL.
 */
const STATEMENT = /^\s*(SELECT|INSERT|UPDATE|DELETE|WITH|PRAGMA)\b/i

function optionSql(option) {
  const m = option.match(/`([^`]+)`/)
  if (m) return m[1]
  return STATEMENT.test(option) ? option : null
}

for (const chapter of CHAPTERS) {
  for (const section of chapter.sections) {
    const where = `${chapter.number}.${section.number.split('.')[1]} ${section.id}`
    const questions = questionsForSection(chapter.slug, section.id)

    if (questions.length === 0) continue
    coveredSections++

    if (questions.length < MIN_PER_SECTION || questions.length > MAX_PER_SECTION) {
      fail(where, `${questions.length} questions — expected ${MIN_PER_SECTION} to ${MAX_PER_SECTION}`)
      continue
    }

    for (const q of questions) {
      const at = `${where} / ${q.id}`

      if (seenIds.has(q.id)) {
        fail(at, 'duplicate question id — ids must be unique across the whole book')
        continue
      }
      seenIds.add(q.id)

      if (!Array.isArray(q.options) || q.options.length < 3) {
        fail(at, 'needs at least 3 options')
        continue
      }
      if (new Set(q.options).size !== q.options.length) {
        fail(at, 'has duplicate options, so more than one is trivially right')
        continue
      }
      if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= q.options.length) {
        fail(at, `answerIndex ${q.answerIndex} is out of range for ${q.options.length} options`)
        continue
      }
      if (!q.prompt) {
        fail(at, 'has no prompt')
        continue
      }
      if (!q.explanation) {
        fail(at, 'has no explanation — a quiz that never says why is not teaching')
        continue
      }

      // The `check` is what makes the answer key trustworthy.
      if (q.check) {
        let actual
        try {
          actual = run({ code: q.check.code })
        } catch (e) {
          fail(at, `check query threw: ${e.message.split('\n')[0]}\n     ${q.check.code}`)
          continue
        }
        qChecks++
        if (!matchesExpectation(at, actual, q.check, 'check rows')) continue
      }

      // A `check` only ever runs the correct option, so it cannot tell a
      // genuinely-wrong distractor from one that also happens to run. Naming
      // the options that must be refused closes that gap.
      if (q.distractorIndices) {
        if (!Array.isArray(q.distractorIndices)) {
          fail(at, 'distractorIndices must be an array of option indices')
          continue
        }
        for (const i of q.distractorIndices) {
          if (!Number.isInteger(i) || i < 0 || i >= q.options.length) {
            fail(at, `distractorIndices has ${i}, out of range for ${q.options.length} options`)
            continue
          }
          if (i === q.answerIndex) {
            fail(at, `distractorIndices includes ${i}, which is the answer — that is a contradiction`)
            continue
          }

          const sql = optionSql(q.options[i])
          if (!sql) {
            fail(at, `distractor ${i} has no backticked SQL to run`)
            continue
          }

          try {
            run({ code: sql })
            fail(
              at,
              `distractor ${i} was supposed to be refused, but it ran fine:\n     ${sql}\n` +
                '     Either the explanation is wrong, or it should not be listed here.',
            )
          } catch {
            dChecks++
          }
        }
      }

      console.log(
        `ok   ${at} — ${q.options.length} options${q.check ? ', check verified' : ''}` +
          `${q.distractorIndices ? `, ${q.distractorIndices.length} distractor(s) refused` : ''}`,
      )
    }
  }
}

const missing = sectionsWithoutQuestions()
console.log(
  `\n${qChecks} answer keys verified · ${dChecks} distractors refused · ${seenIds.size} questions across ${coveredSections}/${totalSections} sections`,
)

// Every section in the book now has questions, so this is a failure rather than
// a note. A new chapter, or a section added to an existing one, cannot ship
// without its quiz — the coverage gap that used to be a NOTE would otherwise
// come straight back the next time a section is written.
if (missing.length > 0) {
  fail(
    'coverage',
    `${missing.length} section(s) have no questions: ${missing.join(', ')}\n` +
      '     Write at least one question per section, or the book has a silent gap.',
  )
}

const total = failures === 0 ? 'ALL LESSON EXAMPLES AND QUIZES VERIFIED' : `${failures} FAILURES`
console.log(total)

process.exit(failures === 0 ? 0 : 1)
