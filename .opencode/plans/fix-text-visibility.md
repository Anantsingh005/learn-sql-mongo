# Plan: Make all text visible (contrast fix)

Approved scope: all 6 phases. Gradient H1s keep the gradient, but with dark stops.

Design tokens (src/index.css): `--color-ink #102a43`, `--color-body #243b53`, `--color-muted #556d85`,
`brand-400 #5b8dfa`, `brand-500 #2f6ad0`, `brand-600 #1554c7`, `brand-700 #1449a3`, `brand-800 #143c84`,
`leaf-500 #2f7a4f`, `leaf-600 #3d7f55`, `leaf-700 #316644`, `plum-400 #9575e0`, `plum-600 #6b46c9`,
`plum-700 #573499`, `danger-500 #c93c3c`, `danger-600 #b03333`, `danger-700 #a32e2e`.

---

## Phase 1 — white-on-white text → `text-ink` (or `text-body`)

All of these sit on `bg-white` / `bg-brand-50` / `bg-line`.

| File | Line | Change |
|---|---|---|
| `src/pages/Practice.jsx` | 331 | `text-white` → `text-ink` ("MongoDB Practice") |
| `src/pages/Practice.jsx` | 362 | `text-white` → `text-ink` ("Pick your practice") |
| `src/pages/Practice.jsx` | 393 | `text-white` → `text-ink` (percent) |
| `src/pages/Practice.jsx` | 396 | `text-white` → `text-ink` (question count) |
| `src/pages/LevelReport.jsx` | 62 | `accent ?? 'text-white'` → `accent ?? 'text-ink'` |
| `src/pages/LevelReport.jsx` | 116 | `text-white` → `text-ink` ("Unknown level") |
| `src/pages/LevelReport.jsx` | 243 | `text-white` → `text-ink` ("Question breakdown") |
| `src/pages/Chapter.jsx` | 265 | `text-white` → `text-ink` ("Chapter not found") |
| `src/components/quiz/ResultScreen.jsx` | 82 | `text-white` → `text-ink` (grade letter) |
| `src/components/quiz/LevelSelect.jsx` | 94 | `text-white` → `text-ink` (level label, card is `bg-white`) |
| `src/components/Leaderboard.jsx` | 110 | `'font-semibold text-white'` → `'font-semibold text-ink'` (row is `bg-brand-50`) |
| `src/components/Leaderboard.jsx` | 337 | `text-white` → `text-ink` (username in `bg-brand-50` callout) |
| `src/components/admin/AdminTable.jsx` | 214 | `text-white` → `text-ink` (panel h3) |
| `src/components/admin/OverviewPanel.jsx` | 17 | `text-white` → `text-ink` (StatCard value) |
| `src/components/admin/OverviewPanel.jsx` | 53 | `text-white` → `text-ink` (h3, same pattern as QuestionsPanel) |
| `src/components/admin/DataFlowPanel.jsx` | 90 | `text-white` → `text-ink` (h3) |
| `src/components/admin/QuestionsPanel.jsx` | 17, 38, 66, 78, 95 | `text-white` → `text-ink` |
| `src/components/academy/SectionQuiz.jsx` | 205, 248 | `strongClass="font-semibold text-white"` → `"font-semibold text-body"` |

NOT a bug (do not touch): `Header.jsx:209` CTA, `Footer.jsx` buttons, `Logo.jsx`, `Hero.jsx:144`,
`QuestionCard.jsx:32`, `Auth.jsx:328/337` tabs, `Leaderboard.jsx:225` — all `text-white` on
saturated `bg-brand-600` (6.7:1, passes).

## Phase 2 — 6 invisible gradient H1s → dark gradient

Identical class string in all six; replace the stops only:

`bg-gradient-to-r from-brand-50 via-brand-50 to-plum-50 bg-clip-text ... text-transparent`
→ `bg-gradient-to-r from-brand-700 via-brand-600 to-plum-600 bg-clip-text ... text-transparent`

Contrast vs white: brand-700 #1449a3 ≈ 7.6:1, brand-600 #1554c7 ≈ 6.7:1, plum-600 #6b46c9 ≈ 5.9:1 — all pass AA.

