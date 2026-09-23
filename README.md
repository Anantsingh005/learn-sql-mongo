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
- **Hints** — collapsible "Show hint" toggle on Write and Bug questions.
- **Question bank** (see `src/data/sql/`):
  - `multipleChoice.js` — multiple-choice questions
  - `writeQuery.js` — free-form query questions
  - `fixBug.js` — buggy-query questions (every entry includes a verified `fixedQuery`)
  - `windowCte.js` — window functions and CTEs
  - `schemas.js` — shared in-browser schemas (e.g. `store`)
- **Auth & leaderboard** — Supabase Auth (email/password + Google) for sign-in; signed-in users submit scores to a public leaderboard.
- **Progress tracking** — per-user progress is persisted to Postgres.

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
4. Copy `.env.example` to `.env` and fill in your project URL and publishable API key (from *Project Settings → API*):

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
├── lib/                    # supabase client, auth, leaderboard, progress
└── pages/                  # SqlQuiz, Auth
```

### How query checking works

`src/engine/sql.worker.js` runs sql.js in a Web Worker. Player queries are executed in the worker, and `AnswerChecker.js` compares the result set against the expected answer (column names are ignored, order-insensitive).

## Notes

- Question bank metadata lives in `src/data/sql/index.js`; the current default schema is `store`.
- `QA` and `wdata/` contain scratch/QA material — not part of the app.
