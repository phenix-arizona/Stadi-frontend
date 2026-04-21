import React from 'react';
import { Link } from 'react-router-dom';

const LAST_UPDATED = '1 April 2026';
const COMPANY = 'Stadi Learning Platform Ltd';
const EMAIL = 'privacy@stadi.ke';
const PHONE = '+254 701 901 244';
const ADDRESS = 'Kisumu City, Western Kenya';

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

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-block bg-stadi-green-light text-stadi-green text-xs font-bold px-3 py-1 rounded-full mb-4">
          Legal Document
        </div>
        <h1 className="text-3xl font-black text-stadi-dark dark:text-white mb-2" style={{ fontFamily: 'Playfair Display' }}>
          Privacy Policy
        </h1>
        <p className="text-stadi-gray text-sm">
          Last updated: <strong>{LAST_UPDATED}</strong> · Effective immediately
        </p>
        <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
          This policy applies to all users of the Stadi platform — website, mobile app, and WhatsApp bot. It complies with the <strong>Kenya Data Protection Act 2019</strong> and is registered with the <strong>Office of the Data Protection Commissioner (ODPC)</strong>.
        </div>
      </div>

      <Section title="1. Who We Are">
        <p><strong>{COMPANY}</strong> ("Stadi", "we", "us", or "our") operates the Stadi learning platform, accessible at stadi.co.ke, via our mobile application, and via WhatsApp. We are registered in Kenya and are a data controller under the Kenya Data Protection Act 2019.</p>
        <p>Contact our Data Protection Officer at: <a href={`mailto:${EMAIL}`} className="text-stadi-green hover:underline">{EMAIL}</a> or {PHONE}.</p>
      </Section>

      <Section title="2. Data We Collect">
        <p>We collect the following categories of personal data:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Identity data:</strong> your name (if provided), phone number, and profile photo (optional).</li>
          <li><strong>Contact data:</strong> phone number used for OTP login and M-Pesa payments.</li>
          <li><strong>Payment data:</strong> M-Pesa transaction references and payment status. We do not store your M-Pesa PIN or full payment credentials.</li>
          <li><strong>Learning data:</strong> courses enrolled, lessons completed, quiz scores, certificates earned, and learning streaks.</li>
          <li><strong>Device data:</strong> device type, operating system, browser, and IP address for security and offline access.</li>
          <li><strong>Usage data:</strong> pages visited, features used, and session duration — collected via anonymised analytics.</li>
          <li><strong>Language preference:</strong> your preferred learning language.</li>
          <li><strong>WhatsApp data:</strong> your WhatsApp number and message content when using our WhatsApp bot.</li>
          <li><strong>Location data:</strong> county of residence, if voluntarily provided for course recommendations.</li>
        </ul>
        <p>We do <strong>not</strong> collect sensitive personal data such as national ID numbers, biometric data, or financial account details beyond M-Pesa transaction references.</p>
      </Section>

      <Section title="3. How We Use Your Data">
        <p>We use your personal data to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Verify your identity via OTP and create your account.</li>
          <li>Process M-Pesa payments and manage course enrolments.</li>
          <li>Deliver course content in your preferred language.</li>
          <li>Issue and verify certificates of completion.</li>
          <li>Send learning reminders, streak notifications, and important account updates via SMS or WhatsApp.</li>
          <li>Provide customer support and resolve disputes.</li>
          <li>Improve platform features based on aggregated, anonymised usage patterns.</li>
          <li>Comply with legal and regulatory obligations in Kenya.</li>
        </ul>
        <p>We do <strong>not</strong> sell your personal data to third parties. We do <strong>not</strong> use your data for advertising profiling or share it with advertisers.</p>
      </Section>

      <Section title="4. Legal Basis for Processing">
        <p>Under the Kenya Data Protection Act 2019, we process your data on the following lawful bases:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Contract performance:</strong> to provide the service you signed up for.</li>
          <li><strong>Legitimate interests:</strong> to operate and improve the platform securely.</li>
          <li><strong>Legal obligation:</strong> to comply with Kenyan law, including tax and financial regulations.</li>
          <li><strong>Consent:</strong> for optional notifications and marketing communications, which you may withdraw at any time.</li>
        </ul>
      </Section>

      <Section title="5. Data Sharing">
        <p>We share your data only with trusted service providers who are contractually bound to protect it:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Supabase</strong> — database hosting (EU-based servers with adequate protection measures).</li>
          <li><strong>Safaricom / M-Pesa</strong> — payment processing.</li>
          <li><strong>Africa's Talking</strong> — SMS OTP delivery.</li>
          <li><strong>Twilio</strong> — WhatsApp bot infrastructure.</li>
          <li><strong>Cloudinary</strong> — video and image hosting.</li>
          <li><strong>Railway</strong> — cloud hosting and infrastructure.</li>
        </ul>
        <p>We may also disclose your data to Kenyan law enforcement or regulatory bodies when required by law and after due verification of the request.</p>
      </Section>

      <Section title="6. Data Retention">
        <p>We retain your personal data for as long as your account is active. If you request deletion, we will delete your personal data within <strong>30 days</strong>, except where we are legally required to retain certain records (e.g. payment records for tax purposes, which are retained for 7 years under Kenyan tax law).</p>
        <p>Anonymised learning analytics may be retained indefinitely as they cannot identify you.</p>
      </Section>

      <Section title="7. Your Rights">
        <p>Under the Kenya Data Protection Act 2019, you have the right to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Access</strong> a copy of the personal data we hold about you.</li>
          <li><strong>Correct</strong> inaccurate or incomplete personal data.</li>
          <li><strong>Delete</strong> your personal data ("right to be forgotten"), subject to legal retention requirements.</li>
          <li><strong>Object</strong> to processing of your data for direct marketing.</li>
          <li><strong>Withdraw consent</strong> for optional processing at any time.</li>
          <li><strong>Lodge a complaint</strong> with the Office of the Data Protection Commissioner (ODPC) at odpc.go.ke.</li>
        </ul>
        <p>To exercise any of these rights, contact us at <a href={`mailto:${EMAIL}`} className="text-stadi-green hover:underline">{EMAIL}</a>. We will respond within <strong>21 days</strong>.</p>
      </Section>

      <Section title="8. Security">
        <p>We implement industry-standard security measures including:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>OTP-based authentication — no passwords stored.</li>
          <li>HTTPS encryption for all data in transit.</li>
          <li>Row-level security on our database.</li>
          <li>Access controls limiting staff access to personal data.</li>
          <li>Regular security reviews.</li>
        </ul>
        <p>Despite these measures, no internet transmission is completely secure. Please notify us immediately at {EMAIL} if you suspect any unauthorised access to your account.</p>
      </Section>

      <Section title="9. Cookies">
        <p>We use essential cookies and local storage to maintain your login session and language preferences. We do not use advertising or tracking cookies. You may clear your browser's local storage at any time without affecting your account.</p>
      </Section>

      <Section title="10. Children">
        <p>Our platform is intended for users aged 16 and above. We do not knowingly collect personal data from children under 16. If you believe a child has created an account, please contact us at {EMAIL} and we will delete the account promptly.</p>
      </Section>

      <Section title="11. Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes via SMS or WhatsApp at least 14 days before the changes take effect. Continued use of the platform after the effective date constitutes acceptance of the updated policy.</p>
      </Section>

      <Section title="12. Contact Us">
        <p>For any privacy-related questions or requests:</p>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-1">
          <p><strong>Data Protection Officer — {COMPANY}</strong></p>
          <p>📧 <a href={`mailto:${EMAIL}`} className="text-stadi-green hover:underline">{EMAIL}</a></p>
          <p>📱 <a href={`https://wa.me/254701901244`} className="text-stadi-green hover:underline">{PHONE}</a></p>
          <p>📍 {ADDRESS}</p>
        </div>
      </Section>

      {/* Nav to other legal pages */}
      <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-3">
        <Link to="/terms"  className="text-sm text-stadi-green hover:underline">Terms of Service →</Link>
        <Link to="/refund" className="text-sm text-stadi-green hover:underline">Refund Policy →</Link>
        <Link to="/support" className="text-sm text-stadi-green hover:underline">Get Support →</Link>
      </div>
    </div>
  );
}
