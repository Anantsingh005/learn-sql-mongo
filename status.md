# Project Status

Last updated: 2026-09-26

## Current session (2026-09-26 - committed): Academy rebuild (SQL book reader)

**Old learning system removed:**
- Deleted `src/pages/Learn.jsx`, `src/pages/Lesson.jsx`, `src/pages/Course.jsx`, `src/components/learn/`, `src/data/learn/`, and `src/components/quiz/SqlHighlight.jsx`.
- Reverted the learning-only edits in `App.jsx`, `Layout.jsx`, `quiz/QuestionCard.jsx`, `Practice.jsx`. Lint + build passed after the deletion.

**Academy landing (`/academy`):**
- `src/pages/Academy.jsx` + `src/components/academy/BookGate.jsx` - language picker with **SQL Learning** (live) and **MongoDB Learning** (Coming soon).
- Selection is **path-based**: `/academy` = gate, `/academy/sql` = book, `/academy/sql/:chapterSlug` = chapter. (Was query-based `?game=sql`, which made the SQL card loop back to the gate.)

**SQL book (8 chapters, 40 written sections — Part One complete):**
- Data in `src/data/academy/`: `book.js` (metadata, parts, `LEARNING_GAMES`), `bookSchema.js`, `progress.js`, `lessonFor.js`, plus `chapters/ch01-reading-data.js` … `ch08-ctes-windows.js`.
- All eight chapters are written: 1 Reading Data, 2 Filtering, 3 Sorting & Limiting, 4 Joins, 5 Subqueries & Set Operations, 6 Aggregation & GROUP BY, 7 Modifying Data, 8 CTEs & Window Functions. `UPCOMING_CHAPTERS` is now empty and `SqlBook` hides the "Coming next" block when it is.
- The book is grouped into **two** parts: Part One "Reading, filtering, ordering and combining" (ch 1–5) and Part Two "Analysing, changing, and stepping back" (ch 6–8). The old three-part split was removed — note that `SqlBook.jsx` builds its contents grid *from* `PARTS`, so dropping a part entry without reassigning its chapters would have made chapters 4 and 5 vanish from the book page.
- `BOOK.edition` was `'Edition 1 · Part One'`, a leftover from when the book was three chapters; it is now just `'Edition 1'`.
- `bookSchema.js` reuses `storeSchema` from `src/data/sql/schemas.js` unchanged and adds a `reviews` table with real `NULL` ratings for the Chapter 2 NULL section. It also carries a real `FOREIGN KEY (product_id) REFERENCES products(id)` and `CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)` so Chapter 7 can print violations the reader can reproduce.
- `src/pages/Chapter.jsx` renders sections on warm "paper" (`PaperSheet`) with theory prose, dark `SqlCode` consoles, `ResultTable` insets, `FlowDiagram` row-flow, `SyntaxMap` clause-order and `JoinMap` join-type visuals, notes, a per-chapter mistakes list, and a cheatsheet.
- Author credit "Written by Anant Singh" (`Byline.jsx`) is now **cover only** (`SqlBook.jsx`). The byline and `BOOK.edition` were removed from the per-chapter header in `Chapter.jsx` — repeated on all eight chapter pages it was noise, and the running `Ch N · Title — SQL Foundations` document title already says which chapter you are in. `BOOK.edition` is still used, but only in that title string.
- The chapter footer (`ChapterFooter`) and the prev/next strip below it (`ChapterNav`) sit **inside** `PaperSheet`, i.e. on warm near-white `bg-[#faf7f0]`, but both were still written with dark-theme slate values — `text-slate-300` "Mark chapter as read" was effectively invisible on cream, and `ChapterNav`'s `bg-slate-900/60` chips were dark boxes floating on paper. Both now use the light convention already established by `Objectives` and `Mistakes` (`border-slate-900/15`, `bg-white`, `text-slate-600` → `text-slate-900` on hover), with `chapter.accent` still the one fill.
- The footer gained a fourth button, **Next chapter →**, driven by `neighbour(chapter.slug, 1)` and filled with `chapter.accent`. On chapter 8, where there is no next chapter, the slot becomes an outlined **← Back to contents** link to `/academy/sql` so the row never changes width.
- The old **All practice** link to `/practice` was removed from the footer: "Practise this chapter" already drills into a single topic, and the full `/practice` index is one click away from the nav, so the third button was redundant. The row is now two actions plus the next-chapter slot.
- The "Contents" rail (`ChapterOutline.jsx`) is now pinned at **every** breakpoint, not just `lg`. Two things make it work: `self-start` (as a grid item the nav used to stretch to the full row height, so `sticky` had no travel and the rail scrolled away), and an internal scroll area capped to the viewport (`max-h-[38vh] sm:max-h-[45vh] lg:max-h-[calc(100vh-3rem)]`) so a fully expanded chapter can never grow taller than the screen. The "Contents" heading stays put; the chapter list scrolls inside the rail.
- Progress is local-only under `dbquiz:academy-progress`; section keys are `${chapterSlug}--${sectionId}`. A section auto-marks read once 70% visible, and the chapter is marked read only when all its sections are.

