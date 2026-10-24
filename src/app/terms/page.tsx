import Link from 'next/link';

export const metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Terms of Service</h1>
      <div className="card p-6 space-y-4 text-sm text-neutral-300 leading-relaxed">
        <p><strong>Last updated:</strong> {new Date().toLocaleDateString('en-US')}</p>
        <h2 className="text-lg font-semibold text-white pt-2">1. Acceptance</h2>
        <p>By using CLIPROOM, you agree to these terms. If you do not agree, do not use the service.</p>
        <h2 className="text-lg font-semibold text-white pt-2">2. Eligibility</h2>
        <p>You must be at least 13 years old to use CLIPROOM. Users under 18 need parental consent.</p>
        <h2 className="text-lg font-semibold text-white pt-2">3. Your Account</h2>
        <p>
          You are responsible for maintaining the security of your account. Do not share your password.
          Notify us immediately of unauthorized access.
        </p>
        <h2 className="text-lg font-semibold text-white pt-2">4. Content Guidelines</h2>
        <p>You may not post:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Illegal content or content that violates others' rights</li>
          <li>Harassment, hate speech, or threats</li>
          <li>Sexually explicit content involving minors</li>
          <li>Spam, malware, or phishing</li>
          <li>Content that infringes copyright</li>
        </ul>
        <h2 className="text-lg font-semibold text-white pt-2">5. AI Content</h2>
        <p>
          AI-generated images are automatically labeled. You may not remove or falsify AI labels.
          You are responsible for ensuring you have rights to any AI content you post.
        </p>
        <h2 className="text-lg font-semibold text-white pt-2">6. Moderation</h2>
        <p>
          We may remove content or suspend accounts that violate these terms. Serious violations may be
          reported to law enforcement.
        </p>
        <h2 className="text-lg font-semibold text-white pt-2">7. Disclaimer</h2>
        <p>
          CLIPROOM is provided "as is" without warranty. We are not liable for user-generated content
          or any damages arising from use of the service.
        </p>
        <h2 className="text-lg font-semibold text-white pt-2">8. Changes</h2>
        <p>We may update these terms. Continued use after changes means acceptance.</p>
        <h2 className="text-lg font-semibold text-white pt-2">9. Contact</h2>
        <p>For legal questions: legal@cliprooom.com</p>
        <div className="pt-4">
          <Link href="/" className="text-accent hover:underline">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
