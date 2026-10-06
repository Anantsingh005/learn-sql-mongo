import { Link } from 'react-router-dom'

const GMAIL_COMPOSE_URL =
  'https://mail.google.com/mail/u/0/#inbox?compose=XBcJlDMdDMQtMZdGDPLxfKlsVlPRWDcVwsDkkkqnzhCjlNTvqSwvTWpVxHZGxcXrRtbTCnlFLrdXTrNQ'

export default function Privacy() {
  const lastUpdated = 'October 3, 2026'

  return (
    <article className="mx-auto max-w-3xl px-5 py-10 sm:px-8 lg:py-16">
      <header className="mb-10 text-center">
        <h1 className="page-title text-3xl sm:text-4xl">Privacy Policy</h1>
        <p className="page-sub mt-3">Last updated: {lastUpdated}</p>
      </header>

      <section className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">1. Introduction</h2>
          <p className="page-sub leading-relaxed">
            DBQuiz ("we", "our", "us") is committed to protecting your personal information
            and your right to privacy. This Privacy Policy explains what information we collect,
            how we use it, and what choices you have regarding your data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">2. Information We Collect</h2>
          <h3 className="text-lg font-medium text-ink mt-4 mb-2">Account Information</h3>
          <ul className="page-sub list-disc list-inside space-y-1 ml-4">
            <li>Email address (required for account creation)</li>
            <li>Username and display name (chosen by you)</li>
            <li>Profile picture (optional, uploaded by you)</li>
            <li>Authentication provider (email/password or Google OAuth)</li>
          </ul>

          <h3 className="text-lg font-medium text-ink mt-4 mb-2">Usage Data</h3>
          <ul className="page-sub list-disc list-inside space-y-1 ml-4">
            <li>Quiz scores, completion times, and attempts</li>
            <li>Levels completed and progress through chapters</li>
            <li>Time spent on quizzes and in the academy</li>
            <li>Preferred game modes and settings</li>
          </ul>

          <h3 className="text-lg font-medium text-ink mt-4 mb-2">Technical Data</h3>
          <ul className="page-sub list-disc list-inside space-y-1 ml-4">
            <li>IP address (for security and fraud prevention)</li>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Device type (mobile, tablet, desktop)</li>
            <li>Referrer URL and timestamps</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">3. How We Use Your Information</h2>
          <ul className="page-sub list-disc list-inside space-y-2 ml-4">
            <li><strong>Provide core functionality:</strong> Create accounts, save progress, display leaderboards, sync across devices.</li>
            <li><strong>Improve the product:</strong> Analyze usage patterns to improve quizzes, fix bugs, and prioritize features.</li>
            <li><strong>Security & fraud prevention:</strong> Detect suspicious activity, prevent abuse, enforce terms of service.</li>
            <li><strong>Communication:</strong> Send important account notifications (security alerts, password resets). We do not send marketing emails.</li>
            <li><strong>Legal compliance:</strong> Respond to valid legal requests and protect our rights.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">4. Data Sharing & Third Parties</h2>
          <p className="page-sub mb-4">We do not sell your personal information. We share data only in these limited cases:</p>
          <ul className="page-sub list-disc list-inside space-y-2 ml-4">
            <li><strong>Service providers:</strong> Supabase (database, authentication, storage), Vercel (hosting), and analytics providers who process data on our behalf under strict data processing agreements.</li>
            <li><strong>Legal requirements:</strong> When required by law, court order, or to protect our legal rights.</li>
            <li><strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">5. Cookies & Local Storage</h2>
          <p className="page-sub mb-4">We use minimal, essential cookies and browser storage:</p>
          <ul className="page-sub list-disc list-inside space-y-2 ml-4">
            <li><strong>Authentication tokens:</strong> Secure, HttpOnly cookies for session management (Supabase).</li>
            <li><strong>Preferences:</strong> LocalStorage for theme, sidebar state, and UI preferences.</li>
            <li><strong>No tracking cookies:</strong> We do not use third-party advertising cookies, pixels, or fingerprinting.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">6. Data Retention</h2>
          <ul className="page-sub list-disc list-inside space-y-2 ml-4">
            <li>Account data: Retained while your account is active. Deleted within 30 days of account deletion request.</li>
            <li>Quiz & progress data: Retained indefinitely to preserve your history and leaderboards (anonymized if account deleted).</li>
            <li>Security logs (IP, timestamps): Retained for 90 days for fraud prevention.</li>
            <li>Backups: Encrypted backups retained for up to 30 days.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">7. Your Rights</h2>
          <p className="page-sub mb-4">Depending on your jurisdiction, you may have the right to:</p>
          <ul className="page-sub list-disc list-inside space-y-2 ml-4">
            <li>Access and receive a copy of your personal data</li>
            <li>Rectify inaccurate or incomplete data</li>
            <li>Erase your data ("right to be forgotten") — via account deletion in Settings</li>
            <li>Restrict or object to processing</li>
            <li>Data portability — export your data in JSON format</li>
            <li>Withdraw consent (where processing is based on consent)</li>
            <li>Lodge a complaint with a supervisory authority</li>
          </ul>
          <p className="page-sub mt-4">To exercise these rights, use the <Link to="/profile" className="text-brand-600 hover:underline">Settings page</Link> or contact us.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">8. Children's Privacy</h2>
          <p className="page-sub">DBQuiz is not directed at children under 13 (or 16 in the EU/UK). We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">9. International Transfers</h2>
          <p className="page-sub">Our infrastructure is hosted in the United States (Vercel) and databases may be processed in the US or EU (Supabase). We rely on Standard Contractual Clauses and adequate protection frameworks for cross-border transfers.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">10. Changes to This Policy</h2>
          <p className="page-sub">We may update this Privacy Policy from time to time. The "Last updated" date at the top reflects the latest revision. Material changes will be announced via the app or email.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">11. Contact Us</h2>
          <p className="page-sub">Questions about this policy or your data? Contact us at:</p>
          <ul className="page-sub list-disc list-inside space-y-1 ml-4 mt-2">
            <li>
              Email:{' '}
              <a
                href={GMAIL_COMPOSE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded inline-flex items-center gap-1"
              >
                <span>Send Email (anantprince005@gmail.com)</span>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </li>
            <li>Feedback form: <Link to="/" className="text-brand-600 hover:underline">Send Feedback</Link> (logged in)</li>
          </ul>
        </section>
      </section>
    </article>
  )
}