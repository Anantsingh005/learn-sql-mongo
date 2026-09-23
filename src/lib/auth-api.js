import { supabase } from './supabase.js'

const GENERIC = 'Auth service is temporarily unavailable. Please try again.'

async function messageFrom(error) {
  if (error?.context && typeof error.context.json === 'function') {
    try {
      const body = await error.context.json()
      return body?.error ?? body?.msg ?? body?.message ?? GENERIC
    } catch {
      return GENERIC
    }
  }
  if (error?.context && typeof error.context === 'object' && error.context?.error) {
    return error.context.error
  }
  if (error?.message && error.message === 'Failed to send a request to the Edge Function') {
    return 'Could not reach the auth service. Check your connection and try again.'
  }
  if (error?.message) return error.message
  return GENERIC
}

export async function callAuth(action, payload) {
  if (!supabase) return { data: null, error: { message: 'Supabase is not configured.' } }
  try {
    const { data, error } = await supabase.functions.invoke('auth', {
      body: { action, ...payload },
    })
    if (error) {
      const message = await messageFrom(error)
      return { data: null, error: { message } }
    }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: { message: err?.message ?? GENERIC } }
  }
}

export async function authSignUp({ email, password, username, name }) {
  return callAuth('signup', { email, password, username, name })
}

export async function authRequestReset(email) {
  return callAuth('reset', { email })
}

export async function authCompleteReset({ email, code, password }) {
  return callAuth('complete-reset', { email, code, password })
}

export default { callAuth, authSignUp, authRequestReset, authCompleteReset }