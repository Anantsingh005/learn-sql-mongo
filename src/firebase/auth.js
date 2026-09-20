import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth'
import { firebaseAuth } from './client.js'

export const onAuthChange = (callback) => {
  if (!firebaseAuth) return () => {}
  return onAuthStateChanged(firebaseAuth, callback)
}

export async function firebaseSignUp({ email, password }) {
  if (!firebaseAuth) return { data: null, error: { message: 'Firebase is not configured.' } }
  try {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
    return { data: { user: credential.user, session: credential.user }, error: null }
  } catch (err) {
    return { data: null, error: { message: friendlyAuthError(err) } }
  }
}

export async function firebaseSignIn({ email, password }) {
  if (!firebaseAuth) return { data: null, error: { message: 'Firebase is not configured.' } }
  try {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
    return { data: { user: credential.user, session: credential.user }, error: null }
  } catch (err) {
    return { data: null, error: { message: friendlyAuthError(err) } }
  }
}

export async function firebaseSignInWithGoogle() {
  if (!firebaseAuth) return { data: null, error: { message: 'Firebase is not configured.' } }
  try {
    const credential = await signInWithPopup(firebaseAuth, new GoogleAuthProvider())
    return { data: { user: credential.user, session: credential.user }, error: null }
  } catch (err) {
    return { data: null, error: { message: friendlyAuthError(err) } }
  }
}

export async function firebaseSignOut() {
  if (!firebaseAuth) return { error: null }
  try {
    await signOut(firebaseAuth)
    return { error: null }
  } catch (err) {
    return { error: { message: friendlyAuthError(err) } }
  }
}

function friendlyAuthError(err) {
  const code = err?.code ?? ''
  const fallback = err?.message ?? 'Something went wrong.'
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters long.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase.',
    'auth/popup-closed-by-user': 'The sign-in popup was closed before finishing.',
  }
  return map[code] ?? (code ? `${code}: ${fallback}` : fallback)
}

export default { onAuthChange, firebaseSignUp, firebaseSignIn, firebaseSignInWithGoogle, firebaseSignOut }