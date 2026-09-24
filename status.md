# Project Status

Last updated: 2026-09-24

## Current session: per-level SQL progress reports + profile leaderboard

**Per-level progress reports (SQL game):**
- **DB (migration `create_question_attempts`):** `public.question_attempts` — per-question result log: `user_id → auth.users` (ON DELETE CASCADE), `game` (default `'sql'`), `mode` CHECK (`mc`/`write`/`bug`), `difficulty` CHECK (`easy`/`medium`/`hard`), `question_id`, `correct bool`, `created_at`. Index `(user_id, game, mode, difficulty, question_id, created_at desc)`. RLS: owners insert/select/delete own rows; admins select/delete (`private.is_admin()`). Grants tightened to anon/authenticated/service_role + sequence usage.
- `src/lib/attempts.js` (NEW) — `saveAttempts(userId, { game, mode, attempts })` batch-inserts every answered question on quiz finish (using each question's own `difficulty`, so mixed "All Levels" runs bucket into the correct report level); `fetchAttempts(userId, { game, mode, difficulty })` feeds the report.
- `src/pages/SqlQuiz.jsx` — on `finished`, records attempts in parallel with the existing score/progress saves (signed-in only). Added deep-link support: `/quiz/sql?mode=mc&level=easy` auto-starts that mode+level (`quizModes` exported from `ModeSelect.jsx`); guests may only deep-link to `easy` (other levels ignored).
- `src/pages/LevelReport.jsx` (NEW, route `/profile/report/:mode/:level`) — per-level report: status pill, best %, per-question breakdown across the full question bank of that mode+level (✓/✗/○, tries, accuracy), mastered count, unlock hints, and a "Play this level" button deep-linking back into the quiz. Profile matrix cells link into it.
- Attempts only accrue from now on — historic runs have no per-question data; the report notes this when `attempts.length === 0 && bestPct > 0`.

**Leaderboard card on Profile:**
- `src/pages/Profile.jsx` — new "Leaderboard" card (dark, matching the level cards) after the SQL progress grid: top 10 SQL scores with rank badges (#1 gold / #2 silver / #3 bronze), username, score, time; the signed-in user's row is highlighted (indigo + "you" chip), and if they rank outside the top 10 a highlighted row shows their overall rank. "View all →" → `/leaderboard`.
- `src/lib/leaderboard.js` — `fetchTopScores` now also selects `user_id`; new `fetchPlayerSnapshot(game, userId, top)` = top-10 rows + the user's best submission + exact overall rank (count of strictly-better rows using the same `score DESC, time_seconds ASC` tiebreak, via a `count: 'exact'` head query). No schema changes — `scores` is already publicly readable.

**Practice & sessions (per-game breakdown):**
- The single 4-stat row + "N SQL · N Mongo submissions" footnote is replaced with two level-card-style cards (SQL / Mongo), each showing sessions, total play time, average score, and best score for that game only (was previously blended across all games). Computed client-side from the already-fetched `scores.rows` via a small `gameStats(rows, game)` helper — no new queries; removed the now-unused `Stat` component and global `stats` from `Profile.jsx`.

**Verified:** `npm run build` clean (chunk-size warning only) · `npx oxlint` only pre-existing warnings + `wdata/*.mjs` junk · `question_attempts` schema + RLS policies confirmed via `pg_policies` · security advisors clean.

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
- Level progress reports + leaderboard card (see Current session): `question_attempts` table + RLS, `attempts.js`, `LevelReport.jsx`, deep-link quiz start, Profile matrix links, top-10 leaderboard with your overall rank.
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
- `storeSchema` rows used by MC questions referencing schema `'store'`; MC cards intentionally don't show the schema panel.
- `StartScreen.jsx` is dead code (not imported anywhere).
- Timer validated with a simulated-clock test; no automated test file exists.
- Password reset currently returns a dev 6-digit code shown on screen (no email; no SMTP configured). Accounts are therefore not actually email-verified until a mailer (e.g. Resend) is wired to email the code + confirm-email on signup.
- Edge Function secrets `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` must be set on the `auth` function (they are, and verified live); without them the function returns a 503 `needsConfig` error.
- Hard/All levels + hints + extra time are gated for guests by design.
- `question_attempts` only records results from now on — pre-existing best %s have no per-question breakdown (report shows a note for that case).

## Bash/QoL Notes
- This env is Windows PowerShell 5.1; use `;` or `if ($?)` (no `&&`). `rg` is NOT installed — use the Grep tool.
- Lint: `npx oxlint`; Build: `npm run build`; Data validation: `node scripts/verify-answers.mjs`.