import React from 'react';
import { Link } from 'react-router-dom';

const LAST_UPDATED = '1 April 2026';
const COMPANY = 'Stadi Learning Platform Ltd';
const EMAIL = 'legal@stadi.ke';

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-stadi-dark dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
        {title}
      </h2>
      <div className="text-stadi-gray dark:text-gray-300 text-sm leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-block bg-stadi-green-light text-stadi-green text-xs font-bold px-3 py-1 rounded-full mb-4">
          Legal Document
        </div>
        <h1 className="text-3xl font-black text-stadi-dark dark:text-white mb-2" style={{ fontFamily: 'Playfair Display' }}>
          Terms of Service
        </h1>
        <p className="text-stadi-gray text-sm">
          Last updated: <strong>{LAST_UPDATED}</strong> · Governed by the laws of Kenya
        </p>
        <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-300">
          Please read these Terms carefully before using Stadi. By creating an account or enrolling in a course, you agree to be bound by these Terms. If you do not agree, please do not use the platform.
        </div>
      </div>

      <Section title="1. About Stadi">
        <p>{COMPANY} ("Stadi", "we", "us") operates an online vocational learning platform that enables learners to access skill-based courses, pay via M-Pesa, and earn verifiable certificates. These Terms govern your use of our website (stadi.co.ke), mobile application, and WhatsApp bot.</p>
      </Section>

      <Section title="2. Eligibility">
        <ul className="list-disc pl-5 space-y-2">
          <li>You must be at least <strong>16 years old</strong> to create an account.</li>
          <li>You must have a valid Kenyan mobile phone number for OTP verification.</li>
          <li>You must provide accurate information when setting up your profile.</li>
          <li>You may not create multiple accounts or share your account with others.</li>
        </ul>
      </Section>

      <Section title="3. Account & Security">
        <p>Your account is protected by OTP (one-time password) login — there is no password to remember or lose. You are responsible for:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Keeping your registered phone number secure and up to date.</li>
          <li>Not sharing OTP codes with anyone — Stadi staff will never ask for your OTP.</li>
          <li>Notifying us immediately at {EMAIL} if you suspect unauthorised access.</li>
        </ul>
        <p>We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or misuse the platform.</p>
      </Section>

      <Section title="4. Courses & Content">
        <p><strong>4.1 Enrolment.</strong> Upon successful M-Pesa payment, you are granted a non-transferable, non-exclusive licence to access the enrolled course for personal educational use only.</p>
        <p><strong>4.2 Intellectual property.</strong> All course content — including videos, quizzes, written materials, and assessments — is owned by Stadi or its instructors and is protected by Kenyan copyright law. You may not copy, distribute, resell, or publicly display course content.</p>
        <p><strong>4.3 Offline access.</strong> You may download course content for offline personal viewing on your own device. Downloaded content may not be shared, copied, or transferred.</p>
        <p><strong>4.4 Accuracy.</strong> We strive to ensure course content is accurate and up to date. However, income figures shown are historical averages from graduate surveys and are not guarantees of future earnings. Individual results will vary based on effort, location, and market conditions.</p>
        <p><strong>4.5 Updates.</strong> We may update, improve, or withdraw course content at any time. We will notify enrolled learners of significant content changes.</p>
      </Section>

      <Section title="5. Payments">
        <p><strong>5.1 M-Pesa.</strong> All payments are processed via Safaricom M-Pesa. By initiating a payment, you authorise the charge to your M-Pesa account.</p>
        <p><strong>5.2 Pricing.</strong> Course prices are displayed in Kenya Shillings (KES) inclusive of any applicable taxes. Prices may change; changes do not affect already-purchased enrolments.</p>
        <p><strong>5.3 Failed payments.</strong> If your M-Pesa payment fails or times out, no charge will be applied and no enrolment will be created. Contact support if you were charged but not enrolled.</p>
        <p><strong>5.4 Free courses.</strong> Some courses are offered at no charge. Free courses are subject to the same content licence terms as paid courses.</p>
      </Section>

      <Section title="6. Certificates">
        <p>Upon passing the course assessment with the required score, you will receive a Stadi Certificate of Completion. Certificates are:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Verifiable via QR code at stadi.co.ke/certificates/verify.</li>
          <li>Aligned with the Kenya National Qualifications Authority (KNQA) framework.</li>
          <li>Issued in your legal name — ensure your profile name is correct before completing a course.</li>
          <li>Non-transferable and may be revoked if obtained through academic dishonesty.</li>
        </ul>
      </Section>

      <Section title="7. Instructor Terms">
        <p>If you are an approved Stadi instructor, you additionally agree to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Only upload original content or content you have rights to publish.</li>
          <li>Not include misleading income claims, harmful advice, or illegal information.</li>
          <li>Respond to student support queries within 5 business days.</li>
          <li>Accept Stadi's revenue share arrangement as communicated in your instructor agreement.</li>
          <li>Allow Stadi to review, edit, or remove content that does not meet quality or compliance standards.</li>
        </ul>
        <p>Stadi retains the right to withhold or adjust payouts for courses that receive sustained low ratings, generate high refund rates, or are found to contain inaccurate information.</p>
      </Section>

      <Section title="8. Prohibited Conduct">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Use the platform for any unlawful purpose.</li>
          <li>Attempt to bypass payment systems or access courses without payment.</li>
          <li>Reverse engineer, scrape, or copy platform content or data.</li>
          <li>Upload viruses, malware, or harmful code.</li>
          <li>Impersonate Stadi, instructors, or other users.</li>
          <li>Engage in harassment, discrimination, or hate speech on the platform.</li>
          <li>Sell, transfer, or sublicense your account or course access to others.</li>
        </ul>
        <p>Violations may result in immediate account suspension, forfeiture of course access, and potential legal action.</p>
      </Section>

      <Section title="9. Disclaimers & Limitation of Liability">
        <p>The Stadi platform is provided "as is". While we make every effort to maintain uptime and content quality, we do not guarantee uninterrupted access. We are not liable for:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Loss of income or business opportunities resulting from course completion or non-completion.</li>
          <li>Technical failures beyond our reasonable control (e.g. network outages, M-Pesa downtime).</li>
          <li>Third-party content linked from the platform.</li>
        </ul>
        <p>Our total liability to you for any claim arising from your use of the platform shall not exceed the total amount you have paid to Stadi in the 12 months preceding the claim.</p>
      </Section>

      <Section title="10. Governing Law & Disputes">
        <p>These Terms are governed by the laws of the Republic of Kenya. Any dispute arising from these Terms shall be resolved first through good-faith negotiation, then through mediation, and if unresolved, through the courts of Kenya in the jurisdiction of Kisumu County.</p>
      </Section>

      <Section title="11. Changes to These Terms">
        <p>We may update these Terms at any time. We will notify registered users via SMS or WhatsApp at least 14 days before material changes take effect. Continued use of the platform after the effective date constitutes acceptance of the updated Terms.</p>
      </Section>

      <Section title="12. Contact">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-1">
          <p><strong>{COMPANY}</strong></p>
          <p>📧 <a href={`mailto:${EMAIL}`} className="text-stadi-green hover:underline">{EMAIL}</a></p>
          <p>📱 +254 701 901 244</p>
          <p>📍 Kisumu City, Western Kenya</p>
        </div>
      </Section>

      <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-3">
        <Link to="/privacy" className="text-sm text-stadi-green hover:underline">Privacy Policy →</Link>
        <Link to="/refund"  className="text-sm text-stadi-green hover:underline">Refund Policy →</Link>
        <Link to="/support" className="text-sm text-stadi-green hover:underline">Get Support →</Link>
      </div>
    </div>
  );
}
