# Database Games

An interactive SQL quiz game built with React + Vite. Players answer SQL questions that are executed against a real in-browser SQLite database (via [sql.js](https://sql.js.org/)), with Firebase powering authentication and a public leaderboard.

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
- **Auth & leaderboard** — Firebase Authentication (email/password) for sign-in; signed-in users can submit scores to a public leaderboard.
- **Progress tracking** — per-user progress is persisted to Firestore.

## Tech Stack

- [React](https://react.dev) 19 + [Vite](https://vite.dev)
- [react-router-dom](https://reactrouter.com) for routing
- [sql.js](https://sql.js.org/) — SQLite compiled to WebAssembly, run in a Web Worker for query checking
- [Firebase](https://firebase.google.com) — Auth, Firestore (leaderboard + progress)
- [Tailwind CSS](https://tailwindcss.com) 4 for styling
- [Oxlint](https://oxc.rs) for linting

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Firebase setup

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com).
2. Enable **Email/Password** auth under *Authentication → Sign-in method*.
3. Create a Firestore database and deploy the security rules from `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

4. Copy `.env.example` to `.env` and fill in your Firebase web app config:

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
├── context/AuthContext.jsx # Firebase auth state
├── data/sql/               # Question banks + shared schemas
├── engine/                 # QuizEngine, QueryRunner, AnswerChecker, SQL worker
├── firebase/               # client, auth, leaderboard, progress
├── hooks/
├── lib/
└── pages/                  # SqlQuiz, Auth
```

### How query checking works

`src/engine/sql.worker.js` runs sql.js in a Web Worker. Player queries are executed in the worker, and `AnswerChecker.js` compares the result set against the expected answer (column names are ignored, order-insensitive).

## Notes

- Question bank metadata lives in `src/data/sql/index.js`; the current default schema is `store`.
- `QA` and `wdata/` contain scratch/QA material — not part of the app.
