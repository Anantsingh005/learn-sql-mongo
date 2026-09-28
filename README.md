# Database Games

An interactive SQL quiz game built with React + Vite. Players answer SQL questions that are executed against a real in-browser SQLite database (via [sql.js](https://sql.js.org/)), with Supabase powering authentication and a public leaderboard.

## Features

- **Three question modes**
  - **Multiple Choice** — pick the correct query from a list.
  - **Write the Query** — type a query and run it against a live in-browser SQLite database; results are compared against the expected answer.
  - **Fix the Bug** — a buggy query ships with the question; fix it until it matches the expected output.
- **Per-question timer** — 120 seconds per question in every mode.
- **Extra time** — Write and Bug modes offer +60s on demand when the timer drops below 10s (repeatable).
- **Schema panel** — Write and Bug cards include an expandable view of all tables with sample rows.
- **More Practice** (unlimited, no lives/timer) — `/practice` hub with **SQL** and **MongoDB** (coming soon) game cards. Drill any question type (**Multiple choice / Write the query / Fix the bug**) across topic (**table-query / joins / aggregation**) and level (**easy / medium / hard**) filters. Multiple-choice cards show the tables panel too (quiz-bank MCs use the `store` schema; generated-bank MCs have inline fictional datasets). Every question has a **Skip** button, the live HUD shows correct/wrong/practiced counts, and the end screen reports how many questions you practiced with a correct/wrong/skipped breakdown (skips are counted in the practiced total but excluded from the score percentage).
- **Hints** — collapsible "Show hint" toggle on Write and Bug questions.
- **Question bank** (see `src/data/sql/`):
  - `multipleChoice.js` — multiple-choice questions
  - `writeQuery.js` — free-form query questions
  - `fixBug.js` — buggy-query questions (every entry includes a verified `fixedQuery`)
  - `windowCte.js` — window functions and CTEs
  - `schemas.js` — shared in-browser schemas (e.g. `store`)
- **Auth & leaderboard** — Supabase Auth (email/password + Google) for sign-in; signed-in users submit scores to a public leaderboard. Signup/password-reset go through a custom Edge Function (`supabase/functions/auth`) that uses the Admin API, so no confirmation emails are sent and the hosted email rate limit can't be hit. The name on a score is set by a database trigger, not by the browser, so a run that finishes before the profile has loaded still records under the right name.
- **Categorized leaderboards** — boards scoped by mode (**MC / Write / Fix Bug / Global**) and difficulty (**Easy / Medium / Hard / All Levels**), on both the standalone `/leaderboard` page and a Profile card that defaults to your most recent category. Rows are ranked by **points → lives left → fastest time**, and signed-in players see their exact rank in the active category even when they're outside the top 10. A signed-in player with no score on the board yet gets a short callout with a link to play, rather than an empty table. On phones the board opens with no mode picked and asks which one instead of guessing, and the level row is hidden until a mode is chosen.
- **Profile page** — signed-in users get account details, a per-mode/difficulty progress matrix rendered as **circular progress rings** (level initial / ✔ completed / 🔒 locked, color-coded by level) with level unlocks, session/play-time stats, the leaderboard card, and a **reset-progress** control (a three-step confirmation that clears level progress back to zero, with an option to also archive your score/attempt history).
- **Per-level progress reports** — every answered question is recorded; each mode+level's report shows best %, a per-question breakdown (✓/✗/○, tries, accuracy), mastered count, and unlock hints. Levels unlock per mode: **Easy** and **Medium** are always available, **Hard** unlocks once both reach 75%, and **All Levels** (the full per-mode bank mixed) unlocks after all three hit 75% — locks are also surfaced on the Profile progress matrix.
- **Progress tracking** — per-user progress is persisted to Postgres (per-question attempts, completed levels, and best scores).
- **SQL Learning book** — `/academy` is a path-based reader for a written SQL course: `/academy` picks a language, `/academy/sql` shows the contents, and `/academy/sql/:chapterSlug` opens a chapter. Eight chapters, forty written sections, all about one small shop schema (`customers` / `products` / `orders` / `reviews`), so every example runs against the same database the reader is already looking at. Chapters render on warm "paper" with theory prose, dark SQL consoles, result tables, flow and join diagrams, a per-chapter mistakes list, and a cheatsheet.
- **Section quizzes** — every one of the 40 sections ends with a "Check yourself" multiple-choice set (87 questions in total). Answers are persisted per question id in a third progress bucket, so a returning reader skips what they have already proved, and a wrong answer always reveals the correct one rather than dead-ending. Questions with a chapter link also get a **Ch N · Title** pill in the quiz and practice cards, and the chapter footer deep-links to the matching practice topic.

## Tech Stack

- [React](https://react.dev) 19 + [Vite](https://vite.dev)
- [react-router-dom](https://reactrouter.com) for routing
- [sql.js](https://sql.js.org/) — SQLite compiled to WebAssembly, run in a Web Worker for query checking
- [Supabase](https://supabase.com) — Auth + Postgres (leaderboard, progress, profiles)
- [Tailwind CSS](https://tailwindcss.com) 4 for styling
- [Oxlint](https://oxc.rs) for linting

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Supabase setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Enable **Email/Password** under *Authentication → Providers* (and **Google** for social sign-in).
3. Create the schema by applying the migrations in the Supabase SQL editor:
   - `profiles`, `scores`, `user_progress` tables with Row-Level Security and grants
   - a `handle_new_user` trigger that auto-creates a profile on sign-up
   - a `scores_set_username` trigger that fills `scores.username` from the profile, so a score never lands as `Anonymous`
   - `password_resets` (single-use, hashed reset codes) with restrictive deny policies
4. Deploy the auth control plane: `supabase functions deploy auth`, then set the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets on it (signup/reset call the Admin API).
5. Copy `.env.example` to `.env` and fill in your project URL and publishable API key (from *Project Settings → API*):

```bash
copy .env.example .env
```

### Run the dev server

```bash
npm run dev
```

## Scripts

| Command                | Description                                  |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start the Vite dev server                    |
| `npm run build`        | Build the production bundle to `dist/`       |
| `npm run preview`      | Preview the production build locally         |
| `npm run lint`         | Run oxlint                                   |

### Data validation scripts

| Command                               | Description                                   |
| ------------------------------------- | --------------------------------------------- |
| `node scripts/verify-answers.mjs`     | Verify every bug question's `fixedQuery` produces its `expected` output |
| `node scripts/verify-engine.mjs`      | Exercise the quiz engine (timers, extra time) |
| `node scripts/verify-schemas.mjs`     | Validate question schemas                     |
| `node scripts/verify-lessons.mjs`     | Run every book example and quiz answer key against sql.js |
| `node scripts/browser-quiz.mjs`      | Run a full quiz loop in headless Chrome |
| `node scripts/browser-sql-flow.mjs`  | Check the SQL quiz start flow (mode and level cards) |
| `node scripts/browser-routes.mjs`     | Check every route loads without a console error |
| `node scripts/browser-signup.mjs`     | Check the signup flow in headless Chrome |

The `browser-*.mjs` scripts start their own dev server and drive Chrome over the DevTools protocol. They expect Chrome at the default Windows path and port 5173 to be free, so adjust the constants at the top before running them elsewhere.

`verify-lessons.mjs` is the book check. It runs each chapter's SQL on a fresh database per block, asserts the expected rows, confirms documented failures really fail, and verifies the section quizzes: every answer key, every option listed in `distractorIndices` (which must error), and the requirement that **all 40 sections have questions**. Run it from the repo root so it can resolve `sql.js` and the ESM source.

## Deploy

Hosted on Vercel. `vercel.json` sets the build command, the output directory, and a catch-all rewrite to `index.html` so client-side routes work on a hard refresh.

```bash
npx vercel          # preview deployment
npx vercel --prod   # production deployment
```

## Project Structure

```
src/
├── App.jsx                 # Route definitions
├── components/             # Layout, Home, Leaderboard, quiz widgets
│   ├── academy/            # Book reader: BookGate, Chapter bits, SectionQuiz, Cheatsheet
│   └── quiz/               # ModeSelect, QuestionCard, SchemaPanel, SqlEditor, etc.
├── context/AuthContext.jsx # Supabase auth state
├── data/academy/           # Book data: chapter prose, shared schema, section quizzes
│   ├── chapters/           # ch01-reading-data.js … ch08-ctes-windows.js
│   └── questions/          # ch01-questions.js … ch08-questions.js
├── data/sql/               # Question banks + shared schemas
├── engine/                 # QuizEngine, QueryRunner, AnswerChecker, SQL worker
├── hooks/
├── lib/                    # supabase client, auth, leaderboard, attempts, progress
└── pages/                  # SqlQuiz, Auth, Profile, LevelReport, Academy, Chapter
```

### How query checking works

`src/engine/sql.worker.js` runs sql.js in a Web Worker. Player queries are executed in the worker, and `AnswerChecker.js` compares the result set against the expected answer (column names are ignored, order-insensitive).

## Notes

- Question bank metadata lives in `src/data/sql/index.js`; the current default schema is `store`.
- The book's quizzes are plain data keyed by section id, so chapter files stay prose. A question may carry a `check` (proved by the verifier, never rendered) and `distractorIndices` (options that must fail to run). Both are machine-checked, so an answer key or a trap that stops being true fails the build rather than teaching a falsehood.
- Book progress is local-only under `dbquiz:academy-progress`; section keys are namespaced as `${chapterSlug}--${sectionId}`.
- `QA` and `wdata/` contain scratch/QA material — not part of the app. `wdata/*.mjs` have syntax errors and will make a repo-wide lint fail; lint `src` and `scripts` instead.
