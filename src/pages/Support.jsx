import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle, Mail, Phone, Clock, ChevronDown, ChevronUp,
  BookOpen, CreditCard, Award, Settings, AlertCircle
} from 'lucide-react';

const WHATSAPP = '254701901244';
const EMAIL    = 'support@stadi.ke';

const FAQS = [
  {
    category: 'Payments & Enrolment',
    icon: <CreditCard size={16} className="text-stadi-orange" />,
    items: [
      {
        q: 'I paid via M-Pesa but I'm not enrolled. What do I do?',
        a: 'This sometimes happens due to network delays. Wait 5 minutes and refresh the page. If you're still not enrolled, send us your M-Pesa transaction reference via WhatsApp and we'll resolve it within 2 hours.',
      },
      {
        q: 'Which M-Pesa number should I use to pay?',
        a: 'Use the phone number registered on your Stadi account. The M-Pesa STK push will be sent to that number. If you want to use a different number, update your profile first.',
      },
      {
        q: 'Can I pay for someone else's course?',
        a: 'Currently, payment must be made from the registered phone number on the learner's account. We're working on gift purchases — coming soon.',
      },
      {
        q: 'How do I get a refund?',
        a: 'You can request a full refund within 7 days of enrolment if you've completed less than 20% of the course. Contact us via WhatsApp or email at refunds@stadi.ke. See our full Refund Policy for details.',
      },
    ],
  },
  {
    category: 'Courses & Learning',
    icon: <BookOpen size={16} className="text-stadi-green" />,
    items: [
      {
        q: 'How do I access a course after paying?',
        a: 'After successful M-Pesa payment, go to your Dashboard → My Courses. Your enrolled course will appear there immediately. Tap "Continue Learning" to start.',
      },
      {
        q: 'Can I watch courses without internet?',
        a: 'Yes! Download lessons on Wi-Fi and watch them offline anywhere. Look for the download button on each lesson. Downloaded content is stored on your device.',
      },
      {
        q: 'The video isn't loading. What should I do?',
        a: 'Try switching to Wi-Fi if you're on mobile data. If the issue persists, clear your browser cache or try a different browser. Contact support if the problem continues.',
      },
      {
        q: 'Can I switch the course language?',
        a: 'Yes! Select your preferred language in your profile settings. Course videos available in your language will play automatically. Not all languages are available for every course yet — more languages are being added continuously.',
      },
      {
        q: 'How long do I have access to a course?',
        a: 'Lifetime access. Once enrolled, you can revisit lessons anytime at no extra cost.',
      },
    ],
  },
  {
    category: 'Certificates',
    icon: <Award size={16} className="text-stadi-orange" />,
    items: [
      {
        q: 'How do I earn a certificate?',
        a: 'Complete all lessons in the course and pass the final assessment with the minimum required score (usually 70%). Your certificate is generated automatically and available to download from your Dashboard.',
      },
      {
        q: 'Is the Stadi certificate recognised by employers?',
        a: 'Our certificates are aligned with the Kenya National Qualifications Authority (KNQA) framework and are scannable via QR code. Many employers and clients in Kenya accept Stadi certificates. We are continuously working toward formal recognition.',
      },
      {
        q: 'I passed the assessment but my certificate hasn't appeared.',
        a: 'Certificate generation can take up to 10 minutes. Refresh your Dashboard. If it hasn't appeared after 30 minutes, contact support with your name and course title.',
      },
      {
        q: 'Can someone verify my certificate?',
        a: 'Yes. Anyone can verify your certificate at stadi.co.ke/certificates/verify by entering the certificate number or scanning the QR code.',
      },
    ],
  },
  {
    category: 'Account & Technical',
    icon: <Settings size={16} className="text-stadi-gray" />,
    items: [
      {
        q: 'I didn't receive my OTP. What should I do?',
        a: 'Check that you entered the correct phone number. OTPs expire in 10 minutes. If you still don't receive it, check that your phone can receive SMS, then try again. Contact support if the problem persists.',
      },
      {
        q: 'How do I change my phone number?',
        a: 'Contact support via WhatsApp or email. For security, phone number changes require identity verification and are processed manually within 24 hours.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Email us at privacy@stadi.ke with your registered phone number and the subject line "Account Deletion Request". We will process your request within 30 days per our Privacy Policy.',
      },
      {
        q: 'The app isn't working on my phone. What should I do?',
        a: 'Stadi works on any modern Android or iOS browser. Try opening stadi.co.ke in Chrome or Safari. Clear your cache if you experience issues. Our WhatsApp bot is also always available as an alternative.',
      },
    ],
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="text-sm font-medium text-stadi-dark dark:text-white pr-4">{q}</span>
        {open ? <ChevronUp size={16} className="text-stadi-gray shrink-0" /> : <ChevronDown size={16} className="text-stadi-gray shrink-0" />}
      </button>
      {open && (
        <div className="px-4 py-3 text-sm text-stadi-gray dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
          {a}
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-stadi-dark dark:text-white mb-3" style={{ fontFamily: 'Playfair Display' }}>
          How can we help?
        </h1>
        <p className="text-stadi-gray dark:text-gray-300">
          Our team responds within 4 hours, Monday–Saturday, 8am–6pm EAT.
        </p>
      </div>

      {/* Contact options */}
      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        {/* WhatsApp — primary */}
        <a
          href={`https://wa.me/${WHATSAPP}?text=Hi%20Stadi%20Support%2C%20I%20need%20help%20with...`}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center text-center p-5 bg-[#075E54] rounded-2xl text-white hover:bg-[#064a43] transition-colors group"
        >
          <MessageCircle size={28} className="text-[#25D366] mb-3 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-sm">WhatsApp</div>
          <div className="text-xs text-white/70 mt-1">Fastest — usually under 1 hour</div>
          <div className="mt-3 bg-[#25D366] text-white text-xs font-bold px-3 py-1 rounded-full">Start Chat</div>
        </a>

        {/* Email */}
        <a
          href={`mailto:${EMAIL}`}
          className="flex flex-col items-center text-center p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-stadi-dark dark:text-white hover:border-stadi-green hover:bg-stadi-green-light dark:hover:bg-gray-700 transition-all"
        >
          <Mail size={28} className="text-stadi-green mb-3" />
          <div className="font-bold text-sm">Email</div>
          <div className="text-xs text-stadi-gray dark:text-gray-400 mt-1">Response within 4 hours</div>
          <div className="mt-3 text-xs text-stadi-green font-semibold">{EMAIL}</div>
        </a>

        {/* Emergency */}
        <div className="flex flex-col items-center text-center p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl">
          <AlertCircle size={28} className="text-stadi-orange mb-3" />
          <div className="font-bold text-sm text-stadi-dark dark:text-white">Payment Issues</div>
          <div className="text-xs text-stadi-gray dark:text-gray-400 mt-1">Charged but not enrolled?</div>
          <a
            href={`https://wa.me/${WHATSAPP}?text=Hi%2C%20I%20was%20charged%20via%20M-Pesa%20but%20not%20enrolled.%20My%20transaction%20ref%20is%3A`}
            target="_blank" rel="noreferrer"
            className="mt-3 text-xs text-stadi-orange font-semibold hover:underline"
          >
            Report payment issue →
          </a>
        </div>
      </div>

      {/* Support hours */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-10 flex items-center gap-3">
        <Clock size={18} className="text-stadi-gray shrink-0" />
        <div className="text-sm text-stadi-gray dark:text-gray-300">
          <strong className="text-stadi-dark dark:text-white">Support hours:</strong> Monday–Saturday, 8:00am–6:00pm East Africa Time (EAT).
          WhatsApp messages outside these hours will be answered first thing the next working day.
        </div>
      </div>

      {/* FAQs */}
      <div>
        <h2 className="text-xl font-black text-stadi-dark dark:text-white mb-6" style={{ fontFamily: 'Playfair Display' }}>
          Frequently Asked Questions
        </h2>
        <div className="space-y-8">
          {FAQS.map(cat => (
            <div key={cat.category}>
              <div className="flex items-center gap-2 mb-3">
                {cat.icon}
                <h3 className="font-bold text-stadi-dark dark:text-white text-sm">{cat.category}</h3>
              </div>
              <div className="space-y-2">
                {cat.items.map(item => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Still need help */}
      <div className="mt-12 bg-stadi-green rounded-2xl p-6 text-center text-white">
        <h3 className="font-bold text-lg mb-2">Still need help?</h3>
        <p className="text-white/80 text-sm mb-4">Our team is ready. The fastest way to reach us is WhatsApp.</p>
        <a
          href={`https://wa.me/${WHATSAPP}?text=Hi%20Stadi%2C%20I%20need%20help%20with...`}
          target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 bg-white text-stadi-green font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors"
        >
          <MessageCircle size={18} /> Chat on WhatsApp
        </a>
      </div>

      <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-3">
        <Link to="/privacy" className="text-sm text-stadi-green hover:underline">Privacy Policy →</Link>
        <Link to="/terms"   className="text-sm text-stadi-green hover:underline">Terms of Service →</Link>
        <Link to="/refund"  className="text-sm text-stadi-green hover:underline">Refund Policy →</Link>
      </div>
    </div>
  );
}
