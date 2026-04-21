import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, MessageCircle } from 'lucide-react';

const LAST_UPDATED = '1 April 2026';
const EMAIL = 'stadiafrika@gmail.com';
const WHATSAPP = '254701901244';

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

export default function RefundPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-block bg-stadi-green-light text-stadi-green text-xs font-bold px-3 py-1 rounded-full mb-4">
          Legal Document
        </div>
        <h1 className="text-3xl font-black text-stadi-dark dark:text-white mb-2" style={{ fontFamily: 'Playfair Display' }}>
          Refund Policy
        </h1>
        <p className="text-stadi-gray text-sm">Last updated: <strong>{LAST_UPDATED}</strong></p>
        <div className="mt-4 bg-stadi-green-light border border-stadi-green/20 rounded-xl p-4 text-sm text-stadi-green font-medium">
          We stand behind every course on Stadi. If you're not satisfied, we make it easy to get your money back without long forms or lengthy disputes.
        </div>
      </div>

      {/* Quick summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-stadi-green-light border border-stadi-green/20 rounded-xl p-4 text-center">
          <CheckCircle size={28} className="text-stadi-green mx-auto mb-2" />
          <div className="font-bold text-stadi-dark dark:text-white text-sm">7-Day Guarantee</div>
          <div className="text-xs text-stadi-gray mt-1">Full refund if &lt;20% complete</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-4 text-center">
          <Clock size={28} className="text-amber-500 mx-auto mb-2" />
          <div className="font-bold text-stadi-dark dark:text-white text-sm">3–5 Business Days</div>
          <div className="text-xs text-stadi-gray mt-1">M-Pesa reversal time</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-4 text-center">
          <XCircle size={28} className="text-red-400 mx-auto mb-2" />
          <div className="font-bold text-stadi-dark dark:text-white text-sm">No Refund After 7 Days</div>
          <div className="text-xs text-stadi-gray mt-1">Or if &gt;20% completed</div>
        </div>
      </div>

      <Section title="1. Our Commitment">
        <p>At Stadi, we want every learner to get real value from every course. If a course doesn't meet your expectations within the first 7 days, we will refund your payment in full — no questions asked, as long as you meet the eligibility criteria below.</p>
      </Section>

      <Section title="2. Refund Eligibility">
        <p>You are eligible for a full refund if <strong>all</strong> of the following conditions are met:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Your refund request is submitted within <strong>7 calendar days</strong> of your enrolment date.</li>
          <li>You have completed <strong>less than 20%</strong> of the course (e.g. fewer than 2 out of 10 lessons).</li>
          <li>You have not downloaded the course certificate.</li>
          <li>You have not shared or redistributed any course content.</li>
        </ul>
        <p>If you have completed 20% or more of the course, we consider the content to have been substantially accessed and a refund will not be issued. In exceptional circumstances (e.g. technical failure preventing access), we will review on a case-by-case basis.</p>
      </Section>

      <Section title="3. Non-Refundable Situations">
        <p>Refunds will <strong>not</strong> be issued in the following cases:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>More than 7 days have passed since enrolment.</li>
          <li>20% or more of the course has been completed.</li>
          <li>The certificate has been downloaded or shared.</li>
          <li>The refund request is for a free course.</li>
          <li>The account has been suspended for Terms of Service violations.</li>
          <li>The refund request is a duplicate (one refund per course, per learner).</li>
          <li>Refund abuse — repeated enrolment and refund of the same or similar courses.</li>
        </ul>
      </Section>

      <Section title="4. Failed Payments">
        <p>If your M-Pesa payment was deducted but you were not enrolled in the course, this is a <strong>failed transaction</strong>, not a refund situation. We will resolve this within <strong>24 hours</strong> by either completing your enrolment or reversing the payment automatically. Contact us immediately via WhatsApp at +254 701 901 244 with your M-Pesa transaction reference.</p>
      </Section>

      <Section title="5. How to Request a Refund">
        <p>To request a refund, contact us via any of the following:</p>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <MessageCircle size={18} className="text-[#25D366] mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-stadi-dark dark:text-white text-sm">WhatsApp (fastest)</div>
              <a href={`https://wa.me/${WHATSAPP}?text=Hi%20Stadi%2C%20I%20would%20like%20to%20request%20a%20refund%20for%20a%20course.`}
                target="_blank" rel="noreferrer"
                className="text-stadi-green hover:underline text-xs">
                Chat on WhatsApp →
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div>
              <div className="font-semibold text-stadi-dark dark:text-white text-sm">Email</div>
              <a href={`mailto:${EMAIL}`} className="text-stadi-green hover:underline text-xs">{EMAIL}</a>
            </div>
          </div>
        </div>
        <p>Please include in your refund request:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your registered phone number.</li>
          <li>The name of the course you wish to refund.</li>
          <li>Your M-Pesa transaction reference (if available).</li>
          <li>A brief reason for the refund (helps us improve).</li>
        </ul>
      </Section>

      <Section title="6. Refund Processing">
        <p>Once your refund is approved:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>We will initiate an M-Pesa B2C reversal to your registered phone number within <strong>1 business day</strong>.</li>
          <li>You will receive the refund in your M-Pesa wallet within <strong>3–5 business days</strong> (subject to Safaricom processing times).</li>
          <li>You will receive an SMS confirmation when the reversal is initiated.</li>
          <li>Your course access will be revoked upon refund approval.</li>
        </ul>
      </Section>

      <Section title="7. Instructor Payouts & Refunds">
        <p>When a learner receives a refund, the corresponding instructor earnings for that transaction are reversed. Instructors are notified of refunds via their dashboard. Repeated high refund rates on a specific course may result in a content review.</p>
      </Section>

      <Section title="8. Contact">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-1">
          <p><strong>Stadi Refunds Team</strong></p>
          <p>Email: <a href={`mailto:${EMAIL}`} className="text-stadi-green hover:underline">{EMAIL}</a></p>
          <p>WhatsApp: <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" className="text-stadi-green hover:underline">+254 701 901 244</a></p>
          <p className="text-xs text-stadi-gray mt-2">Support hours: Monday–Saturday, 8am–6pm EAT</p>
        </div>
      </Section>

      <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-3">
        <Link to="/privacy" className="text-sm text-stadi-green hover:underline">Privacy Policy →</Link>
        <Link to="/terms"   className="text-sm text-stadi-green hover:underline">Terms of Service →</Link>
        <Link to="/support" className="text-sm text-stadi-green hover:underline">Get Support →</Link>
      </div>
    </div>
  );
}
