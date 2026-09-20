import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(
  config.apiKey && config.projectId && config.appId
)

export const firebaseApp = isFirebaseConfigured ? initializeApp(config) : null

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null

export const firestore = firebaseApp ? getFirestore(firebaseApp) : null

export default firebaseApp