Files: `src/pages/Practice.jsx:280`, `src/components/Leaderboard.jsx:206`,
`src/components/academy/BookGate.jsx:11`, `src/components/academy/SqlBook.jsx:120`,
`src/components/quiz/LevelSelect.jsx:144`, `src/components/quiz/ModeSelect.jsx:65`.

⚠ These use `background-clip:text` + `color:transparent` (zero fallback). Re-run
`scripts/browser-visual.mjs` (unpainted-text rule) and `scripts/browser-design.mjs` after editing.

## Phase 3 — accent buttons: `text-ink` → `text-white`

Inline `style={{ background: accent }}` / `chapter.accent` saturates; white passes ≥4.5:1 on every accent.

- `src/components/academy/SectionQuiz.jsx:290` — Check answer button: `text-ink` → conditional
  `${picked === null ? 'text-white' : 'text-ink'}` (bg is `#243b53` when disabled — currently 1.27:1)
- `src/components/academy/SectionQuiz.jsx:299` — Next question: `text-ink` → `text-white`
- `src/pages/Chapter.jsx:143` — Practise: `text-ink` → `text-white`
- `src/pages/Chapter.jsx:152` — Next chapter: `text-ink` → `text-white`

## Phase 4 — hover must darken, not lighten

`hover:bg-{brand,danger,leaf}-100` under `text-white` = white on pale (~1.3:1) on hover.
Replace with `hover:bg-brand-700` / `hover:bg-danger-700` / `hover:bg-leaf-700`.

Occurrences (verify each with grep before editing — `hover:bg-*-100` may also appear without `text-white`):
`Practice.jsx:243,377,427,613`, `SqlQuiz.jsx:250`, `Admin.jsx:50`, `Auth.jsx:225,260,287,367`,
`Profile.jsx:367,574,604,623,640,678,706,717,744,934`, `LevelReport.jsx:118,211`,
`Chapter.jsx:271`, `AdminTable.jsx:189,198,201,230,277`, `Leaderboard.jsx:318,342`,
`Feedback.jsx:63`, `GuestBanner.jsx:12`, `ResultScreen.jsx:100`, `SqlEditor.jsx:94`,
`SqlBook.jsx:142`.

## Phase 5 — dark chips / active rows

- `src/components/academy/ChapterOutline.jsx:50` — `#556d85` on `#102a43` (2.73:1) → lighten chip bg (e.g. `bg-body` + `text-brand-200`) or darken text
- `src/components/academy/ChapterOutline.jsx:30` and `:60` — `bg-line/70 text-white` (≈1.15:1) → `text-ink`
- `src/components/academy/SyntaxMap.jsx:43-45` — `#556d85` on `#102a43` (2.73:1, then `opacity-30`) → lighten
- `src/components/academy/SectionQuiz.jsx:303` — letter badge `#556d85` on `#243b53` (2.14:1) → lighter tone
- `src/components/academy/SectionQuiz.jsx:359,368` — accent-button states if present (covered by Phase 3 pattern)

## Phase 6 — harden `scripts/browser-contrast.mjs`

1. Add `/academy/sql/:slug` chapter routes to `ROUTES` (currently excluded → ChapterOutline, SectionQuiz, SyntaxMap never audited).
2. Simulate hover on interactive elements before measuring (catches Phase 4 class).
3. Stop skipping elements whose ancestor has `opacity < 1` — factor opacity into the effective colour instead.
4. Keep the `background-clip:text` skip, but add a companion static check: fail if a `text-transparent`/`bg-clip-text` heading's gradient stops are all lighter than 4.5:1 vs the page background.
5. Add a static grep gate for `text-white` co-occurring with `bg-{white,line,mist,shell,*-50,*-100}` in one class string.

## Verification

1. `npm run lint` (oxlint)
2. Grep: no remaining `text-white` on light surfaces (Phase 1/2 list empty)
3. `npm run dev` then `node scripts/browser-contrast.mjs` → 0 failures
4. `node scripts/browser-visual.mjs` → no `unpainted-text` regressions
5. `node scripts/browser-design.mjs` → all 333+ checks pass
6. `npm run build` succeeds

## Status

Planning complete; **execution blocked by plan-mode permissions** (edit tool denied for all
non-plan files). Run this plan after leaving plan mode.
