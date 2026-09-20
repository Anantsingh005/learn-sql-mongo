import { createContext, useContext, useEffect, useState } from 'react'
import { isFirebaseConfigured } from '../firebase/client.js'
import { onAuthChange, firebaseSignIn, firebaseSignUp, firebaseSignInWithGoogle, firebaseSignOut } from '../firebase/auth.js'
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
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      const local = localSession()
      setUser(local.user)
      setProfile(local.profile)
      setLoading(false)
      return undefined
    }

    return onAuthChange((firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      const nextUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email ?? '',
      }
      setUser(nextUser)
      setProfile({
        id: firebaseUser.uid,
        username: firebaseUser.displayName || emailUsername(firebaseUser.email) || 'player',
      })
      setLoading(false)
    })
  }, [])

  const signInWithPassword = async (email, password) => {
    if (!isFirebaseConfigured) return localSignIn({ email, password })
    const result = await firebaseSignIn({ email, password })
    if (result.data?.user) {
      syncProfileFromUser(result.data.user)
    }
    return result
  }

  const signUpWithPassword = async (email, password) => {
    if (!isFirebaseConfigured) return localSignUp({ email, password })
    const result = await firebaseSignUp({ email, password })
    if (result.data?.user) {
      syncProfileFromUser(result.data.user)
    }
    return result
  }

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      return { error: new Error('Google sign-in needs a Firebase project — use email + password for now.') }
    }
    const result = await firebaseSignInWithGoogle()
    if (result.data?.user) {
      syncProfileFromUser(result.data.user)
    }
    return result
  }

  const updateUsername = async (username) => {
    if (!isFirebaseConfigured) {
      if (!user) return { error: new Error('Not signed in.') }
      const { error } = await localUpdateUsername(username)
      if (!error) setProfile((p) => (p ? { ...p, username } : p))
      return { error }
    }
    if (!user) return { error: new Error('Not signed in.') }
    setProfile((p) => (p ? { ...p, username } : p))
    return { error: null }
  }

  const signOut = async () => {
    if (!isFirebaseConfigured) {
      await localSignOut()
      setUser(null)
      setProfile(null)
      return
    }
    await firebaseSignOut()
    setUser(null)
    setProfile(null)
  }

  const syncProfileFromUser = (fuser) => {
    setUser({ id: fuser.uid, email: fuser.email ?? '' })
    setProfile({
      id: fuser.uid,
      username: fuser.displayName || emailUsername(fuser.email) || 'player',
    })
  }

  const value = {
    user,
    profile,
    loading,
    configured: isFirebaseConfigured,
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