import { createContext, useContext, useEffect, useState } from 'react'
import { isSupabaseConfigured } from '../lib/supabase.js'
import {
  onAuthChange,
  supabaseGetSession,
  supabaseSignIn,
  supabaseSignUp,
  supabaseSignInWithGoogle,
  supabaseSignOut,
  fetchProfile,
  updateProfileUsername,
} from '../lib/supabase-auth.js'

const AuthContext = createContext(null)

const GUEST = {
  user: null,
  profile: null,
  loading: false,
  configured: false,
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }
    let active = true

    supabaseGetSession().then(({ user: u }) => {
      if (!active) return
      if (!u) setLoading(false)
    })

    return onAuthChange((nextUser) => {
      if (!active) return
      setUser(nextUser ? { id: nextUser.id, email: nextUser.email ?? '' } : null)
      if (!nextUser) {
        setProfile(null)
        setLoading(false)
      }
    })
  }, [])

  useEffect(() => {
    let active = true
    if (!isSupabaseConfigured || !user?.id) {
      setProfile(null)
      return undefined
    }
    fetchProfile(user.id).then((p) => {
      if (!active) return
      setProfile({
        id: user.id,
        username: p?.username || emailUsername(user.email) || 'player',
        name: p?.name || '',
      })
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [user?.id, user?.email])

  const signInWithPassword = async (email, password) => {
    const result = await supabaseSignIn({ email, password })
    if (result.data?.user) {
      setUser({ id: result.data.user.id, email: result.data.user.email ?? '' })
    }
    return result
  }

  const signUpWithPassword = async (username, name, email, password) => {
    const result = await supabaseSignUp({ email, password, username, name })
    if (result.data?.user) {
      setUser({ id: result.data.user.id, email: result.data.user.email ?? '' })
    }
    return result
  }

  const signInWithGoogle = async () => {
    return supabaseSignInWithGoogle()
  }

  const updateUsername = async (username) => {
    if (!user) return { error: new Error('Not signed in.') }
    if (!isSupabaseConfigured) return { error: new Error('Supabase is not configured.') }
    const { error } = await updateProfileUsername(user.id, username)
    if (!error) setProfile((p) => (p ? { ...p, username } : p))
    return { error }
  }

  const signOut = async () => {
    await supabaseSignOut()
    setUser(null)
    setProfile(null)
  }

  const value = {
    user,
    profile,
    loading,
    configured: isSupabaseConfigured,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    updateUsername,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function emailUsername(email) {
  if (!email) return null
  const prefix = email.split('@')[0]
  return prefix ? prefix.replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 24) || null : null
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  return ctx ?? GUEST
}

export default AuthProvider