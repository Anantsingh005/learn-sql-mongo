# Project Status

Last updated: 2026-09-21

## Objective (current session)
Expand the SQL quiz game (React + Vite + sql.js) to scale parity and improve the gameplay experience. Completed work landed in this order:

1. **Fix the Bug bank parity** — expanded from 8 to 68 questions (32 easy / 16 medium / 20 hard) with a `fixedQuery` on every bug question.
2. **Per-question timer** — all three modes (MC, Write, Fix the Bug) use a 120s per-question countdown.
3. **Extra time feature** — Write and Bug modes get +60s on demand whenever the timer drops below 10s. Repeatable. Timer pauses while the warning banner shows (inline banner, user confirmed). MC has no extra time.
4. **Fixed Write-the-Query easy questions** — 25 questions had a placeholder `"question":"easy"`; replaced with real prompts.
5. **Schema panel + hint toggle** — Write and Bug cards now show all tables with sample rows, plus a collapsible "Show hint".

## Work State

### Completed (fully verified)
- `src/data/sql/fixBug.js`: 68 questions. Bug bank total is 70 (33 easy / 16 medium / 21 hard) incl. 2 `windowCte` bug questions. Every question has `buggyQuery`, `fixedQuery`, inline schema, `expected`, `hint`, `explanation`.
- `scripts/verify-answers.mjs`: NULL-aware schema builder and `q.fixedQuery` fallback. Latest run: **71 match · 0 mismatch** (`node scripts/verify-answers.mjs`).
- `src/engine/QuizEngine.js`: timer with `options.timePerQuestion`; extra-time constants `DEFAULT_EXTRA_TIME_SECONDS = 60`, `DEFAULT_EXTRA_TIME_THRESHOLD = 10`; gate-based pause; `grantExtraTime()` / `declineExtraTime()`; snapshot exposes `extraTimePending`, `extraTimeSeconds`.
- `src/components/quiz/ModeSelect.jsx`: `timePerQuestion: 120` on all 3 modes; `extraTime: { seconds: 60, threshold: 10 }` only on `write` and `bug`.
- `src/pages/SqlQuiz.jsx`: engine created with `{ timePerQuestion, extraTime }` from mode; inline amber banner rendered when `snapshot.extraTimePending`.
- `src/data/sql/writeQuery.js`: all (25) easy placeholder `"question":"easy"` prompts replaced with real, simple prompts (kept existing hints). No placeholders remain. NOTE: this file had pre-existing uncommitted schema fixes (e.g. `write-h26/h29/h30/m3` `columns` nested-array → flat) before our work; leave untouched beyond the prompt edits.
- `src/components/quiz/SchemaPanel.jsx` (NEW): resolves `question.schema` via `resolveSchema` (`src/engine/queryCheck.js`), renders each table name + `<ResultTable columns rows/>`.
- `src/components/quiz/HintReveal.jsx` (NEW): collapsible Show/Hide hint using `question.hint`.
- `src/components/quiz/QuestionCard.jsx`: renders SchemaPanel + HintReveal only for `write` / `bug` types (MC unchanged). Card is keyed by `question.id` in `SqlQuiz.jsx`, so hint toggle state resets per question.

### Verified since last change
- `grep "question":"easy"` → 0 matches across `src/data/sql/`.
- `npm run build` → success (only chunk-size warning).
- `npx oxlint` → clean on changed files; pre-existing warnings only (`SqlQuiz.jsx:52` exhaustive-deps, `AuthContext.jsx` warnings) plus unrelated **errors in `wdata/*.mjs`** (junk scratch files, NOT part of the app, do not fix).

## Key Technical Facts
- SQLite (sql.js) does NOT support `> ALL (subquery)` — syntax error `near "ALL"`; use `> (SELECT MAX(...) ...)`.
- `checkAnswer` (AnswerChecker) compares column COUNT (names ignored, `ignoreColumnOrder: true`), so aliases are not required for correctness.
- `resolveSchema(schema)` in `src/engine/queryCheck.js` maps string `'store'` → `storeSchema`, object → as-is; used by schema panel.
- Question data banks (in `src/data/sql/`): `index.js` → `allSqlQuestions` = multipleChoice + writeQuery + fixBug + windowCte.
- `scripts/gen-fixbug.mjs` was generated then **deleted** — do NOT regenerate; `fixedQuery` is the source of truth in `fixBug.js`.

## Known Deviations / To-Dos
- `wdata/*.mjs` are leftover scratch files with syntax errors — ignore them.
- `storeSchema` rows are used by MC questions referencing schema `'store'`; MC cards intentionally do NOT show the schema panel.
- `StartScreen.jsx` is dead code (not imported anywhere).
- Timer was validated with a simulated-clock test (pause at 9s, grant → 69s, re-trigger on next crossing, decline → runs to timeout). No automated test file exists.

## Bash/QoL Notes
- This env is Windows PowerShell 5.1; use `;` or `if ($?)` (no `&&`). `rg` is NOT installed — use the Grep tool.
- Lint: `npx oxlint`; Build: `npm run build`; Data validation: `node scripts/verify-answers.mjs`.