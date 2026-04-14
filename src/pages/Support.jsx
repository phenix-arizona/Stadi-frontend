import React from 'react';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-gradient-to-br from-stadi-green to-[#0d4a2f] text-white rounded-3xl p-8 sm:p-10 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75 mb-3">Support</p>
          <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Playfair Display' }}>Get Support</h1>
          <p className="text-sm sm:text-base text-white/85 max-w-2xl leading-relaxed">
            If you need help with payments, course access, certificates, instructor questions, or account issues, our team is ready to help.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mt-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-stadi-dark mb-2">WhatsApp Support</h2>
            <p className="text-sm text-stadi-gray mb-4">Fastest option for urgent learner and payment issues.</p>
            <a
              href="https://wa.me/254701901244"
              target="_blank"
              rel="noreferrer"
              className="btn-primary inline-flex"
            >
              Chat on WhatsApp
            </a>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-stadi-dark mb-2">Email Support</h2>
            <p className="text-sm text-stadi-gray mb-4">Best for certificates, partnership questions, and detailed cases.</p>
            <a href="mailto:info@stadi.ke" className="btn-primary inline-flex">
              Email info@stadi.ke
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mt-6">
          <h2 className="text-lg font-bold text-stadi-dark mb-3">Helpful Details to Include</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-stadi-gray">
            <div>Your phone number used on Stadi</div>
            <div>The course or certificate involved</div>
            <div>M-Pesa transaction code if payment is related</div>
            <div>A short description of the problem and what you expected</div>
          </div>
        </div>
      </div>
    </div>
  );
}
