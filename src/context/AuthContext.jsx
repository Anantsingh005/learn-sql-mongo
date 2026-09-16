import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { localSignUp, localSignIn, localSignOut, localSession, localUpdateUsername } from '../lib/localAuth.js'

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
      const local = localSession()
      setUser(local.user)
      setProfile(local.profile)
      setLoading(false)
      return undefined
    }

    if (!supabase) return undefined

    supabase.auth.getSession().then(({ data }) => {
      const nextUser = data.session?.user ?? null
      setUser(nextUser)
      if (nextUser) {
        fetchProfile(nextUser.id).then(setProfile)
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)
      setProfile(null)
      if (nextUser) {
        fetchProfile(nextUser.id).then(setProfile)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signInWithPassword = async (email, password) => {
    if (!isSupabaseConfigured) return localSignIn({ email, password })
    if (!supabase) return { error: new Error('Supabase is not configured.') }
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signUpWithPassword = async (email, password) => {
    if (!isSupabaseConfigured) return localSignUp({ email, password })
    if (!supabase) return { error: new Error('Supabase is not configured.') }
    return supabase.auth.signUp({ email, password })
  }

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Google sign-in needs Firebase keys — use email + password for now.') }
    }
    if (!supabase) return { error: new Error('Supabase is not configured.') }
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  const updateUsername = async (username) => {
    if (!isSupabaseConfigured) {
      if (!user) return { error: new Error('Not signed in.') }
      const { error } = await localUpdateUsername(username)
      if (!error) setProfile((p) => (p ? { ...p, username } : p))
      return { error }
    }
    if (!supabase || !user) return { error: new Error('Not signed in.') }
    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', user.id)
    if (!error) setProfile((p) => (p ? { ...p, username } : p))
    return { error }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      await localSignOut()
      setUser(null)
      setProfile(null)
      return
    }
    if (!supabase) return
    await supabase.auth.signOut()
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

export function useAuth() {
  const ctx = useContext(AuthContext)
  return ctx ?? GUEST
}

export default AuthProvider
