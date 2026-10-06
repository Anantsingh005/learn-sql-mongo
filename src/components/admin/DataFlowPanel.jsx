function Node({ children, accent = 'border-line bg-white' }) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-center text-xs ${accent}`}>
      {children}
    </div>
  )
}

function Flow({ actor, path }) {
  return (
    <div className="rounded-xl border border-line bg-white/40 p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{actor}</div>
      <div className="flex flex-wrap items-center gap-2">
        {path.map((step, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            {i > 0 && <span className="text-body">→</span>}
            <Node accent={step.accent}>{step.label}</Node>
          </div>
        ))}
      </div>
    </div>
  )
}

const STORES = [
  { name: 'profiles', role: 'Owner CRUD + admin CRUD · auto-created by handle_new_user trigger' },
  { name: 'scores', role: 'Public read · owner insert · admin CRUD' },
  { name: 'user_progress', role: 'Owner CRUD · admin CRUD · guests use localStorage instead' },
  { name: 'admins', role: 'Admins only (private.is_admin()) · grants dashboard access' },
]

export default function DataFlowPanel() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line bg-white p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted">System shape</div>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The React app talks to Supabase Postgres with the publishable key — every query is filtered by Row-Level
          Security. Question banks and the SQLite quiz engine live entirely in the browser; only auth, scores,
          progress, and profiles touch the database.
        </p>
      </div>

      <Flow
        actor="Guest (not signed in)"
        path={[
          { label: 'Play quiz in browser', accent: 'border-brand-200 bg-white/40' },
          { label: 'localStorage · dbquiz.progress', accent: 'border-line bg-white' },
          { label: 'No server writes', accent: 'border-line bg-white' },
        ]}
      />

      <Flow
        actor="Signed-in player"
        path={[
          { label: 'Auth · sign up / in / Google / reset', accent: 'border-leaf-200 bg-white/40' },
          { label: 'auth.users', accent: 'border-line bg-white' },
          { label: 'trigger handle_new_user', accent: 'border-line bg-white' },
          { label: 'profiles', accent: 'border-leaf-200 bg-white/40' },
        ]}
      />

      <Flow
        actor="Quiz engine"
        path={[
          { label: 'finish a level', accent: 'border-brand-200 bg-white/40' },
          { label: 'scores · insert (leaderboard)', accent: 'border-line bg-white' },
          { label: 'user_progress · upsert (progress)', accent: 'border-line bg-white' },
        ]}
      />

      <Flow
        actor="Public"
        path={[
          { label: 'Leaderboard page', accent: 'border-brand-200 bg-white/40' },
          { label: 'scores · select (RLS public)', accent: 'border-line bg-white' },
        ]}
      />

      <Flow
        actor="Admin (you)"
        path={[
          { label: '/admin dashboard', accent: 'border-brand-200 bg-white/40' },
          { label: 'private.is_admin() RLS gate', accent: 'border-line bg-white' },
          { label: 'CRUD on all tables', accent: 'border-leaf-200 bg-white/40' },
        ]}
      />

      <div className="rounded-xl border border-line bg-white">
        <h3 className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">Supabase tables</h3>
        <ul className="divide-y divide-line/60">
          {STORES.map((t) => (
            <li key={t.name} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-mono text-sm text-body">{t.name}</span>
              <span className="text-xs text-muted">{t.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}