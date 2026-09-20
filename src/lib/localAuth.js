const USERS_KEY = 'dbquiz.users'
const SESSION_KEY = 'dbquiz.session'

export const isLocalAuthActive = () =>
  typeof window !== 'undefined' && !localStorage.getItem('dbquiz.firebase.on')

const uid = () =>
  `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) ?? []
  } catch {
    return []
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) ?? null
  } catch {
    return null
  }
}

function writeSession(session) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

function usernameFromEmail(email) {
  return email.split('@')[0] ?? email
}

function hash(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0
  }
  return `h${(h >>> 0).toString(36)}`
}

export async function localSignUp({ email, password }) {
  const clean = email.trim().toLowerCase()
  if (!clean || !password) return { data: null, error: { message: 'Email and password are required.' } }
  if (password.length < 6) {
    return { data: null, error: { message: 'Password must be at least 6 characters long.' } }
  }
  const users = readUsers()
  if (users.some((u) => u.email === clean)) {
    return { data: null, error: { message: 'An account with this email already exists.' } }
  }
  const user = {
    id: uid(),
    email: clean,
    username: usernameFromEmail(clean),
    passwordHash: hash(password),
    createdAt: new Date().toISOString(),
  }
  writeUsers([...users, user])
  const profile = { id: user.id, username: user.username }
  writeSession({ userId: user.id, email: user.email, username: user.username })
  return { data: { user: { id: user.id, email: user.email }, session: { user: { id: user.id, email: user.email } }, profile }, error: null }
}

export async function localSignIn({ email, password }) {
  const clean = email.trim().toLowerCase()
  const users = readUsers()
  const found = users.find((u) => u.email === clean)
  if (!found || found.passwordHash !== hash(password)) {
    return { data: null, error: { message: 'Invalid email or password.' } }
  }
  writeSession({ userId: found.id, email: found.email, username: found.username })
  const profile = { id: found.id, username: found.username }
  return { data: { user: { id: found.id, email: found.email }, session: { user: { id: found.id, email: found.email } }, profile }, error: null }
}

export async function localSignOut() {
  writeSession(null)
  return { error: null }
}

export function localSession() {
  const session = readSession()
  if (!session) return { user: null, profile: null }
  const users = readUsers()
  const found = users.find((u) => u.id === session.userId)
  if (!found) {
    writeSession(null)
    return { user: null, profile: null }
  }
  return {
    user: { id: found.id, email: found.email },
    profile: { id: found.id, username: found.username },
  }
}

export async function localUpdateUsername(username) {
  const session = readSession()
  if (!session) return { error: { message: 'Not signed in.' } }
  const users = readUsers()
  const next = users.map((u) => (u.id === session.userId ? { ...u, username } : u))
  writeUsers(next)
  writeSession({ ...session, username })
  return { error: null }
}
