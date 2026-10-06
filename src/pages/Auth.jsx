import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { debugLog, debugError } from '../lib/debug.js'

const USERNAME_RE = /^[A-Za-z0-9_.-]{1,24}$/

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-full border border-line bg-white px-4 py-2 text-sm text-ink placeholder-muted outline-none transition-colors focus:border-brand-200"
      />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

function AuthPage() {
  const { configured, user, loading, signInWithPassword, signUpWithPassword, signInWithGoogle, requestPasswordReset, updatePassword, completePasswordReset, signOut } = useAuth()
  const [params] = useSearchParams()
  const [mode, setMode] = useState(() => {
    const m = params.get('mode')
    if (m === 'reset') return 'reset'
    return m === 'signup' ? 'signup' : 'signin'
  })
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetStep, setResetStep] = useState('email')
  const [issuedCode, setIssuedCode] = useState(null)
  const [resetCodeInput, setResetCodeInput] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(() =>
    params.get('notice') === 'password-updated' ? 'Password updated. Sign in with your new password.' : null
  )
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const m = params.get('mode')
    setMode(m === 'signup' ? 'signup' : m === 'reset' ? 'reset' : 'signin')
    if (params.get('notice') === 'password-updated') {
      setMessage('Password updated. Sign in with your new password.')
    }
  }, [params])

  const handleRequestReset = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)
    debugLog('reset request →', resetEmail.trim())
    const { code: devCode, error: err } = await requestPasswordReset(resetEmail)
    setBusy(false)
    if (err) {
      debugError('reset request error →', err.message)
      setError(err.message)
      return
    }
    if (!devCode) {
      setError('No account found for that email.')
      return
    }
    setIssuedCode(devCode)
    setResetStep('code')
    setMessage(`A reset code was prepared${devCode ? ' (shown below)' : ''}.`)
  }

  const handleCompleteReset = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (resetCodeInput.trim().length !== 6) {
      setError('Enter the 6-digit reset code.')
      return
    }
    if (resetPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    setBusy(true)
    debugLog('complete reset →', resetEmail.trim())
    const { error: err } = await completePasswordReset(resetEmail, resetCodeInput.trim(), resetPassword)
    setBusy(false)
    if (err) {
      debugError('complete reset error →', err.message)
      setError(err.message)
      return
    }
    debugLog('password reset → signing in')
    navigate('/auth?notice=password-updated')
  }

  const handleSetNewPassword = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (resetPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    setBusy(true)
    debugLog('set new password →')
    const { error: err } = await updatePassword(resetPassword)
    setBusy(false)
    if (err) {
      debugError('update password error →', err.message)
      setError(err.message)
      return
    }
    debugLog('password updated → signing out')
    await signOut()
    navigate('/auth?notice=password-updated')
  }

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
    debugLog('submit auth →', mode, email.trim())
    const action = mode === 'signin' ? signInWithPassword : signUpWithPassword
    const payload = mode === 'signin' ? [email.trim(), password] : [username, name, email.trim(), password]
    const { error: err, data } = await action(...payload)
    setBusy(false)
    if (err) {
      debugError('submit auth error →', err.message, { email: email.trim() })
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
    debugLog('google button clicked →')
    const { error: err } = await signInWithGoogle()
    setBusy(false)
    if (err) {
      debugError('google button error →', err.message)
      setError(err.message)
    }
  }

  if (!configured) {
    return (
      <div className="relative mx-auto max-w-md overflow-hidden rounded-[2rem] border border-line bg-white p-8 text-center">
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full border border-brand-200" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full border border-plum-200" />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-brand-200 bg-gradient-to-br from-brand-100 to-plum-100 text-xl font-black text-brand-700 shadow-[0_2px_10px_rgba(#1554c7,0.22)]">
          DB
        </div>
        <h1 className="mt-4 font-mono text-2xl font-bold text-ink">Sign up / Sign in</h1>
        <p className="mt-4 text-sm text-muted">
          Supabase is not configured. Add <span className="font-mono">VITE_SUPABASE_URL</span> and{' '}
          <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> to{' '}
          <span className="font-mono">.env</span>, then reload.
        </p>
      </div>
    )
  }

  if (mode === 'reset') {
    return (
      <div className="mx-auto max-w-md">
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-white p-8">
          <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full border border-brand-200" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full border border-plum-200" />
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-brand-200 bg-gradient-to-br from-brand-100 to-plum-100 text-xl font-black text-brand-700 shadow-[0_2px_10px_rgba(#1554c7,0.22)]">
              DB
            </div>
            <h1 className="mt-4 font-mono text-2xl font-bold text-ink">
              {user ? 'Set a new password' : 'Reset your password'}
            </h1>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-muted">Loading…</p>
          ) : user ? (
            <form onSubmit={handleSetNewPassword} className="mt-6 flex flex-col gap-4">
              <Field
                label="New password"
                type="password"
                value={resetPassword}
                onChange={setResetPassword}
                placeholder="••••••••"
                autoComplete="new-password"
                hint="At least 6 characters long."
              />
              {error && <p className="text-sm text-danger-600">{error}</p>}
              <button
                type="submit"
                disabled={busy || resetPassword.length < 6}
                className="rounded-full bg-brand-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? 'Working…' : 'Update password'}
              </button>
            </form>
          ) : resetStep === 'code' ? (
            <form onSubmit={handleCompleteReset} className="mt-6 flex flex-col gap-4">
              {issuedCode && (
                <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
                  Dev preview — no email is sent yet. Your code:{' '}
                  <span className="font-mono font-bold">{issuedCode}</span>
                </div>
              )}
              <Field
                label="Reset code"
                type="text"
                value={resetCodeInput}
                onChange={setResetCodeInput}
                placeholder="6 digits"
                autoComplete="one-time-code"
              />
              <Field
                label="New password"
                type="password"
                value={resetPassword}
                onChange={setResetPassword}
                placeholder="••••••••"
                autoComplete="new-password"
                hint="At least 6 characters long."
              />
              {error && <p className="text-sm text-danger-600">{error}</p>}
              {message && <p className="text-sm text-leaf-600">{message}</p>}
              <button
                type="submit"
                disabled={busy || resetCodeInput.trim().length !== 6 || resetPassword.length < 6}
                className="rounded-full bg-brand-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? 'Working…' : 'Set new password'}
              </button>
              <button
                type="button"
                onClick={() => setResetStep('email')}
                className="text-sm text-muted transition-colors hover:text-body"
              >
                ← Request a new code
              </button>
            </form>
          ) : (
            <form onSubmit={handleRequestReset} className="mt-6 flex flex-col gap-4">
              <Field
                label="Email"
                type="email"
                value={resetEmail}
                onChange={setResetEmail}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {error && <p className="text-sm text-danger-600">{error}</p>}
              {message && <p className="text-sm text-leaf-600">{message}</p>}
              <button
                type="submit"
                disabled={busy || !resetEmail.trim()}
                className="rounded-full bg-brand-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? 'Working…' : 'Send reset code'}
              </button>
            </form>
          )}

          <div className="my-5 h-px bg-line" />
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="text-sm text-muted transition-colors hover:text-body"
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="relative overflow-hidden rounded-[2rem] border border-line bg-white p-8">
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full border border-brand-200" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full border border-plum-200" />
        <div className="pointer-events-none absolute -top-8 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full border border-brand-200" />

        <div className="relative flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-brand-200 bg-gradient-to-br from-brand-100 to-plum-100 text-xl font-black text-brand-700 shadow-[0_2px_10px_rgba(#1554c7,0.22)]">
            DB
          </div>
          <h1 className="mt-4 font-mono text-2xl font-bold text-ink">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h1>
        </div>

        <div className="relative mt-6 flex rounded-full bg-white p-1 text-sm">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); setMessage(null) }}
            className={`flex-1 rounded-full px-3 py-1.5 font-medium transition-colors ${
              mode === 'signin' ? 'bg-brand-600 text-white' : 'text-muted hover:text-body'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); setMessage(null) }}
            className={`flex-1 rounded-full px-3 py-1.5 font-medium transition-colors ${
              mode === 'signup' ? 'bg-brand-600 text-white' : 'text-muted hover:text-body'
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
          {mode === 'signin' && (
            <button
              type="button"
              onClick={() => navigate('/auth?mode=reset')}
              className="-mt-1 self-end text-xs font-medium text-muted transition-colors hover:text-brand-700"
            >
              Forgot your password?
            </button>
          )}
          {error && <p className="text-sm text-danger-600">{error}</p>}
          {message && <p className="text-sm text-leaf-600">{message}</p>}
          <button
            type="submit"
            disabled={busy || !email || !password || (mode === 'signup' && (!username || !name))}
            className="rounded-full bg-brand-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-body">
          <span className="h-px flex-1 bg-line" />
          or
          <span className="h-px flex-1 bg-line" />
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={google}
          className="w-full rounded-full border border-line px-5 py-2 text-sm font-semibold text-body transition-colors hover:bg-line disabled:opacity-40"
        >
          Continue with Google
        </button>
      </div>
    </div>
  )
}

export default AuthPage