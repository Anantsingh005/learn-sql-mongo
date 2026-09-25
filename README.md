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
- **Auth & leaderboard** — Supabase Auth (email/password + Google) for sign-in; signed-in users submit scores to a public leaderboard. Signup/password-reset go through a custom Edge Function (`supabase/functions/auth`) that uses the Admin API, so no confirmation emails are sent and the hosted email rate limit can't be hit.
- **Categorized leaderboards** — boards scoped by mode (**MC / Write / Fix Bug / Global**) and difficulty (**Easy / Medium / Hard / All Levels**), on both the standalone `/leaderboard` page and a Profile card that defaults to your most recent category. Rows are ranked by **points → lives left → fastest time**, and signed-in players see their exact rank in the active category even when they're outside the top 10.
- **Profile page** — signed-in users get account details, a per-mode/difficulty progress matrix rendered as **circular progress rings** (level initial / ✔ completed / 🔒 locked, color-coded by level) with level unlocks, session/play-time stats, the leaderboard card, and a **reset-progress** control (a three-step confirmation that clears level progress back to zero, with an option to also archive your score/attempt history).
- **Per-level progress reports** — every answered question is recorded; each mode+level's report shows best %, a per-question breakdown (✓/✗/○, tries, accuracy), mastered count, and unlock hints. Levels unlock per mode: **Easy** and **Medium** are always available, **Hard** unlocks once both reach 75%, and **All Levels** (the full per-mode bank mixed) unlocks after all three hit 75% — locks are also surfaced on the Profile progress matrix.
- **Progress tracking** — per-user progress is persisted to Postgres (per-question attempts, completed levels, and best scores).

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

## Project Structure

```
src/
├── App.jsx                 # Route definitions
├── components/             # Layout, Home, Leaderboard, quiz widgets
│   └── quiz/               # ModeSelect, QuestionCard, SchemaPanel, SqlEditor, etc.
├── context/AuthContext.jsx # Supabase auth state
├── data/sql/               # Question banks + shared schemas
├── engine/                 # QuizEngine, QueryRunner, AnswerChecker, SQL worker
├── hooks/
├── lib/                    # supabase client, auth, leaderboard, attempts, progress
└── pages/                  # SqlQuiz, Auth, Profile, LevelReport
```

### How query checking works

`src/engine/sql.worker.js` runs sql.js in a Web Worker. Player queries are executed in the worker, and `AnswerChecker.js` compares the result set against the expected answer (column names are ignored, order-insensitive).

## Notes

- Question bank metadata lives in `src/data/sql/index.js`; the current default schema is `store`.
- `QA` and `wdata/` contain scratch/QA material — not part of the app.
