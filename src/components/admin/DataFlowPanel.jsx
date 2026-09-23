function Node({ children, accent = 'border-slate-700 bg-slate-900' }) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-center text-xs ${accent}`}>
      {children}
    </div>
  )
}

function Flow({ actor, path }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{actor}</div>
      <div className="flex flex-wrap items-center gap-2">
        {path.map((step, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            {i > 0 && <span className="text-slate-600">→</span>}
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
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">System shape</div>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          The React app talks to Supabase Postgres with the publishable key — every query is filtered by Row-Level
          Security. Question banks and the SQLite quiz engine live entirely in the browser; only auth, scores,
          progress, and profiles touch the database.
        </p>
      </div>

      <Flow
        actor="Guest (not signed in)"
        path={[
          { label: 'Play quiz in browser', accent: 'border-indigo-700 bg-indigo-950/40' },
          { label: 'localStorage · dbquiz.progress', accent: 'border-slate-700 bg-slate-900' },
          { label: 'No server writes', accent: 'border-slate-700 bg-slate-900' },
        ]}
      />

      <Flow
        actor="Signed-in player"
        path={[
          { label: 'Auth · sign up / in / Google / reset', accent: 'border-emerald-700 bg-emerald-950/40' },
          { label: 'auth.users', accent: 'border-slate-700 bg-slate-900' },
          { label: 'trigger handle_new_user', accent: 'border-slate-700 bg-slate-900' },
          { label: 'profiles', accent: 'border-emerald-700 bg-emerald-950/40' },
        ]}
      />

      <Flow
        actor="Quiz engine"
        path={[
          { label: 'finish a level', accent: 'border-indigo-700 bg-indigo-950/40' },
          { label: 'scores · insert (leaderboard)', accent: 'border-slate-700 bg-slate-900' },
          { label: 'user_progress · upsert (progress)', accent: 'border-slate-700 bg-slate-900' },
        ]}
      />

      <Flow
        actor="Public"
        path={[
          { label: 'Leaderboard page', accent: 'border-indigo-700 bg-indigo-950/40' },
          { label: 'scores · select (RLS public)', accent: 'border-slate-700 bg-slate-900' },
        ]}
      />

      <Flow
        actor="Admin (you)"
        path={[
          { label: '/admin dashboard', accent: 'border-indigo-700 bg-indigo-950/40' },
          { label: 'private.is_admin() RLS gate', accent: 'border-slate-700 bg-slate-900' },
          { label: 'CRUD on all tables', accent: 'border-emerald-700 bg-emerald-950/40' },
        ]}
      />

      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <h3 className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-white">Supabase tables</h3>
        <ul className="divide-y divide-slate-800/60">
          {STORES.map((t) => (
            <li key={t.name} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-mono text-sm text-slate-200">{t.name}</span>
              <span className="text-xs text-slate-500">{t.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}