**Section quizzes ("Check yourself"):**
- `src/components/academy/SectionQuiz.jsx` renders one multiple-choice question at a time at the foot of every section (`Chapter.jsx`, after the section's blocks). Pick an option → **Check answer** → the right answer and an explanation are revealed → **Next question →**. A wrong answer is never a dead end: the correct option is highlighted and Next stays enabled, because a book that traps its reader is worse than one they can skim. A dot per question shows each outcome, and the set ends on an `n / n correct` panel with a Retry.
- Questions are plain data in `src/data/academy/questions/ch01-questions.js` … `ch08-questions.js`, keyed by section id so the chapter files stay prose. `questions/index.js` maps chapter slug → file and exposes `questionsForSection`, `allQuestions`, `sectionsWithoutQuestions`. A chapter with no entry simply renders no quiz, so the book is being written chapter by chapter.
- Every question is written against `academySchema` (`customers`/`products`/`orders`/`reviews`) rather than reusing the quiz or practice banks. Neither was usable: all 646 practice questions carry their own inline ad-hoc schema (`employees`, `movies`, `dept_lookup`…), which would break the book's promise that every example runs against the same database the reader has been looking at. The two banks also disagreed on answer shape (`answerIndex` vs a `correctAnswer` string); the new files use `answerIndex`.
- Each question may carry a `check` — `{ code, columns, rows }` that **never renders**. It exists so `verify-lessons.mjs` can prove the answer key against real SQLite, the same discipline the book's `expect` blocks already get. A question may also carry `distractorIndices` — the options that are *supposed* to fail. The pass enforces 1-5 questions per section, at least 3 options, no duplicate options, an in-range `answerIndex`, a prompt, an explanation, and ids unique book-wide, and **every section in the book must have questions — a gap is a hard failure, not a note.**
- Quiz answers are persisted in a **third** bucket on the progress object, `correct`, holding the ids of questions answered right. It is deliberately separate from `read`: a section is still marked read by scrolling to it, so the 40/40 counter and chapter auto-complete are untouched. A missing `correct` key in an older saved object defaults to `[]`, so existing readers need no migration. Persisting only correct answers is what lets a returning reader skip what they have already proved.
- **Bug fixed while in there:** `syncChapterRead` and `chapterReadCount` in `progress.js` compared against the bare `s.id`, but every write stores the namespaced `sectionKey(chapter.slug, s.id)`. Neither could ever match, so chapters never auto-completed and the per-chapter read count was always 0. Both now use `sectionKey`. This is why the chapter tick marks in the outline were not updating on their own.
- **Coverage: all 40 of 40 sections, 87 questions, complete.** The book can no longer grow a section without also growing a quiz.

**Chapter 3 questions (`ch03-questions.js`):**
- Ten questions at **two per section** (the verifier allows 1-5), matching ch01/ch02's density. The agreed rate is two per section for all thirty remaining sections, because the schema is small — 6 customers, 7 products, 9 orders, 5 reviews — and a third question would be padding.
- Seven of the ten carry a `check`; the three that do not are the genuinely conceptual ones, where the answer is a claim about the language rather than a result set. That is a ~70% rate against ch01/ch02's 60%.
- **Every `check` is produced by running the query, never hand-written.** Same discipline as the lesson examples, and the reason a real bug got caught: the first draft of `q3.5.2` had a distractor `ORDER BY price DESC WHERE price > 50 LIMIT 3` and an explanation claiming it "runs, which is the trap". It does not — `WHERE` after `ORDER BY` is a syntax error, so the explanation would have taught a falsehood. The distractor was replaced with `WHERE price > 50 ORDER BY price DESC LIMIT 3`, which *does* run and returns the three most expensive rows, so the trap is now the sort direction rather than a fourth copy of the clause-order mistake.
- **The verifier used to ignore distractors** — it only ever ran the `check` attached to the question, which is the *correct* answer, so "which of these four runs" questions could silently have a second option that also runs. Every SQL option in the ch03 slate was run by hand. **Fixed:** see the distractor pass below.
- `q3.5.1` also confirmed a nice detail: `SELECT FROM products ...` fails with `near "FROM"`, not a vaguer error.

**Distractor verification (`distractorIndices`):**
- A question lists the option indexes that *ought* to fail. The verifier extracts SQL from each one — either a backticked span or a bare option starting with `SELECT` / `INSERT` / `UPDATE` / `DELETE` / `WITH` / `PRAGMA` — runs it on a **fresh database**, and requires an error. An option that runs cleanly fails the question.
- This is the reason the field exists rather than a comment: a distractor that quietly runs is a question with two correct answers, and the explanation then teaches a falsehood. The ch03 `q3.5.2` bug above is exactly that failure mode.
- Constraint-refusal and syntax-error options belong here, never in the `check` — a `check` can only prove that something *succeeded*. So Ch 7's "this is refused" and "this is a syntax error" questions mark their bad options instead of asserting a result.
- **6 distractors refused** across the book: `q4.2.1` (ambiguous `name`), `q6.4.1` (`WHERE` after `GROUP BY`, plus `HAVING` on a bare aggregate), `q8.1.1` (alias in `WHERE`), `q8.5.1` (`misuse of window function RANK()`).

**Chapters 4–8 questions (`ch04`–`ch08-questions.js`):**
- Fifty questions at two per section, closing the book at **87 questions / 40 of 40 sections**. Registered in `questions/index.js`.
- **Ch 7 questions had to be write-then-select.** `INSERT`/`UPDATE`/`DELETE` return no rows, so a `check` on them is meaningless; every Ch 7 question runs the DML and then a `SELECT` in the same check block, on the fresh per-check database. Transactions work the same way — `BEGIN; UPDATE; …; ROLLBACK; SELECT` proves the rollback, `COMMIT` proves the other one.
- **Ch 8 leans on two questions that are *about* wrong answers**, so they are the one place `distractorIndices` is doing real work: `q8.5.1` (you cannot filter on a window function) and `q8.1.1` (an alias *is* usable in `WHERE` when it belongs to a subquery). Both pair with the matching `q6.4` question, because both are the same rule seen from two sides — which is why `q8.1.1`'s explanation leans on the 6.4 trap.
- `q8.5.2` documents the nastiest case honestly: `GROUP BY` **plus** a window function runs without complaint and returns three nonsense rows. It cannot be a `distractorIndices` question, because it does not fail — so it is a `check` asserting the wrong-looking output, with the explanation carrying the point.

**Chapter 7 — writing data without a live sandbox:**
- New `dml` block type, rendered by `src/components/academy/DmlBlock.jsx`. `INSERT`/`UPDATE`/`DELETE` return no rows, so a `dml` block carries an `after.query` whose result is asserted by the verifier — the reader sees the actual consequence of the statement rather than a promise about it. Every example is a static, machine-checked before/after; there is no editable sandbox.
- Chapter 7 leans on the two real constraints in `reviews`: a foreign key refusing an orphan review and a product delete, a `CHECK` refusing `rating = 9`, and a `NULL` foreign key being legal on purpose. It also documents the SQLite-specific traps honestly — a missing `id` becoming `NULL`, `comment = comment + 1` silently overwriting prose with `1`, and `last_insert_rowid()` disagreeing with a supplied `id`.

**Cross-links into the existing game:**
- `src/data/academy/lessonFor.js` maps a question to a chapter by keyword, first match wins, and returns `null` unless that chapter is actually written — so the pill never points at an unwritten page.
- Rules are ordered most-specific-first: a `ctes-windows` rule sits **above** `aggregation` so `RANK`/`LAG`/`PARTITION` labels are not stolen by the `sum`/`count` tokens in the aggregation list.
- `src/components/quiz/QuestionCard.jsx` and `src/pages/Practice.jsx` show a "Ch N - Title" pill on questions that map to a written chapter.
- `Chapter.jsx` "Practise this" CTA deep-links to `/practice?topic=…` (chapters map to `table-query`, `joins` or `aggregation`, all valid `PRACTICE_TOPICS` keys); `Practice.jsx` reads that param and skips the game picker with the topic preselected.
- **Coverage: 976 of 978 questions across the quiz bank, the write/fix/window banks and the practice bank now resolve to a chapter.** The 2 that do not are labelled "Index concept", which no chapter teaches, so no link is the honest answer.

**UI fixes applied across the book:**
- `SqlBook.jsx` per-chapter read counts used `progress.sections.includes(s.id)` — the bare section id, which never matches the namespaced `${chapterSlug}--${sectionId}` key, so every card showed 0 read until the whole chapter was done. Now uses `sectionKey(c.slug, s.id)`.
- The Start/Continue button was gated behind `read > 0`, so a brand-new reader was never offered a way in, while the `read === 0 ? 'Start reading' : 'Continue'` label inside it was dead code. It now always renders, and points at the first chapter with an *unread section* rather than the first unfinished chapter.
- Literal backticks leaked in 31 places. `Prose.jsx` now exports `Inline`, the fragment-only version of its two-mark renderer, and `Note.jsx` and the Chapter "Common mistakes" list use it — a `<p>` cannot legally contain another `<p>`, so the marks are rendered inside the caller's own paragraph with tone-appropriate colours.
- `Cheatsheet.jsx` strips a *surrounding* backtick pair from cheat-sheet cells. The sheet renders in a dark console where the whole SQL column is already monospace, so the marks were printing as literal characters. Inner pairs are left alone.
- Narrow `focus-visible` rings on the book CTAs so keyboard focus is visible without changing the hover design.

**Verifier (`scripts/verify-lessons.mjs`):**
- Executes **every** `code` and `dml` block against `academySchema` in sql.js, in a **fresh database per block** (so a write in Ch 7 can never leak into the next example) with `PRAGMA foreign_keys = ON`. `expect` and `dml.after` results are compared row-by-row and column-name-by-column-name, `expectError` blocks must genuinely fail, remaining blocks must at least parse. Also shape-checks flow/result table widths and rejects a `dml` block with no after-state, since such a block asserts nothing.
- **`reviews` constraints are exercised for real:** bad ratings blocked, bad foreign keys blocked, duplicate ids blocked, `NULL` product allowed, and deleting a referenced product blocked.
- Coverage is now a **hard failure** (`FAIL coverage`, exit 1) naming every section with no questions. Verified by temporarily unregistering ch08: the run dropped to 35/40, listed all five missing sections and exited 1, then passed again once restored. A new chapter, or a section added to an existing one, can no longer ship without a quiz.
- **Currently 123 lesson queries checked, 30 tables shape-checked, plus the quiz pass — 72 answer keys verified · 6 distractors refused · 87 questions across 40/40 sections — ALL LESSON EXAMPLES AND QUIZES VERIFIED.**
- It caught real content bugs, each fixed by writing the truth rather than the intent: `SELECT name city FROM customers` is **not** a syntax error in SQLite (`city` becomes an alias for `name`); `SELECT` from a CTE offers only the columns named inside it; and mixing `GROUP BY` with a window function runs and returns nonsense rather than erroring.

**Verified:** `node scripts/verify-lessons.mjs` → ALL LESSON EXAMPLES AND QUIZES VERIFIED (72 answer keys · 6 distractors refused · 87 questions across 40/40 sections; coverage proven to fail on 35/40) · `node scripts/verify-answers.mjs` → 71 match / 0 mismatch · `node scripts/verify-schemas.mjs` → ALL SCHEMAS VALID · `npx oxlint src scripts` → zero warnings from Academy code (remaining `set-state-in-effect` warnings are pre-existing in `Profile.jsx`, `Auth.jsx`, `SqlQuiz.jsx`, `AuthContext.jsx`) · `npm run build` → success, 152 modules (chunk-size warning only, pre-existing). `node scripts/verify-engine.mjs` reports 79 passed / 117 failed, all pre-existing and unrelated: the failing `write-*` cases are "no correct answer defined", and `src/engine`, `src/data/sql` and `src/data/practice` are untouched by this session.

## Previous session (2026-09-26 - committed & deployed): More Practice expansion + MC tables + skip/results + circular progress

**More Practice hub (new):**
- Nav renamed **"Practice" → "More Practice"** (`src/components/Layout.jsx`, desktop + mobile).
- `src/pages/Practice.jsx` — new `GameSelect` landing with **SQL** (works) and **MongoDB** cards; Mongo renders `MongoComingSoon` (`game` state `null|'sql'|'mongo'`). The SQL picker heading reads "More Practice · SQL" with a `← SQL / MongoDB` back link.

**Tables on every Multiple-Choice practice question (new):**
- More Practice MC questions now **always** show the tables panel — all topics (**table-query / joins / aggregation**) and all levels (**easy / medium / hard**), on top of the 60 quiz-bank MCs that already used `schema: 'store'`.
- The 450 generated legacy practice MCs previously carried no schema. Their datasets were **reverse-engineered from the encoded answers**: fictional `employees`, `movies`, `products`, `books`, `students` (8 rows each) + join lookups `dept_lookup` / `genre_lookup` / `category_lookup` / `grade_lookup`. A sql.js constraint verifier replays every legacy MC's SQL against the reconstructed data and asserts the derived answer equals `correctAnswer` — **450/450 pass**.
- A one-off embed step attached an inline `schema` object to each legacy MC in `src/data/practice/practice-questions.json`: the referenced base table(s) plus the lookup minus the "except 'X'" value named in the question text, so JOIN/LEFT JOIN counts stay consistent with the wording. `resolveSchema` (`src/engine/queryCheck.js`) already accepts inline objects — no engine change. Re-verified **450/450** after embedding; bank totals unchanged (**646 questions**: mc 510, write 66, bug 70).

**Skip + practice results (new):**
- `src/pages/Practice.jsx` — a **Skip button now shows for all question types** (MC keeps Skip + Submit; Write/Bug get their own footer with a Skip button). `PracticeEngine.skip()` already recorded `skipped: true` answers, so no engine skip change was needed.
- `src/engine/PracticeEngine.js` snapshot adds **`wrong`** and **`graded`** (`correct + wrong`); `answered` still counts every question seen (incl. skipped).
- Live `PracticeHUD` now shows `X/Y correct · Z wrong · N practiced` beside the score.
- Final `Results` screen shows **"You practiced N questions"**, a percentage computed only over attempted (graded) questions, and a **Correct / Wrong / Skipped** breakdown — skips count in the practiced total but are excluded from the %.

**Profile · SQL game progress → circular rings (new):**
- `src/pages/Profile.jsx` — replaced the square level tiles + horizontal bars in the SQL game progress grid with a new SVG **`ProgressRing`** component: the ring fills to the level's best percentage (color-matched per level via a new `hex` field on `LEVELS`), and the center shows the level short letter (E/M/H/A) when in progress, ✔ in emerald when completed, 🔒 when locked. Each row still links to the level report.

**Verified:** `npm run lint` → only pre-existing warnings (`wdata/*.mjs` junk + baseline `src` warnings) · `npm run build` → success (chunk-size warning only). **Deployed:** committed (practice hub, MC tables, skip/results, Profile rings) and pushed to `origin/main` → Vercel production rebuilt. The Academy lesson pages were intentionally left out of this commit/deploy.

## Previous session (2026-09-24): per-level SQL progress reports + profile leaderboard

**Per-level progress reports (SQL game):**
- **DB (migration `create_question_attempts`):** `public.question_attempts` — per-question result log: `user_id → auth.users` (ON DELETE CASCADE), `game` (default `'sql'`), `mode` CHECK (`mc`/`write`/`bug`), `difficulty` CHECK (`easy`/`medium`/`hard`), `question_id`, `correct bool`, `created_at`. Index `(user_id, game, mode, difficulty, question_id, created_at desc)`. RLS: owners insert/select/delete own rows; admins select/delete (`private.is_admin()`). Grants tightened to anon/authenticated/service_role + sequence usage.
- `src/lib/attempts.js` (NEW) — `saveAttempts(userId, { game, mode, attempts })` batch-inserts every answered question on quiz finish (using each question's own `difficulty`, so mixed "All Levels" runs bucket into the correct report level); `fetchAttempts(userId, { game, mode, difficulty })` feeds the report.
- `src/pages/SqlQuiz.jsx` — on `finished`, records attempts in parallel with the existing score/progress saves (signed-in only). Added deep-link support: `/quiz/sql?mode=mc&level=easy` auto-starts that mode+level (`quizModes` exported from `ModeSelect.jsx`); guests may only deep-link to `easy` (other levels ignored).
- `src/pages/LevelReport.jsx` (NEW, route `/profile/report/:mode/:level`) — per-level report: status pill, best %, per-question breakdown across the full question bank of that mode+level (✓/✗/○, tries, accuracy), mastered count, unlock hints, and a "Play this level" button deep-linking back into the quiz. Profile matrix cells link into it.
- Attempts only accrue from now on — historic runs have no per-question data; the report notes this when `attempts.length === 0 && bestPct > 0`.

**Level availability (Easy/Medium open · Hard = Easy+Medium ≥75% · All Levels = all three ≥75%):**
- The quiz `LevelSelect` already gated exactly this way (`isLevelUnlocked`); the new work surfaces gates everywhere. Profile **SQL game progress matrix** now shows **4 tiles per mode** (Easy/Medium/Hard/**All Levels**, cyan accent) with **locked-state hints** — hard shows `🔒 75% on Easy+Medium`, all shows `🔒 75% on all three` until the gate is met. Tiles still link to the report.
- **Level report** now supports `level = all` (`/profile/report/:mode/all`): cyan accent meta (`LEVELS.all`), `selectQuestions({ difficulty: 'all' })` mixes the whole per-mode bank, best %/completed read `:mode_all`, and the Play button is **gated** — signed-in users who haven't met the 75% gate see `🔒 Locked — <rule>` instead of a link.
- **Deep-link hardening** (`SqlQuiz.jsx`): `/quiz/sql?mode=…&level=hard|all` now also requires `isLevelUnlocked(level, progress, mode)` for signed-in users (progress added to effect deps), so the URL can't bypass the gates. Guests remain easy-only everywhere.

**Reset progress (replaces the "Danger zone" / delete-account UI):**
- DB migration `add_reset_archive_and_function`: `scores` and `question_attempts` gain nullable `reset_at timestamptz`; new SECURITY DEFINER `reset_user_progress(p_include_scores bool)` RPC (search_path pinned to `public, pg_temp`) verifies `auth.uid()`, upserts empty `user_progress` (`sql`/`mongo` → `{"completed":[],"best":{}}`), and when `p_include_scores = true` stamps `reset_at = now()` on the caller's `scores` + `question_attempts` (soft archive — rows kept, admin panel still sees everything). EXECUTE revoked from anon/public, granted to authenticated only (anonymity advisor warning re-checked and cleared — the authenticated SECURITY-DEFINER notice is intentional, same as `handle_new_user`).
- `src/lib/profile.js` — `fetchUserScores` filters `.is('reset_at', null)` (archived sessions vanish from Practice & sessions + Recent sessions); new `resetUserProgress(includeScores)` wrapper over the RPC. `src/lib/attempts.js` — `fetchAttempts` similarly filters archived rows (Level-Report breakdowns reset too).
- `src/pages/Profile.jsx` — "Danger zone"/Delete-my-account section removed (edge-function account-delete code kept in place, just unsurfaced); new **Reset progress** section (rose accent) with a **three-step inline confirm**: (1) confirms the progress reset, (2) asks whether to also clear Practice & sessions and Recent sessions (`pendingScores`), then (3) a **final "Are you absolutely sure?"** confirmation that restates exactly what will happen before anything runs — the reset only executes on this last step. On success it calls `clearLocalProgress()` and bumps a `refreshKey` that re-fetches progress + scores; the leaderboard card (`fetchPlayerSnapshot`) is untouched, so scores stay ranked.
- Verified live under the authenticated role (RLS-simulated): progress-only reset zeroes `user_progress`; full reset archives every one of the user's `scores` rows — rows survive (id 12 #1 still present, `reset_at` set), the `.is('reset_at', null)` filter hides them, and `fetchTopScores`-style unfiltered reads still rank them. Throwaway test rows cleaned up; the user's real progress was restored from the attempt logs after testing.

**Leaderboard card on Profile:**
- `src/pages/Profile.jsx` — new "Leaderboard" card (dark, matching the level cards) after the SQL progress grid: top 10 SQL scores with rank badges (#1 gold / #2 silver / #3 bronze), username, score, time; the signed-in user's row is highlighted (indigo + "you" chip), and if they rank outside the top 10 a highlighted row shows their overall rank. "View all →" → `/leaderboard`.
- `src/lib/leaderboard.js` — `fetchTopScores` now also selects `user_id`; new `fetchPlayerSnapshot(game, userId, top)` = top-10 rows + the user's best submission + exact overall rank (count of strictly-better rows using the same `score DESC, time_seconds ASC` tiebreak, via a `count: 'exact'` head query). No schema changes — `scores` is already publicly readable.

**Practice & sessions (per-game breakdown):**
- The single 4-stat row + "N SQL · N Mongo submissions" footnote is replaced with two level-card-style cards (SQL / Mongo), each showing sessions, total play time, average score, and best score for that game only (was previously blended across all games). Computed client-side from the already-fetched `scores.rows` via a small `gameStats(rows, game)` helper — no new queries; removed the now-unused `Stat` component and global `stats` from `Profile.jsx`.

**Verified:** `npm run build` clean (chunk-size warning only) · `npx oxlint` only pre-existing warnings + `wdata/*.mjs` junk · `question_attempts` schema + RLS policies confirmed via `pg_policies` · security advisors clean for the reset change (anon EXECUTE revoked; `authenticated` SECURITY-DEFINER + leaked-password notices are the pre-existing baseline) · RPC tested under a simulated authenticated role with full restore of live data.

**Leaderboard storage + ranking fix (bug):** `scores.score` had `CHECK (score BETWEEN 0 AND 100)` but the game saves accumulated **points** (easy=100/medium=200/hard=300 per correct) — every multi-question run exceeded 100 and Postgres **silently rejected the insert** (`scores` stayed empty). Migration `fix_leaderboard_storage` drops the cap (new `score >= 0` check), adds `correct_count` / `total_questions` / `lives_left` (with 0–3 lives check), and replaces the index with `(game, score DESC, lives_left DESC, time_seconds ASC)`.
- `saveScore` now stores points + correct count + questions + lives left + time; `fetchTopScores` / `fetchPlayerSnapshot` order and rank by that 3-level tiebreak; the "your rank" count uses the matching `.or()` disjunction (verified live with synthetic rows, then cleaned up).
- SQL leaderboard card + standalone `/leaderboard` now show **pts · correct x/y · ♥lives · time**; Profile practice stats switched to real % (`correct_count / total_questions`) so the "%" labels still make sense with point-based scores.
- Guests remain excluded (signed-in only), and empty states now say "sign in and finish a quiz to land on the board!".

**Categorized leaderboard (mode × level) + global rank:**
- Migration `add_scores_mode_level`: `scores` gains `mode` CHECK (`mc`/`write`/`bug`) and `level` CHECK (`easy`/`medium`/`hard`/`all`) — both NOT NULL (table was empty); index rebuilt to `(game, mode, level, score DESC, lives_left DESC, time_seconds ASC)` (game-leading, so it also serves global-by-game reads). RLS unchanged.
- `saveScore` now records the category of the run (`mode: mode.key`, `level: engine.difficulty`). `fetchTopScores({ game, mode = null, level = null, top })` and `fetchPlayerSnapshot({ game, mode, level, userId, top })` scope the top rows, the user's best submission, and the exact rank-count `.or()` query to the category; `mode: null` = **global** (all modes + levels, still game-scoped).
- `src/components/Leaderboard.jsx` (standalone `/leaderboard`): mode tabs **MC · Write · Fix Bug · Global** + level tabs **Easy · Medium · Hard · All Levels** (hidden in Global), reads `?game=&mode=&level=` (used by Profile's "View all"), and now shows the signed-in user's highlighted row + their exact rank inside the active category (or global rank in the Global tab) even outside the top 10.
- `src/pages/Profile.jsx` leaderboard card: same tabs; **defaults to the user's most recent played category** (from the latest `scores.rows[0]`), falls back to mc/easy; header shows `SQL · <mode> · <level>`; empty state names the category; "View all →" carries the current category via query params. Recent-sessions list gained mode/level chips, and the score label shows `pts` (was erroneously `%` after the points migration).
- Verified live with a simulated authenticated-role insert (passed RLS, `mode`/`level` stored): mc/easy board ordered [500 → 300 → 200], write/medium isolated, global ordered across categories, rank-count = 2 for the 300-pt row → then cleaned up. `npm run build` clean; oxlint only pre-existing warnings.

**Backfill & deployment:** The user's only finished signed-in run (MC/Easy, 2026-09-24 08:14) predated BOTH the storage fix and the mode/level columns — its score was rejected, so `scores` held no rows. Backfilled one real entry from its 25 recorded attempts (25/25 → `score=2500 pts`, `correct=25/25`, `lives=3`, `time_seconds=600` **estimated** since not recorded, `username='Infinite'`, `created_at` set to the real run time). Verified rank #1 in mc/easy + Global boards and the exact rank-count logic. **Deployed:** commit `ea297af` (categorized leaderboards + storage fix) pushed to `origin/main` → Vercel production rebuilt; `database-games.vercel.app` now runs the categorized client, so `saveScore` stores `mode`/`level` and live runs land on the boards (the user's later runs are rows 13/14, ids 13–14).

**Leaderboard UI restyle (game look):** Both the standalone `/leaderboard` and the Profile leaderboard card now match the quiz aesthetic — animated `text-gradient` mono kicker + gradient title header; a filter "deck" card (`rounded-2xl bg-slate-900` with a mode-colored top strip) holding SQL/Mongo chips, mode tabs with the game's icon badges (`A` / `>_` / `!` / `∞`) and real accents (MC indigo→cyan, Write emerald→teal, Bug rose→orange, Global cyan→fuchsia), and level chips (Easy emerald / Medium amber / Hard rose / All cyan) with per-accent glows; the table is now a dark `bg-slate-900` board with mode-tinted strip, mono uppercase headers, rank pills (gold/silver/bronze + soft glow), mono times, and a mono footer readout. All accent classes are static Tailwind maps (`MODE_ACCENTS`/`LEVEL_ACCENTS`), no runtime-constructed classes.

Build passes; oxlint unchanged from baseline.

## Previous session (2026-09-24): profile screen + custom auth control plane (Edge Function)

Replaced the hosted email-confirmation signup/reset flow with our own auth service (`supabase/functions/auth`) to eliminate the Supabase email rate limit and give a working password reset without SMTP. Added a profile screen. Deployed: Supabase function `auth` v6 + Vercel production (database-games.vercel.app).

**Profile screen (new):**
- `src/pages/Profile.jsx` (route `/profile`) — account info (email, username, name, member since) plus a 9-tile progress matrix (MC/Write/Bug × Easy/Medium/Hard, from `getProgress`) and session/play-time stats.
- `src/lib/profile.js` — `fetchUserScores(userId)`.
- `Layout.jsx` AuthMenu is now a `NavLink` to `/profile`; sign-out moved onto the Profile page.

**Custom auth control plane (new):**
- `supabase/functions/auth/index.ts` — actions `signup` / `reset` / `complete-reset`, using the service-role Admin API (`admin.auth.admin.createUser` with `email_confirm: true` → no confirmation email → the hosted rate limit can never fire, instantly-confirmed session). Per-IP in-memory rate limits (signup 10/h, reset 5/h, complete-reset 10/10min). `needsConfig()` returns a clear 503 until `SUPABASE_SERVICE_ROLE_KEY` is set.
- `verify_jwt: false` — signup/reset are deliberately public endpoints; gating is done in-function.
- CORS handled manually: `OPTIONS` → `204` + `CORS_HEADERS` (`Allow-Origin: *`, SDK methods + headers) and the same headers on every JSON response. (Deno forbids a body on `204` — used `Response(null, …)`.)
- `admin.from('auth.users')` does **not** work on this project (auth schema is not exposed to PostgREST) — user lookup uses `admin.auth.admin.listUsers` instead.
- DB migration `add_password_resets`: `public.password_resets` (user_id → auth.users, `code_hash` SHA-256, 30-min expiry, single-use `used_at`), RLS on with restrictive deny policies for anon/authenticated (only the service role touches it).

**Client auth changes:**
- `src/lib/auth-api.js` (NEW) — `callAuth(action, payload)` invoking the Edge Function; extracts real error bodies (`error` / `msg` / `message`) instead of the SDK's generic text.
- `src/lib/supabase-auth.js` — `supabaseSignUp` now calls the Edge Function then `signInWithPassword` (returns a session directly, no inbox step); `supabaseResetPasswordRequest` returns the dev reset code; new `supabaseCompleteReset(email, code, password)`.
- `src/context/AuthContext.jsx` exposes `completePasswordReset`.
- `src/pages/Auth.jsx` — reset is a two-step flow: email → 6-digit code (in a cyan dev-preview box, no email sent yet) + new password → sign in.

**Verified:** `npm run build` clean · `npx oxlint src` only pre-existing warnings · live E2E with a throwaway user (signup → reset code → complete-reset → Gotrue sign-in with new password → user deleted, DB clean) · preflight `OPTIONS` → 204 + CORS headers · POST with browser `Origin` → 200.

## Previous session (2026-09-23): guest gating, auth UX fixes, signup fields, QA (admin dashboard)

Sprint on top of the Supabase migration: gameplay progress dots, guest limits, richer sign-up (username/name), and hard fixes to the auth/sign-up flow. Deployed to Vercel (production `database-games.vercel.app`).

**Guest access gate (new):**
- `src/data/selectQuestions.js` — `GUEST_QUESTION_LIMIT = 10`; `selectQuestions({ types, difficulty, limit })` slices the filtered bank when `limit > 0`.
- Guest = `configured && !user` (`SqlQuiz.jsx`). Guests get **10 questions per level**; extra time disabled (`extraTime: undefined` passed to engine); **Hints hidden** (`QuestionCard.jsx` renders no `HintReveal` when guest); **Hard + All Levels locked** regardless of stored progress (`LevelSelect.jsx` shows "🔒 Sign in").
- `GuestBanner.jsx` (NEW) on ModeSelect + LevelSelect: "first 10 questions per level free — create an account to unlock the full bank, all levels, hints, and extra time", CTA → `/auth?mode=signup`.
- ModeSelect shows `X free / Y total` per mode for guests. Schema panel remains available to guests (by choice).

**Per-question progress dots (new):**
- `src/components/quiz/HUD.jsx` — `ProgressDots` row: one square per question, gray = unanswered, emerald = correct, rose = wrong, current question gets an indigo ring. Driven by `snapshot.answers` (already ordered) — no engine change.

**Clear local progress:**
- `src/lib/progress.js` — `clearLocalProgress()` removes `dbquiz.progress` from localStorage.
- `Home.jsx` — "Clear your progress" button (guests only; hidden when signed in), with confirmation + "Local progress cleared." feedback.

**Sign-up now collects username + name (new):**
- **DB (migration `add_profile_name_and_signup_metadata`):** `profiles` gains `name text`; `handle_new_user` rewritten to read `raw_user_meta_data->>'username'` (fallback email-prefix → `player`) and `->>'full_name'` → `name`.
- `supabaseSignUp({ email, password, username, name })` passes `options.data`; `fetchProfile` returns `name`; `AuthContext` profile includes `name`.
- `Auth.jsx` — Username + Name fields in signup mode; client validation `^[A-Za-z0-9_.-]{1,24}$`; keeps confirm-email prompt.

**Auth fixes (verified against server logs):**
- **Repeated-signup silent-success bug:** Supabase returns 200 + `user:null`/`identities:[]` when the email already exists ("user_repeated_signup"); client used to `navigate('/')` pretending success. Now `supabaseSignUp` returns a clear error → form shows "An account with this email already exists. Try signing in instead."
- **Password reset flow:** `supabaseResetPasswordRequest(email)` (`resetPasswordForEmail`, redirect `/auth?mode=reset`) + `supabaseUpdatePassword(password)` in `supabase-auth.js`; exposed via `AuthContext`; "Forgot your password?" link on sign-in; `/auth?mode=reset` shows email-request OR new-password form (when recovery session active); success → sign out → `/auth?notice=password-updated`.
- **URL→view sync:** `Auth.jsx` now has a `useEffect` syncing `mode` to `?mode=` (reset/signup/signin) and `?notice=` so navigating `/auth?mode=reset` actually switches the rendered view.
- **Google OAuth → full-page redirect:** replaced `window.open` popup with `window.location.assign(data.url)` (`supabase-auth.js`) — more reliable on mobile/popup blockers.
- **Google provider enabled** in Supabase dashboard (was returning 400 `provider is not enabled` on `/authorize` — confirmed via `auth_logs`). Callback URL `https://qyowerafreocmutjblmw.supabase.co/auth/v1/callback`; JS origins localhost:5173 + Vercel.

**Local/dev logging (new):**
- `src/lib/debug.js` — `debugLog`/`debugError` gated to `import.meta.env.DEV` (or `VITE_DEBUG=1`).
- Wired into `supabase-auth.js`, `AuthContext.jsx`, `Auth.jsx`: logs every signUp/signIn/Google/password-reset step + errors to the browser console (no passwords). Routed the hosted auth rate-limit surfaced in UI (`over_email_send_rate_limit` → friendly message).

**Supabase email rate limit (observed):** `/signup` → 429 `over_email_send_rate_limit` after repeated testing from one network; auto-resets ~1h (server-side, not configurable). Not an app bug.

**Verified:** `npm run build` clean (chunk-size warning only) · `npx oxlint src` no errors (only pre-existing `AuthContext` warnings + `wdata/*.mjs` junk).

**Commits (branch `main`, pushed to origin, auto-deployed):**
- `752d867` Add quiz progress dots, clear local progress, richer signup fields
- `0d96bc7` Reformat scratch data file w-easy1
- `9efc802` Add admin dashboard, guest mode, and richer auth flows (guest gating, GuestBanner, reset flow, debug logging, URL-view sync, admin dashboard)

## Previous session (2026-09-22): auth/data migration Firebase → Supabase
Moved authentication and the data layer from Firebase (Auth + Firestore) to Supabase (Auth + Postgres). Supabase project ref `qyowerafreocmutjblmw`.

**Database (applied via Supabase migrations):**
- `profiles` — `id` → `auth.users(id)`, `username` (checked `^[A-Za-z0-9_.-]{1,24}$`), now also `name`; auto-created on signup by `handle_new_user` trigger (SECURITY DEFINER, EXECUTE revoked from anon/authenticated).
- `scores` — public leaderboard; `game` CHECK in (`sql`,`mongo`), `score` 0–100, `time_seconds` ≥ 0, denormalized `username`; index `(game, score desc, time_seconds asc)`.
- `user_progress` — `user_id` PK, `sql`/`mongo` jsonb buckets, `updated_at` auto via `set_updated_at` trigger.
- RLS on all; `scores` select public, insert `auth.uid()=user_id`; `profiles`/`user_progress` owner-only. Grants tightened to least-privilege (Supabase template auto-grants ALL to anon/authenticated on new tables).
- Advisors clean (after revoking function EXECUTE).

**Client:**
- `firebase` dep removed → `@supabase/supabase-js@2.117.0`.
- `src/lib/supabase.js` (client), `supabase-auth.js`, `progress.js` (localStorage fallback for guests; Postgres upsert for users), `leaderboard.js`.
- `AuthContext.jsx` single Supabase path; profiles fetched from `profiles` table; username updates persist.
- `Auth.jsx` reads `?mode=` from URL; sign-up shows confirm-email prompt when `signUp` returns no session.
- Deleted `src/firebase/*`, `src/lib/localAuth.js`, `firestore.rules`.

**Verified previously:** advisors clean · RLS blocks mismatched `user_id` insert · signup creates user + auto-profile · progress upsert roundtrip · score insert + public anon read.

## Previous session (2026-09-21): SQL quiz scale + UX
1. **Fix the Bug bank** — 8 → 68 questions, `fixedQuery` on every bug question.
2. **Per-question timer** — 120s in all three modes.
3. **Extra time** — +60s on demand under 10s in Write/Bug (repeatable, timer pauses on banner).
4. **Fixed Write easy placeholders** — 25 prompt stubs replaced with real prompts.
5. **Schema panel + hint toggle** — Write/Bug cards show tables + collapsible hint.

## Work State

### Completed (fully verified)
- Academy SQL book reader (see Current session): **8 chapters / 40 sections**, `/academy` gate + `/academy/sql` book + `/academy/sql/:slug` chapter, localStorage progress, **section quizzes on all 40 sections (87 questions, every answer key and 6 distractors machine-verified against sql.js, coverage a hard failure)**, quiz/practice cross-links (976/978 questions), static verified DML after-state, and `scripts/verify-lessons.mjs` (123 queries, 30 tables, 40 sections pass). **Committed.**
- More Practice hub + MC tables + skip/results + circular progress rings (see Current session — committed & deployed): `GameSelect`/`MongoComingSoon` in `Practice.jsx`, nav rename, inline datasets embedded for all 450 generated MC practice questions (450/450 answer-verified), Skip for all question types, `wrong`/`graded` snapshot metrics, practiced/correct/wrong/skipped results + HUD, and `ProgressRing` on the Profile SQL progress grid.
- Level progress reports + leaderboard card (see previous 2026-09-24 session): `question_attempts` table + RLS, `attempts.js`, `LevelReport.jsx`, deep-link quiz start, Profile matrix links, top-10 leaderboard with your overall rank.
- Profile screen + custom auth control plane + password-resets table (see previous 2026-09-24 session): function `auth` v6, client `auth-api.js`, two-step reset UI; live E2E signup → reset → complete-reset → sign-in verified on a throwaway user (cleaned up; DB back to 2 users, 0 resets).
- Guest gating + progress dots + reset flow + debug logging + admin dashboard (see previous session section).
- `src/data/sql/fixBug.js`: 68 questions (33 easy / 16 medium / 21 hard + 2 windowCte). Every question has `buggyQuery`, `fixedQuery`, inline schema, `expected`, `hint`, `explanation`.
- `scripts/verify-answers.mjs`: NULL-aware schema builder and `q.fixedQuery` fallback. Latest run: **71 match · 0 mismatch**.
- `src/engine/QuizEngine.js`: per-question timer + extra time (gate-based pause); snapshot exposes `extraTimePending`, `extraTimeSeconds`.
- `src/components/quiz/SchemaPanel.jsx` (NEW), `HintReveal.jsx` (NEW), `QuestionCard.jsx` renders both for `write`/`bug`.
- `src/data/sql/writeQuery.js`: easy placeholder prompts replaced; no placeholders remain.

### Verified since last change
- `npm run build` → success (only chunk-size warning).
- `npx oxlint src` → no new errors from this session (pre-existing warnings + unrelated `wdata/*.mjs` junk only).

## Key Technical Facts
- **SQLite silently accepts a missing comma as an alias:** `SELECT name city FROM customers` returns a column *named* `city` containing the names, with no error. Don't assume a typo in the select list will fail loudly.
- `db.exec()` in sql.js returns an **empty array for a zero-row result**, so there is no result object to read column names from. Any verifier comparing column names must skip that check when `rows.length === 0`.
- Academy routing is path-based (`/academy`, `/academy/sql`, `/academy/sql/:slug`). `Academy.jsx` branches on `useLocation().pathname`, not a query param.
- `chapterSlugForQuestion` deliberately returns `null` for unwritten chapters, so the cross-link pill is absent rather than pointing at a stub.
- SQLite (sql.js) does NOT support `> ALL (subquery)` — use `> (SELECT MAX(...) ...)`.
- `checkAnswer` compares column COUNT (names ignored), so aliases are not required.
- `resolveSchema(schema)` in `src/engine/queryCheck.js` maps `'store'` → `storeSchema`, object → as-is.
- Question banks in `src/data/sql/`: `index.js` → `allSqlQuestions` = multipleChoice + writeQuery + fixBug + windowCte.
- `scripts/gen-fixbug.mjs` was generated then **deleted** — do NOT regenerate; `fixedQuery` is the source of truth.
- Supabase repeated-signup returns HTTP 200 with `user:null`/`identities:[]` — client must treat that as "email already registered", not success. (Moot now: signup goes through the Edge Function, which pre-checks duplicates via `admin.auth.admin.listUsers`.)
- Edge Function `auth` (`supabase/functions/auth/index.ts`) is the auth control plane: `signup`/`reset`/`complete-reset` via service-role Admin API, per-IP rate limits, `verify_jwt: false`, manual CORS. If JWT verification is ever re-enabled, signed-out callers will be rejected — don't.
- `auth.users` is not queryable via PostgREST on this project (auth schema not exposed) — `admin.from('auth.users')` silently fails; use `admin.auth.admin.listUsers`.
- Reset codes are stored as SHA-256 of `code + ':' + SUPABASE_URL` (not plaintext), expire in 30 min, single-use (`used_at`). In dev the code is returned in the response and shown on screen; wire SMTP to email it when ready.
- Supabase email-send rate limit (`over_email_send_rate_limit`, 429) is server-side and auto-resets (~1h) — bypassed for signup by `admin.createUser({ email_confirm: true })` (no confirmation email is sent).
- `question_attempts.difficulty` is set from each question's own `q.difficulty` (not the engine's `difficulty`) so All-Levels runs land in the right per-level report. The quiz samples the same full question pool as `LevelReport` (`selectQuestions` returns all matches when `limit` is omitted), so `question_id` and "mastered" (last attempt correct on every question of the level) stay consistent.
- Leaderboard ranking uses the same tiebreak as the board itself: `score DESC, time_seconds ASC`. `fetchPlayerSnapshot` computes "your rank" by counting strictly-better rows with a `count: 'exact'` head query (`score > mine OR (score = mine AND time_seconds < mine)`) — no window/function needed, and `scores` is public to read.
- `fetchTopScores` selects `user_id` so the Profile card can highlight "your" rows; the standalone `/leaderboard` page ignores the extra column.

## Known Deviations / To-Dos
- `wdata/*.mjs` are leftover scratch files with syntax errors — ignore them.
- `storeSchema` rows used by MC questions referencing schema `'store'`. In **More Practice** MC cards show the tables panel: quiz-bank MCs use `schema: 'store'`, while the 450 generated legacy MCs carry inline `schema` objects (fictional `employees`/`movies`/`products`/`books`/`students` + lookup tables) embedded in `src/data/practice/practice-questions.json`. The main quiz (`SqlQuiz.jsx`) MC cards intentionally still don't show the schema panel.
- `StartScreen.jsx` is dead code (not imported anywhere).
- Timer validated with a simulated-clock test; no automated test file exists.
- Password reset currently returns a dev 6-digit code shown on screen (no email; no SMTP configured). Accounts are therefore not actually email-verified until a mailer (e.g. Resend) is wired to email the code + confirm-email on signup.
- Edge Function secrets `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` must be set on the `auth` function (they are, and verified live); without them the function returns a 503 `needsConfig` error.
- Hard/All levels + hints + extra time are gated for guests by design.
- `question_attempts` only records results from now on — pre-existing best %s have no per-question breakdown (report shows a note for that case).

## Bash/QoL Notes
- This env is Windows PowerShell 5.1; use `;` or `if ($?)` (no `&&`). `rg` is NOT installed — use the Grep tool.
- Lint: `npx oxlint src scripts`; Build: `npm run build`; Data validation: `node scripts/verify-answers.mjs`; Academy examples: `node scripts/verify-lessons.mjs` (must be run from the repo root so it can resolve `sql.js` and the ESM source).