import React from 'react';

function LegalPageShell({ eyebrow, title, intro, sections }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stadi-green mb-3">{eyebrow}</p>
          <h1 className="text-3xl font-bold text-stadi-dark mb-3" style={{ fontFamily: 'Playfair Display' }}>
            {title}
          </h1>
          <p className="text-stadi-gray text-sm sm:text-base leading-relaxed max-w-2xl">{intro}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-5">
        {sections.map((section) => (
          <section key={section.heading} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-stadi-dark mb-2">{section.heading}</h2>
            <p className="text-sm text-stadi-gray leading-7 whitespace-pre-line">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="We collect only the information needed to run Stadi safely, deliver learning services, process payments, and support learners and instructors across Kenya."
      sections={[
        {
          heading: 'What We Collect',
          body: 'We may collect your name, phone number, email address, county, language preferences, learning activity, payment records, and support history when you use Stadi.',
        },
        {
          heading: 'How We Use It',
          body: 'We use your information to create and secure your account, recommend courses, process M-Pesa payments, issue certificates, improve product quality, and respond to support requests.',
        },
        {
          heading: 'Sharing and Protection',
          body: 'We do not sell your personal information. We share data only with trusted service providers needed to operate the platform, meet legal obligations, or prevent fraud and abuse.',
        },
        {
          heading: 'Your Choices',
          body: 'You can contact Stadi to update key profile details, request support, or ask questions about how your data is handled at info@stadi.ke.',
        },
      ]}
    />
  );
}

export function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Terms of Service"
      intro="By using Stadi, you agree to use the platform lawfully, respect instructors and learners, and avoid misuse of course content, payments, or community features."
      sections={[
        {
          heading: 'Accounts and Access',
          body: 'You are responsible for keeping your login information secure and for ensuring the details you provide are accurate and current.',
        },
        {
          heading: 'Course Access',
          body: 'Course access is granted according to your enrolment and payment status. Access may be limited or revoked in cases of fraud, abuse, or policy violations.',
        },
        {
          heading: 'Platform Conduct',
          body: 'You may not attempt to copy, resell, exploit, disrupt, or unlawfully access Stadi systems, course materials, instructor content, or other user accounts.',
        },
        {
          heading: 'Changes',
          body: 'We may update features, pricing, content, or policies over time. Continued use of Stadi after updates means you accept the revised terms.',
        },
      ]}
    />
  );
}

export function RefundPage() {
  return (
    <LegalPageShell
      eyebrow="Payments"
      title="Refund Policy"
      intro="We want learners to feel confident enrolling. If a paid course is not the right fit, Stadi may offer a refund under the conditions below."
      sections={[
        {
          heading: 'Eligibility',
          body: 'Refund requests are generally considered within 7 days of payment, especially where course access problems occurred or less than 20% of the course has been completed.',
        },
        {
          heading: 'How to Request',
          body: 'To request a refund, contact support with your phone number, course name, payment details, and reason for the request so our team can review it quickly.',
        },
        {
          heading: 'Review Process',
          body: 'Refunds are reviewed case by case. Approved refunds are processed back through the available payment channel, which may take additional time depending on the provider.',
        },
        {
          heading: 'Non-Refundable Situations',
          body: 'We may decline refunds in cases of heavy course consumption, abuse of the policy, duplicate claims, or where the course was delivered as described and fully accessible.',
        },
      ]}
    />
  );
}

