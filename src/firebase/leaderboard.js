import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { firestore } from './client.js'

const scoresRef = () => collection(firestore, 'scores')

export async function saveScore({ game, score, time, userId, username }) {
  if (!firestore) return { error: new Error('Firebase is not configured.') }
  if (!userId) return { error: new Error('Not signed in.') }
  try {
    await addDoc(scoresRef(), {
      userId,
      username: username || 'Anonymous',
      game,
      score,
      time,
      createdAt: serverTimestamp(),
    })
    return { error: null }
  } catch (err) {
    return { error: err }
  }
}

export async function fetchTopScores(game = 'sql', top = 10) {
  if (!firestore) return { data: [], error: null }
  try {
    const q = query(
      scoresRef(),
      where('game', '==', game),
      orderBy('score', 'desc'),
      orderBy('time', 'asc'),
      limit(top)
    )
    const snapshot = await getDocs(q)
    const rows = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      profiles: { username: doc.data().username },
    }))
    return { data: rows, error: null }
  } catch (err) {
    return { data: [], error: err }
  }
}

export default { saveScore, fetchTopScores }