# Project Status

Last updated: 2026-09-23

## Current session: guest gating, auth UX fixes, signup fields, QA

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
- plus uncommitted working-tree changes: guest gating, GuestBanner, reset flow, debug logging, URL-view sync.

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
- Guest gating + progress dots + reset flow + debug logging (see Current session).
- `src/data/sql/fixBug.js`: 68 questions (33 easy / 16 medium / 21 hard + 2 windowCte). Every question has `buggyQuery`, `fixedQuery`, inline schema, `expected`, `hint`, `explanation`.
- `scripts/verify-answers.mjs`: NULL-aware schema builder and `q.fixedQuery` fallback. Latest run: **71 match · 0 mismatch**.
- `src/engine/QuizEngine.js`: per-question timer + extra time (gate-based pause); snapshot exposes `extraTimePending`, `extraTimeSeconds`.
- `src/components/quiz/SchemaPanel.jsx` (NEW), `HintReveal.jsx` (NEW), `QuestionCard.jsx` renders both for `write`/`bug`.
- `src/data/sql/writeQuery.js`: easy placeholder prompts replaced; no placeholders remain.

### Verified since last change
- `npm run build` → success (only chunk-size warning).
- `npx oxlint src` → no errors (pre-existing warnings only + unrelated `wdata/*.mjs` junk).

## Key Technical Facts
- SQLite (sql.js) does NOT support `> ALL (subquery)` — use `> (SELECT MAX(...) ...)`.
- `checkAnswer` compares column COUNT (names ignored), so aliases are not required.
- `resolveSchema(schema)` in `src/engine/queryCheck.js` maps `'store'` → `storeSchema`, object → as-is.
- Question banks in `src/data/sql/`: `index.js` → `allSqlQuestions` = multipleChoice + writeQuery + fixBug + windowCte.
- `scripts/gen-fixbug.mjs` was generated then **deleted** — do NOT regenerate; `fixedQuery` is the source of truth.
- Supabase repeated-signup returns HTTP 200 with `user:null`/`identities:[]` — client must treat that as "email already registered", not success.
- Supabase email-send rate limit (`over_email_send_rate_limit`, 429) is server-side and auto-resets (~1h).

## Known Deviations / To-Dos
- `wdata/*.mjs` are leftover scratch files with syntax errors — ignore them.
- `storeSchema` rows used by MC questions referencing schema `'store'`; MC cards intentionally don't show the schema panel.
- `StartScreen.jsx` is dead code (not imported anywhere).
- Timer validated with a simulated-clock test; no automated test file exists.
- "Forgot password" requires a configured "Confirm email" flow + the email rate-limit window to be clear; if a reset email is rate-limited, the UI shows the wait message.
- Hard/All levels + hints + extra time are gated for guests by design.

## Bash/QoL Notes
- This env is Windows PowerShell 5.1; use `;` or `if ($?)` (no `&&`). `rg` is NOT installed — use the Grep tool.
- Lint: `npx oxlint`; Build: `npm run build`; Data validation: `node scripts/verify-answers.mjs`.