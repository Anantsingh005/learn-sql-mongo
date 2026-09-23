import { supabase } from './supabase.js'
import { debugLog, debugError } from './debug.js'
import { authSignUp, authRequestReset, authCompleteReset } from './auth-api.js'

export const onAuthChange = (callback) => {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null, event)
  })
  return data.subscription.unsubscribe
}

export async function supabaseGetSession() {
  if (!supabase) return { user: null, session: null }
  const { data } = await supabase.auth.getSession()
  return { user: data.session?.user ?? null, session: data.session ?? null }
}

export async function supabaseSignUp({ email, password, username, name }) {
  if (!supabase) return { data: null, error: { message: 'Supabase is not configured.' } }
  debugLog('signUp →', email)
  const res = await authSignUp({ email, password, username, name })
  if (res.error) {
    debugError('signUp blocked →', res.error.message)
    return { data: null, error: { message: res.error.message } }
  }
  debugLog('signUp ok →', res.data?.user?.id, '— starting session')
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })
  if (error) {
    debugError('signUp session failed →', friendlyAuthError(error))
    return { data: null, error: { message: friendlyAuthError(error) } }
  }
  return { data: { user: data.user, session: data.session }, error: null }
}

export async function supabaseSignIn({ email, password }) {
  if (!supabase) return { data: null, error: { message: 'Supabase is not configured.' } }
  debugLog('signIn →', email)
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) {
      debugError('signIn failed →', friendlyAuthError(error), error?.code)
      return { data: null, error: { message: friendlyAuthError(error) } }
    }
    debugLog('signIn ok →', data.user?.id)
    return { data: { user: data.user, session: data.session }, error: null }
  } catch (err) {
    debugError('signIn threw →', err)
    return { data: null, error: { message: friendlyAuthError(err) } }
  }
}

export async function supabaseSignInWithGoogle() {
  if (!supabase) return { data: null, error: { message: 'Supabase is not configured.' } }
  debugLog('google signIn →')
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      debugError('google signIn failed →', friendlyAuthError(error))
      return { data: null, error: { message: friendlyAuthError(error) } }
    }
    debugLog('google redirect →', data?.url)
    if (data?.url) {
      window.location.assign(data.url)
    }
    return { data: { user: null, session: null }, error: null }
  } catch (err) {
    debugError('google signIn threw →', err)
    return { data: null, error: { message: friendlyAuthError(err) } }
  }
}

export async function supabaseSignOut() {
  if (!supabase) return { error: null }
  try {
    const { error } = await supabase.auth.signOut()
    return { error: error ? { message: friendlyAuthError(error) } : null }
  } catch (err) {
    return { error: { message: friendlyAuthError(err) } }
  }
}

export async function supabaseResetPasswordRequest(email) {
  if (!supabase) return { error: { message: 'Supabase is not configured.' } }
  debugLog('resetPassword request →', email)
  const res = await authRequestReset(email)
  if (res.error) {
    debugError('resetPassword request failed →', res.error.message)
    return { error: { message: res.error.message } }
  }
  debugLog('resetPassword code granted →', Boolean(res.data?.code))
  return { code: res.data?.code ?? null, error: null }
}

export async function supabaseCompleteReset(email, code, password) {
  if (!supabase) return { error: { message: 'Supabase is not configured.' } }
  debugLog('completeReset →', email)
  const res = await authCompleteReset({ email, code, password })
  if (res.error) {
    debugError('completeReset failed →', res.error.message)
    return { error: { message: res.error.message } }
  }
  debugLog('completeReset ok →')
  return { error: null }
}

export async function supabaseUpdatePassword(password) {
  if (!supabase) return { error: { message: 'Supabase is not configured.' } }
  debugLog('updatePassword →')
  try {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      debugError('updatePassword failed →', friendlyAuthError(error))
      return { error: { message: friendlyAuthError(error) } }
    }
    debugLog('updatePassword ok →')
    return { error: null }
  } catch (err) {
    debugError('updatePassword threw →', err)
    return { error: { message: friendlyAuthError(err) } }
  }
}

export async function fetchProfile(userId) {
  if (!supabase || !userId) return null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, name, created_at')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw error
    return data ?? null
  } catch (err) {
    console.error('fetchProfile failed:', err)
    return null
  }
}

export async function updateProfileUsername(userId, username) {
  if (!supabase) return { error: { message: 'Supabase is not configured.' } }
  try {
    const { error } = await supabase.from('profiles').update({ username }).eq('id', userId)
    return { error: error ? { message: friendlyAuthError(error) } : null }
  } catch (err) {
    return { error: { message: friendlyAuthError(err) } }
  }
}

function friendlyAuthError(err) {
  const code = err?.code ?? ''
  const fallback = err?.message ?? 'Something went wrong.'
  const map = {
    invalid_credentials: 'Invalid email or password.',
    invalid_grant: 'Invalid email or password.',
    user_already_exists: 'An account with this email already exists.',
    email_exists: 'An account with this email already exists.',
    weak_password: 'Password must be at least 6 characters long.',
    password_too_short: 'Password must be at least 6 characters long.',
    email_not_confirmed: 'Please confirm your email before signing in.',
    email_address_invalid: 'Please enter a valid email address.',
    over_request_rate_limit: 'Too many attempts. Please wait a moment and try again.',
    rate_limit: 'Too many attempts. Please wait a moment and try again.',
    over_email_send_rate_limit: 'Too many sign-up emails from this network. Please wait about an hour and try again.',
    validation_failed: 'Please check your details and try again.',
  }
  if (/provider is not enabled/i.test(fallback)) {
    return 'Google sign-in is not enabled yet. Ask the project owner to enable it in the Supabase dashboard (Authentication → Providers → Google).'
  }
  if (map[code]) return map[code]
  return code ? `${code}: ${fallback}` : fallback
}

export default {
  onAuthChange,
  supabaseSignUp,
  supabaseSignIn,
  supabaseSignInWithGoogle,
  supabaseSignOut,
  supabaseGetSession,
  supabaseResetPasswordRequest,
  supabaseCompleteReset,
}