import { supabase } from './supabase.js'

export const FEEDBACK_SUBJECTS = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'general', label: 'General Feedback' },
  { value: 'other', label: 'Other' },
]

export async function submitFeedback({ subject, message }) {
  if (!subject?.trim()) return { data: null, error: new Error('Subject is required') }
  if (!message?.trim()) return { data: null, error: new Error('Message is required') }

  const { data: session, error: sessionError } = await supabase.auth.getUser()
  const user = session?.user

  if (sessionError) {
    console.error('Feedback session lookup error:', sessionError)
    return { data: null, error: new Error('Could not verify your session. Please sign in again.') }
  }
  if (!user) return { data: null, error: new Error('You must be logged in to submit feedback') }

  const { data, error } = await supabase
    .from('feedback')
    .insert({
      subject: subject.trim(),
      message: message.trim(),
      user_id: user.id,
    })
    .select('id, subject, message, status, created_at')
    .single()

  if (error) {
    console.error('Feedback submission error:', error)
    return { data: null, error: new Error(`Feedback submission failed: ${error.message}`) }
  }

  return { data, error: null }
}
