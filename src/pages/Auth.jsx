import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const USERNAME_RE = /^[A-Za-z0-9_.-]{1,24}$/

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition-colors focus:border-indigo-500"
      />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

function AuthPage() {
  const { configured, signInWithPassword, signUpWithPassword, signInWithGoogle } = useAuth()
  const [params] = useSearchParams()
  const [mode, setMode] = useState(() => (params.get('mode') === 'signup' ? 'signup' : 'signin'))
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (mode === 'signup') {
      if (!USERNAME_RE.test(username.trim())) {
        setError('Username must be 1–24 characters using letters, numbers, _ . or -.')
        return
      }
      if (!name.trim()) {
        setError('Please enter your name.')
        return
      }
    }
    setBusy(true)
    const action = mode === 'signin' ? signInWithPassword : signUpWithPassword
    const payload = mode === 'signin' ? [email.trim(), password] : [username, name, email.trim(), password]
    const { error: err, data } = await action(...payload)
    setBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    if (mode === 'signup') {
      if (data?.user && !data.session) {
        setMessage('Check your inbox to confirm your email, then sign in.')
        setMode('signin')
        return
      }
      navigate('/')
      return
    }
    navigate('/')
  }

  const google = async () => {
    setError(null)
    setBusy(true)
    const { error: err } = await signInWithGoogle()
    setBusy(false)
    if (err) setError(err.message)
  }

  if (!configured) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <div className="font-mono text-2xl font-bold text-white">Sign up / Sign in</div>
        <p className="mt-4 text-sm text-slate-400">
          Supabase is not configured. Add <span className="font-mono">VITE_SUPABASE_URL</span> and{' '}
          <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> to{' '}
          <span className="font-mono">.env</span>, then reload.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <div className="font-mono text-2xl font-bold text-white">
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </div>

        <div className="mt-4 flex rounded-lg bg-slate-950 p-1 text-sm">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); setMessage(null) }}
            className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
              mode === 'signin' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); setMessage(null) }}
            className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
              mode === 'signup' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          {mode === 'signup' && (
            <>
              <Field label="Username" value={username} onChange={setUsername} placeholder="player99" autoComplete="username" hint="1–24 letters, numbers, _ . -" />
              <Field label="Name" value={name} onChange={setName} placeholder="Your full name" autoComplete="name" />
            </>
          )}
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          {message && <p className="text-sm text-emerald-400">{message}</p>}
          <button
            type="submit"
            disabled={busy || !email || !password || (mode === 'signup' && (!username || !name))}
            className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-600">
          <span className="h-px flex-1 bg-slate-800" />
          or
          <span className="h-px flex-1 bg-slate-800" />
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={google}
          className="w-full rounded-lg border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800 disabled:opacity-40"
        >
          Continue with Google
        </button>
      </div>
    </div>
  )
}

export default AuthPage