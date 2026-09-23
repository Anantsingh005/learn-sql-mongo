import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''

const USERNAME_RE = /^[A-Za-z0-9_.-]{1,24}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage',
}

const admin =
  SERVICE_ROLE && SUPABASE_URL
    ? createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } })
    : null

function needsConfig() {
  if (!admin) {
    return json(503, {
      error: 'Auth service is not configured yet. Add SUPABASE_SERVICE_ROLE_KEY under Edge Functions → Secrets.',
    })
  }
  return null
}

const now = () => Date.now()
const attempts = new Map()

function limited(key, windowMs, max) {
  const cutoff = now() - windowMs
  const hits = (attempts.get(key) ?? []).filter((t) => t > cutoff)
  if (hits.length >= max) return true
  hits.push(now())
  attempts.set(key, hits)
  return false
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

async function hashCode(code) {
  const data = new TextEncoder().encode(`${code}:${SUPABASE_URL}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function findUserIdByEmail(email) {
  let page = 1
  while (page <= 5) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data?.users) return null
    const found = data.users.find((u) => u.email?.toLowerCase() === email)
    if (found) return found.id
    if (data.users.length < 200) break
    page += 1
  }
  return null
}

function friendlyError(err) {
  const code = err?.code ?? ''
  const fallback = err?.message ?? 'Something went wrong.'
  if (code === 'email_exists' || code === 'user_already_exists') {
    return 'An account with this email already exists. Try signing in instead.'
  }
  if (code === 'weak_password' || code === 'password_too_short') {
    return 'Password must be at least 6 characters long.'
  }
  return fallback
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') return json(405, { error: 'Method not allowed.' })

  let body
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Invalid request body.' })
  }

  const action = String(body?.action ?? '')
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (action === 'signup') {
    if (limited(`signup:${ip}`, 60 * 60 * 1000, 10)) {
      return json(429, { error: 'Too many sign-up attempts from this network. Please wait and try again.' })
    }
    const notReady = needsConfig()
    if (notReady) return notReady
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')
    const username = String(body?.username ?? '').trim()
    const name = String(body?.name ?? '').trim()

    if (!EMAIL_RE.test(email)) return json(400, { error: 'Please enter a valid email address.' })
    if (password.length < 6) return json(400, { error: 'Password must be at least 6 characters long.' })
    if (!USERNAME_RE.test(username)) {
      return json(400, { error: 'Username must be 1–24 characters using letters, numbers, _ . or -.' })
    }
    if (!name) return json(400, { error: 'Please enter your name.' })

    if (await findUserIdByEmail(email)) {
      return json(409, { error: 'An account with this email already exists. Try signing in instead.' })
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, full_name: name },
    })
    if (error) return json(400, { error: friendlyError(error) })

    return json(200, { user: { id: data.user.id, email: data.user.email } })
  }

  if (action === 'reset') {
    if (limited(`reset:${ip}`, 60 * 60 * 1000, 5)) {
      return json(429, { error: 'Too many reset requests. Please wait and try again.' })
    }
    const notReady = needsConfig()
    if (notReady) return notReady
    const email = String(body?.email ?? '').trim().toLowerCase()
    if (!EMAIL_RE.test(email)) return json(400, { error: 'Please enter a valid email address.' })

    const userId = await findUserIdByEmail(email)
    if (!userId) return json(200, { ok: true, code: null })

    const code = String(Math.floor(100000 + Math.random() * 900000))
    const { error } = await admin.from('password_resets').insert({
      user_id: userId,
      code_hash: await hashCode(code),
      expires_at: new Date(now() + 30 * 60 * 1000).toISOString(),
    })
    if (error) return json(500, { error: 'Could not create a reset code. Please try again.' })

    return json(200, { ok: true, code })
  }

  if (action === 'complete-reset') {
    const email = String(body?.email ?? '').trim().toLowerCase()
    if (limited(`resetcode:${email}`, 10 * 60 * 1000, 10)) {
      return json(429, { error: 'Too many reset attempts. Please wait a few minutes and try again.' })
    }
    const notReady = needsConfig()
    if (notReady) return notReady
    const code = String(body?.code ?? '').trim()
    const password = String(body?.password ?? '')
    if (password.length < 6) return json(400, { error: 'Password must be at least 6 characters long.' })

    const userId = await findUserIdByEmail(email)
    if (!userId) return json(400, { error: 'Invalid or expired reset code.' })

    const { data, error } = await admin
      .from('password_resets')
      .select('id, code_hash, expires_at, used_at')
      .eq('user_id', userId)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(5)
    if (error) return json(500, { error: 'Could not check your reset code. Please try again.' })

    const rows = data ?? []
    const fresh = rows.filter((r) => new Date(r.expires_at).getTime() > now())
    let match = null
    for (const r of fresh) {
      if (r.code_hash === (await hashCode(code))) {
        match = r
        break
      }
    }
    if (!match) return json(400, { error: 'Invalid or expired reset code.' })

    const { error: upErr } = await admin.auth.admin.updateUserById(userId, { password })
    if (upErr) return json(400, { error: friendlyError(upErr) })

    await admin.from('password_resets').update({ used_at: new Date(now()).toISOString() }).eq('id', match.id)
    return json(200, { ok: true })
  }

  return json(400, { error: 'Unknown action.' })
})