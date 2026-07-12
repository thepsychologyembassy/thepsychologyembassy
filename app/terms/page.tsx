import Link from "next/link";
import Navbar from "../../components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Psychology Embassy",
  description: "Terms and conditions for using Psychology Embassy's services.",
};

export default function TermsPage() {
  const lastUpdated = "June 2026";

  return (
    <main className="min-h-screen bg-[#FBF8F2] text-[#3A3A38]">
      <Navbar />

      <section className="mx-auto max-w-3xl px-6 pb-32 pt-32">
        {/* Header */}
        <div className="mb-12 border-b border-[#3A3A38]/10 pb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#88B7B5]">Legal</p>
          <h1 className="font-serif text-4xl font-medium text-[#2C4C5B]">Terms of Service</h1>
          <p className="mt-3 text-sm text-[#3A3A38]/60">Last updated: {lastUpdated}</p>
        </div>

        <div className="flex flex-col gap-10 text-sm leading-relaxed text-[#3A3A38]/80">

          {/* Intro */}
          <div>
            <p>
              These Terms of Service ("Terms") govern your use of the Psychology Embassy website and services. By accessing our website or booking a session, you agree to be bound by these Terms. Please read them carefully.
            </p>
            <p className="mt-4">
              If you do not agree with any part of these Terms, you must not use our services. These Terms are governed by the laws of India.
            </p>
          </div>

          {/* Medical Disclaimer - prominent */}
          <div className="rounded-2xl border border-[#A65D47]/20 bg-[#A65D47]/5 p-6">
            <h2 className="mb-3 font-serif text-xl font-medium text-[#A65D47]">Important Medical Disclaimer</h2>
            <p className="mb-3">
              Psychology Embassy provides <strong className="text-[#3A3A38]">peer support, companionship, and psychological education</strong> — not licensed therapy, clinical treatment, or medical care.
            </p>
            <ul className="flex flex-col gap-2 pl-4">
              <li className="flex gap-3"><span className="mt-0.5 shrink-0 text-[#A65D47]">•</span>Our services do not constitute a therapist-patient or doctor-patient relationship.</li>
              <li className="flex gap-3"><span className="mt-0.5 shrink-0 text-[#A65D47]">•</span>Our counselors and companions are not licensed psychiatrists or clinical psychologists unless explicitly stated.</li>
              <li className="flex gap-3"><span className="mt-0.5 shrink-0 text-[#A65D47]">•</span>Our services are not a substitute for professional mental health treatment, emergency care, or medical advice.</li>
              <li className="flex gap-3"><span className="mt-0.5 shrink-0 text-[#A65D47]">•</span>If you are in crisis, please contact a licensed professional or call iCall at <strong>9152987821</strong>.</li>
            </ul>
          </div>

          {/* Section 1 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">1. Eligibility</h2>
            <p className="mb-3">To use our services you must:</p>
            <ul className="flex flex-col gap-2 pl-4">
              <li className="flex gap-3"><span className="mt-0.5 shrink-0 text-[#88B7B5]">•</span>Be at least 18 years of age.</li>
              <li className="flex gap-3"><span className="mt-0.5 shrink-0 text-[#88B7B5]">•</span>Have the legal capacity to enter into a binding agreement.</li>
              <li className="flex gap-3"><span className="mt-0.5 shrink-0 text-[#88B7B5]">•</span>Provide accurate and complete registration information.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">2. Booking & Payments</h2>
            <p className="mb-3"><strong className="text-[#3A3A38]">Booking:</strong> Sessions are confirmed only after successful payment. A pending slot may be held briefly during checkout but is not guaranteed until payment is complete.</p>
            <p className="mb-3"><strong className="text-[#3A3A38]">Pricing:</strong> All prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes. Prices are subject to change with notice.</p>
            <p className="mb-3"><strong className="text-[#3A3A38]">Payment Processing:</strong> Payments are processed securely by PayU. By completing a payment, you also agree to PayU's Terms of Service.</p>
            <p><strong className="text-[#3A3A38]">Failed Payments:</strong> If your payment fails, your session booking will not be confirmed. Please attempt the booking again or contact us for assistance.</p>
          </div>

          {/* Section 3 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">3. Cancellations & Refunds</h2>
            <p className="mb-3"><strong className="text-[#3A3A38]">Cancellation by You:</strong> Sessions cancelled more than 24 hours before the scheduled time are eligible for a full refund minus payment gateway charges. Sessions cancelled within 24 hours are non-refundable.</p>
            <p className="mb-3"><strong className="text-[#3A3A38]">Cancellation by Us:</strong> If a counselor is unavailable due to emergency, we will contact you to reschedule or issue a full refund.</p>
            <p className="mb-3"><strong className="text-[#3A3A38]">No-Shows:</strong> If you do not attend a booked session without cancelling, the session fee is forfeited.</p>
            <p>To request a cancellation or refund, email us at <a href="mailto:thepsychologyembassy@gmail.com" className="text-[#4F6F52] underline underline-offset-2">thepsychologyembassy@gmail.com</a> with your booking details. Refunds are processed within 5–7 business days.</p>
          </div>

          {/* Section 4 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">4. Your Responsibilities</h2>
            <p className="mb-3">By using our services, you agree to:</p>
            <ul className="flex flex-col gap-2 pl-4">
              {[
                "Provide accurate information about yourself when registering and booking.",
                "Treat our counselors and team members with respect. Abusive, threatening, or harassing behavior will result in immediate termination of services with no refund.",
                "Attend booked sessions on time. Joining your video session is your responsibility.",
                "Not record, screenshot, or share session content without explicit written consent from all parties.",
                "Not use our services for any unlawful purpose.",
                "Maintain the confidentiality of your account password and notify us immediately of any unauthorized access.",
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-[#88B7B5]">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 5 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">5. Session Confidentiality</h2>
            <p>
              All session content and personal information shared during counseling is strictly confidential. Our counselors will not disclose session content to third parties except: (a) where required by law, (b) where there is an imminent risk of harm to yourself or others, or (c) with your express written consent. This confidentiality applies to all modalities — online video and in-person.
            </p>
          </div>

          {/* Section 6 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">6. Courses & Internship Applications</h2>
            <p className="mb-3"><strong className="text-[#3A3A38]">Application Review:</strong> Submission of an application does not guarantee acceptance. All applications are reviewed by our team and acceptance is at our sole discretion.</p>
            <p className="mb-3"><strong className="text-[#3A3A38]">Payment Deadlines:</strong> If accepted, you will have 24 hours to complete enrollment payment. Failure to pay within this window will result in your seat being offered to the next applicant.</p>
            <p><strong className="text-[#3A3A38]">Program Fees:</strong> Course and internship fees are non-refundable once the program has commenced, unless we cancel the program.</p>
          </div>

          {/* Section 7 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">7. Intellectual Property</h2>
            <p>
              All content on this website — including text, blog posts, graphics, logos, and course materials — is the intellectual property of Psychology Embassy and is protected under applicable copyright law. You may not reproduce, distribute, or create derivative works without our prior written permission. Blog posts and articles may be shared with proper attribution and a link back to the original.
            </p>
          </div>

          {/* Section 8 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">8. Limitation of Liability</h2>
            <p className="mb-3">
              To the maximum extent permitted by law, Psychology Embassy shall not be liable for:
            </p>
            <ul className="flex flex-col gap-2 pl-4">
              {[
                "Any indirect, incidental, or consequential damages arising from use of our services.",
                "Actions or inactions of counselors or companions during or after sessions.",
                "Technical failures including video platform outages, payment gateway errors, or website downtime.",
                "Outcomes of counseling sessions, which are inherently personal and subjective.",
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-[#88B7B5]">•</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4">Our total liability in any case shall not exceed the amount you paid for the specific session or service in question.</p>
          </div>

          {/* Section 9 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time if you violate these Terms or engage in behavior that is harmful to our team, counselors, or other users. In the event of termination for cause, no refund will be issued for any prepaid sessions.
            </p>
          </div>

          {/* Section 10 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">10. Governing Law & Disputes</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes arising from these Terms or your use of our services shall be subject to the exclusive jurisdiction of the courts of Bangalore, Karnataka, India. We encourage you to contact us first to resolve any dispute amicably before seeking legal recourse.
            </p>
          </div>

          {/* Section 11 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">11. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of significant changes by email or via a notice on our website. Continued use of our services after the effective date constitutes acceptance of the updated Terms.
            </p>
          </div>

          {/* Section 12 */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">12. Contact</h2>
            <div className="rounded-xl border border-[#3A3A38]/10 bg-white p-6">
              <p className="font-semibold text-[#2C4C5B]">Psychology Embassy</p>
              <p className="mt-1">Support: <a href="mailto:thepsychologyembassy@gmail.com" className="text-[#4F6F52] underline underline-offset-2">thepsychologyembassy@gmail.com</a></p>
              <p className="mt-1">Legal: <a href="mailto:thepsychologyembassy@gmail.com" className="text-[#4F6F52] underline underline-offset-2">thepsychologyembassy@gmail.com</a></p>
            </div>
          </div>

          {/* Footer nav */}
          <div className="flex gap-6 border-t border-[#3A3A38]/10 pt-8 text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/50">
            <Link href="/privacy" className="transition-colors hover:text-[#4F6F52]">Privacy Policy</Link>
            <Link href="/cookies" className="transition-colors hover:text-[#4F6F52]">Cookie Policy</Link>
            <Link href="/" className="transition-colors hover:text-[#4F6F52]">← Home</Link>
          </div>

        </div>
      </section>
    </main>
  );
}