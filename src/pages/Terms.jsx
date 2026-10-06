import { Link } from 'react-router-dom'

const GMAIL_COMPOSE_URL =
  'https://mail.google.com/mail/u/0/#inbox?compose=XBcJlDMdDMQtMZdGDPLxfKlsVlPRWDcVwsDkkkqnzhCjlNTvqSwvTWpVxHZGxcXrRtbTCnlFLrdXTrNQ'

export default function Terms() {
  const lastUpdated = 'October 3, 2026'

  return (
    <article className="mx-auto max-w-3xl px-5 py-10 sm:px-8 lg:py-16">
      <header className="mb-10 text-center">
        <h1 className="page-title text-3xl sm:text-4xl">Terms of Service</h1>
        <p className="page-sub mt-3">Last updated: {lastUpdated}</p>
      </header>

      <section className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">1. Acceptance of Terms</h2>
          <p className="page-sub leading-relaxed">
            By accessing or using DBQuiz ("the Service", "we", "our", "us"), you agree to be bound by
            these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">2. Description of Service</h2>
          <p className="page-sub mb-4">DBQuiz is an interactive learning platform for practicing SQL and database skills. The Service includes:</p>
          <ul className="page-sub list-disc list-inside space-y-1 ml-4">
            <li>Interactive SQL quizzes with instant feedback</li>
            <li>Academy tutorials and guided chapters</li>
            <li>Practice modes (unlimited, timed, challenge)</li>
            <li>Leaderboards and progress tracking</li>
            <li>Account management and profile features</li>
          </ul>
          <p className="page-sub mt-4">We reserve the right to modify, suspend, or discontinue any part of the Service at any time without notice.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">3. Accounts & Registration</h2>
          <h3 className="text-lg font-medium text-ink mt-4 mb-2">Eligibility</h3>
          <p className="page-sub mb-4">You must be at least 13 years old (16 in the EU/UK) to create an account. By registering, you represent that you meet this requirement.</p>

          <h3 className="text-lg font-medium text-ink mt-4 mb-2">Account Security</h3>
          <ul className="page-sub list-disc list-inside space-y-1 ml-4 mb-4">
            <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
            <li>You must notify us immediately of any unauthorized use of your account.</li>
            <li>We are not liable for losses from unauthorized account access.</li>
          </ul>

          <h3 className="text-lg font-medium text-ink mt-4 mb-2">Account Termination</h3>
          <p className="page-sub mb-4">You may delete your account at any time via the Settings page. We may suspend or terminate accounts that violate these Terms, with or without notice.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">4. Acceptable Use</h2>
          <p className="page-sub mb-4">You agree not to:</p>
          <ul className="page-sub list-disc list-inside space-y-1 ml-4">
            <li>Use the Service for any illegal or unauthorized purpose.</li>
            <li>Attempt to gain unauthorized access to any part of the Service, other accounts, or our systems.</li>
            <li>Interfere with or disrupt the Service, servers, or networks.</li>
            <li>Use automated scripts, bots, or scrapers to access the Service.</li>
            <li>Submit false, misleading, or fraudulent information.</li>
            <li>Harass, abuse, or threaten other users or staff.</li>
            <li>Reverse engineer, decompile, or attempt to derive source code.</li>
          </ul>
          <p className="page-sub mt-4">We reserve the right to investigate and take action against violations, including account suspension, IP blocking, and legal action.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">5. Intellectual Property</h2>
          <h3 className="text-lg font-medium text-ink mt-4 mb-2">Our Content</h3>
          <p className="page-sub mb-4">All content on DBQuiz — including quiz questions, explanations, academy chapters, code examples, designs, logos, and trademarks — is owned by us or our licensors and protected by copyright, trademark, and other intellectual property laws.</p>

          <h3 className="text-lg font-medium text-ink mt-4 mb-2">Your Content</h3>
          <p className="page-sub mb-4">You retain ownership of content you submit (feedback, profile info). By submitting content, you grant us a worldwide, royalty-free, perpetual license to use, display, and distribute it in connection with the Service.</p>

          <h3 className="text-lg font-medium text-ink mt-4 mb-2">User Submissions</h3>
          <p className="page-sub mb-4">Feedback, bug reports, and suggestions you provide become our property and may be used without compensation or attribution.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">6. Leaderboards & Competitive Features</h2>
          <p className="page-sub mb-4">Leaderboards display scores, completion times, and usernames. By participating, you agree that your score, username, and completion time may be publicly displayed. We reserve the right to remove scores obtained through cheating, exploits, or violations of these Terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">7. Disclaimers & Limitation of Liability</h2>
          <h3 className="text-lg font-medium text-ink mt-4 mb-2">No Warranties</h3>
          <p className="page-sub mb-4">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND CONTINUOUS AVAILABILITY.</p>

          <h3 className="text-lg font-medium text-ink mt-4 mb-2">Limitation of Liability</h3>
          <p className="page-sub mb-4">TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF DATA, PROFITS, OR GOODWILL, ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">8. Indemnification</h2>
          <p className="page-sub">You agree to indemnify and hold us harmless from any claims, damages, losses, or expenses (including attorney fees) arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">9. Governing Law & Disputes</h2>
          <p className="page-sub mb-4">These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict of law principles. Any disputes will be resolved in the state and federal courts located in Delaware.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">9. Changes to Terms</h2>
          <p className="page-sub mb-4">We may modify these Terms at any time. The "Last updated" date reflects the latest revision. Continued use of the Service after changes constitutes acceptance. Material changes will be announced via the app or email.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">10. Severability</h2>
          <p className="page-sub mb-4">If any provision is found unenforceable, the remaining provisions remain in effect. The unenforceable provision will be modified to the minimum extent necessary to make it enforceable.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">11. Contact Us</h2>
          <p className="page-sub">Questions about these Terms? Contact us at:</p>
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