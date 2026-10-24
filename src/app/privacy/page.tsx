import Link from 'next/link';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <div className="card p-6 space-y-4 text-sm text-neutral-300 leading-relaxed">
        <p><strong>Last updated:</strong> {new Date().toLocaleDateString('en-US')}</p>
        <h2 className="text-lg font-semibold text-white pt-2">1. Information We Collect</h2>
        <p>
          We collect information you provide directly: username, email, password hash, profile data (avatar, bio),
          and content you post (captions, media, comments). We also automatically log IP addresses, browser info,
          and interaction data (likes, views, follows) to improve the service.
        </p>
        <h2 className="text-lg font-semibold text-white pt-2">2. How We Use Your Information</h2>
        <p>
          To operate CLIPROOM: authenticate you, show personalized feeds, deliver notifications, prevent abuse,
          and improve recommendations. We do not sell your personal data to third parties.
        </p>
        <h2 className="text-lg font-semibold text-white pt-2">3. Content</h2>
        <p>
          You retain ownership of content you post. By posting, you grant CLIPROOM a non-exclusive, worldwide,
          royalty-free license to display and distribute your content on the platform. AI-generated content is
          automatically labeled. You can delete your content at any time.
        </p>
        <h2 className="text-lg font-semibold text-white pt-2">4. Data Retention</h2>
        <p>
          We retain account data while your account is active. Deleted posts are removed within 30 days.
          You can delete your account by contacting support.
        </p>
        <h2 className="text-lg font-semibold text-white pt-2">5. Cookies</h2>
        <p>
          We use a single httpOnly authentication cookie. No third-party tracking cookies are used.
        </p>
        <h2 className="text-lg font-semibold text-white pt-2">6. Your Rights</h2>
        <p>
          You can access, correct, or delete your data at any time via settings or by contacting support.
          EU/UK users have additional rights under GDPR.
        </p>
        <h2 className="text-lg font-semibold text-white pt-2">7. Contact</h2>
        <p>For privacy questions, contact: privacy@cliprooom.com</p>
        <div className="pt-4">
          <Link href="/" className="text-accent hover:underline">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
