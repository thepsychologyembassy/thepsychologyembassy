import Link from "next/link";
import Navbar from "../../components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Psychology Embassy",
  description: "How Psychology Embassy collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  const lastUpdated = "June 2026";

  return (
    <main className="min-h-screen bg-[#FBF8F2] text-[#3A3A38]">
      <Navbar />

      <section className="mx-auto max-w-3xl px-6 pb-32 pt-32">
        {/* Header */}
        <div className="mb-12 border-b border-[#3A3A38]/10 pb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#88B7B5]">Legal</p>
          <h1 className="font-serif text-4xl font-medium text-[#2C4C5B]">Privacy Policy</h1>
          <p className="mt-3 text-sm text-[#3A3A38]/60">Last updated: {lastUpdated}</p>
        </div>

        <div className="flex flex-col gap-10 text-sm leading-relaxed text-[#3A3A38]/80">

          {/* Intro */}
          <div>
            <p>
              Psychology Embassy ("we", "our", "us") is committed to protecting your personal information. This Privacy Policy explains what data we collect, why we collect it, how we use it, and your rights — in compliance with India's Digital Personal Data Protection Act 2023 (DPDP Act) and applicable global standards.
            </p>
            <p className="mt-4">
              By using our website at psychologyembassy.com and booking our services, you agree to this policy. If you do not agree, please do not use our services.
            </p>
          </div>

          {/* Section 1 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">1. What Information We Collect</h2>
            <p className="mb-3"><strong className="text-[#3A3A38]">Account Information:</strong> When you sign up, we collect your name, email address, and password (stored securely via Supabase — we never see your raw password).</p>
            <p className="mb-3"><strong className="text-[#3A3A38]">Booking Information:</strong> When you book a counseling session, we collect your name, email, the counselor you selected, your chosen date and time, and any notes you voluntarily provide about the reason for your session.</p>
            <p className="mb-3"><strong className="text-[#3A3A38]">Payment Information:</strong> Payments are processed by PayU. We do not store your card number, CVV, or any payment credentials. We only store the PayU Order ID and Payment ID to confirm your booking. PayU's privacy policy applies to payment data.</p>
            <p className="mb-3"><strong className="text-[#3A3A38]">Application Information:</strong> If you apply for a course or internship, we collect your name, email, phone number, LinkedIn profile URL, and statement of purpose. Resume files are stored securely and accessible only to our team.</p>
            <p className="mb-3"><strong className="text-[#3A3A38]">Usage Data:</strong> We collect anonymised analytics data (pages visited, time on site) via Google Analytics 4 to improve our website. This data cannot identify you personally.</p>
            <p><strong className="text-[#3A3A38]">Cookies:</strong> We use strictly necessary cookies for authentication and optional analytics cookies. See our <Link href="/cookies" className="text-[#4F6F52] underline underline-offset-2">Cookies Policy</Link> for details.</p>
          </div>

          {/* Section 2 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">2. How We Use Your Information</h2>
            <ul className="flex flex-col gap-2 pl-4">
              {[
                "To create and manage your account.",
                "To confirm and manage your counseling session bookings.",
                "To send you booking confirmation emails and meeting links via Resend.",
                "To allow your assigned counselor to prepare for and conduct your session.",
                "To review internship and course applications internally.",
                "To improve our website and services using anonymised analytics.",
                "To comply with legal obligations.",
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-[#88B7B5]">•</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4">We do <strong className="text-[#3A3A38]">not</strong> sell, rent, or share your personal data with third parties for marketing purposes. Ever.</p>
          </div>

          {/* Section 3 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">3. Data Sharing</h2>
            <p className="mb-3">We share your data only with the following trusted services who process it on our behalf:</p>
            <ul className="flex flex-col gap-2 pl-4">
              {[
                "Supabase (Ireland / USA) — database and authentication",
                "Sanity (USA) — content management",
                "PayU (India) — payment processing",
                "Resend (USA) — transactional email delivery",
                "Google Analytics (USA) — anonymised website analytics",
                "Clerk (USA) — user authentication (where applicable)",
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-[#88B7B5]">•</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4">All third-party services are bound by their own privacy policies and applicable data protection laws. International transfers are covered by standard contractual clauses or equivalent mechanisms.</p>
          </div>

          {/* Section 4 - Sensitive */}
          <div className="rounded-2xl border border-[#88B7B5]/30 bg-[#88B7B5]/5 p-6">
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">4. Sensitive Health Information</h2>
            <p className="mb-3">
              You may voluntarily share sensitive information relating to your mental health in the "notes" field when booking a session, or during your counseling sessions. This information is:
            </p>
            <ul className="flex flex-col gap-2 pl-4">
              <li className="flex gap-3"><span className="mt-0.5 shrink-0 text-[#88B7B5]">•</span>Accessible only to the specific counselor assigned to your session and our core administrative team.</li>
              <li className="flex gap-3"><span className="mt-0.5 shrink-0 text-[#88B7B5]">•</span>Never shared with any third party without your explicit written consent.</li>
              <li className="flex gap-3"><span className="mt-0.5 shrink-0 text-[#88B7B5]">•</span>Treated with the highest confidentiality.</li>
            </ul>
            <p className="mt-4">
              <strong className="text-[#3A3A38]">Exception:</strong> We may disclose information without your consent only if required by law or if there is an imminent risk of harm to you or others.
            </p>
          </div>

          {/* Section 5 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">5. Data Retention</h2>
            <p className="mb-3">We retain your data for as long as your account is active or as needed to provide services. Specifically:</p>
            <ul className="flex flex-col gap-2 pl-4">
              <li className="flex gap-3"><span className="mt-0.5 shrink-0 text-[#88B7B5]">•</span><strong className="text-[#3A3A38]">Account data:</strong> Retained until you request deletion.</li>
              <li className="flex gap-3"><span className="mt-0.5 shrink-0 text-[#88B7B5]">•</span><strong className="text-[#3A3A38]">Appointment records:</strong> Retained for 3 years for audit and legal compliance.</li>
              <li className="flex gap-3"><span className="mt-0.5 shrink-0 text-[#88B7B5]">•</span><strong className="text-[#3A3A38]">Payment records:</strong> Retained for 7 years as required by Indian financial law.</li>
              <li className="flex gap-3"><span className="mt-0.5 shrink-0 text-[#88B7B5]">•</span><strong className="text-[#3A3A38]">Application resumes:</strong> Retained for 6 months after application review, then deleted.</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">6. Your Rights (DPDP Act 2023)</h2>
            <p className="mb-3">Under India's Digital Personal Data Protection Act 2023, you have the right to:</p>
            <ul className="flex flex-col gap-2 pl-4">
              {[
                "Access the personal data we hold about you.",
                "Correct inaccurate or incomplete personal data.",
                "Request deletion of your personal data (right to erasure), subject to legal retention requirements.",
                "Withdraw consent for data processing at any time.",
                "Nominate a person to exercise your rights on your behalf.",
                "File a complaint with the Data Protection Board of India.",
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-[#88B7B5]">•</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              To exercise any of these rights, email us at <a href="mailto:thepsychologyembassy@gmail.com" className="text-[#4F6F52] underline underline-offset-2">thepsychologyembassy@gmail.com</a>. We will respond within 30 days.
            </p>
          </div>

          {/* Section 7 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">7. Security</h2>
            <p>
              We implement industry-standard security measures including encrypted data transmission (HTTPS/TLS), secure database access controls, and regular security reviews. However, no system is 100% secure. If you believe your account has been compromised, contact us immediately at <a href="mailto:thepsychologyembassy@gmail.com" className="text-[#4F6F52] underline underline-offset-2">thepsychologyembassy@gmail.com</a>.
            </p>
          </div>

          {/* Section 8 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">8. Children's Privacy</h2>
            <p>
              Our services are intended for individuals aged 18 and above. We do not knowingly collect personal data from minors. If you believe a minor has provided us data, please contact us and we will delete it promptly.
            </p>
          </div>

          {/* Section 9 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make significant changes, we will notify you by email or via a prominent notice on our website at least 7 days before the changes take effect. Continued use of our services after the effective date constitutes acceptance.
            </p>
          </div>

          {/* Section 10 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">10. Contact Us</h2>
            <p className="mb-3">If you have any questions about this Privacy Policy or how we handle your data, please contact our Data Protection contact:</p>
            <div className="rounded-xl border border-[#3A3A38]/10 bg-white p-6">
              <p className="font-semibold text-[#2C4C5B]">Psychology Embassy</p>
              <p className="mt-1">Email: <a href="mailto:thepsychologyembassy@gmail.com" className="text-[#4F6F52] underline underline-offset-2">thepsychologyembassy@gmail.com</a></p>
              <p className="mt-1">Website: <Link href="/" className="text-[#4F6F52] underline underline-offset-2">psychologyembassy.com</Link></p>
            </div>
          </div>

          {/* Footer nav */}
          <div className="flex gap-6 border-t border-[#3A3A38]/10 pt-8 text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/50">
            <Link href="/terms" className="transition-colors hover:text-[#4F6F52]">Terms of Service</Link>
            <Link href="/cookies" className="transition-colors hover:text-[#4F6F52]">Cookie Policy</Link>
            <Link href="/" className="transition-colors hover:text-[#4F6F52]">← Home</Link>
          </div>

        </div>
      </section>
    </main>
  );
}