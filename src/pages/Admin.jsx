import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useIsAdmin } from '../hooks/useIsAdmin.js'
import { TABLE_META } from '../lib/admin.js'
import AdminTable from '../components/admin/AdminTable.jsx'
import OverviewPanel from '../components/admin/OverviewPanel.jsx'
import QuestionsPanel from '../components/admin/QuestionsPanel.jsx'
import DataFlowPanel from '../components/admin/DataFlowPanel.jsx'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'tables', label: 'Tables' },
  { id: 'questions', label: 'Question bank' },
  { id: 'flow', label: 'Data flow' },
]

const TABLE_TABS = [
  { id: 'profiles', label: 'Profiles', meta: TABLE_META.profiles },
  { id: 'scores', label: 'Scores', meta: TABLE_META.scores },
  { id: 'user_progress', label: 'User progress', meta: TABLE_META.user_progress },
  { id: 'admins', label: 'Admins', meta: TABLE_META.admins },
]

function tabClass(active) {
  return `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    active ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
  }`
}

export default function Admin() {
  const { user } = useAuth()
  const { isAdmin, checking } = useIsAdmin()
  const [tab, setTab] = useState('overview')
  const [table, setTable] = useState('profiles')

  if (checking) {
    return <p className="py-16 text-center text-sm text-slate-500">Checking access…</p>
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold text-white">Admins only</h1>
        <p className="mt-3 text-sm text-slate-400">
          {user
            ? 'You are signed in, but this account is not on the admin list.'
            : 'Sign in with an admin account to open the dashboard.'}
        </p>
        <Link to="/" className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
          Back to home
        </Link>
      </div>
    )
  }

  const activeTable = TABLE_TABS.find((t) => t.id === table) ?? TABLE_TABS[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Full view over the data and data flow — {user?.email ?? 'admin'}.
        </p>
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-slate-800 pb-2">
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} className={tabClass(tab === t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'overview' && <OverviewPanel />}

      {tab === 'tables' && (
        <div className="space-y-4">
          <nav className="flex flex-wrap gap-1">
            {TABLE_TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setTable(t.id)} className={tabClass(table === t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
          <AdminTable key={activeTable.id} meta={activeTable.meta} />
        </div>
      )}

      {tab === 'questions' && <QuestionsPanel />}
      {tab === 'flow' && <DataFlowPanel />}
    </div>
  )
}