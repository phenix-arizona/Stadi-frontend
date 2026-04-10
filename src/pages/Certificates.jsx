import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery }        from '@tanstack/react-query';
import { Award, Download, Share2, CheckCircle, XCircle, Loader2, QrCode } from 'lucide-react';
import { certificates }   from '../lib/api';
import { Button, Skeleton } from '../components/ui';

// ── Certificate Card visual ───────────────────────────────────
function CertificateCard({ cert }) {
  return (
    <div className="relative bg-gradient-to-br from-stadi-green via-[#155a3e] to-[#0f3d27] rounded-2xl p-8 text-white shadow-2xl overflow-hidden">
      {/* Decorative corners */}
      <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-stadi-orange/60 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-stadi-orange/60 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-stadi-orange/60 rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-stadi-orange/60 rounded-br-lg" />

      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-stadi-orange/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 text-center">
        {/* Brand */}
        <div className="text-xs font-semibold text-white/60 uppercase tracking-[4px] mb-2">Stadi Learning Platform</div>
        <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Playfair Display' }}>STADI</div>
        <div className="text-xs text-stadi-orange font-semibold uppercase tracking-[3px] mb-6">Certificate of Completion</div>

        {/* Divider */}
        <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-stadi-orange to-transparent mx-auto mb-6" />

        <div className="text-sm text-white/70 mb-2">This certifies that</div>
        <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Playfair Display' }}>
          {cert.users?.name || 'Graduate'}
        </div>
        <div className="text-sm text-white/70 mb-6">has successfully completed</div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 mb-6 inline-block">
          <div className="text-xl font-bold text-white">{cert.courses?.title}</div>
          <div className="text-xs text-stadi-orange mt-1">{cert.courses?.categories?.name}</div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end text-xs text-white/50 mt-2">
          <div>
            <div className="text-white/70 font-semibold">Certificate #</div>
            <div className="font-mono text-white">{cert.certificate_number}</div>
          </div>
          <div className="text-center">
            <div className="text-white/70 font-semibold">Felix Sawo</div>
            <div className="text-white/40 text-[10px]">Founder & CEO, Stadi</div>
          </div>
          <div className="text-right">
            <div className="text-white/70 font-semibold">Date Issued</div>
            <div className="text-white">
              {new Date(cert.issued_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── My Certificates page ──────────────────────────────────────
export function MyCertificatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['certificates', 'my'],
    queryFn:  certificates.list,
  });

  const certList = data?.data || [];

  const shareWhatsApp = (cert) => {
    const text = encodeURIComponent(
      `🏆 I earned my Stadi Certificate in "${cert.courses?.title}"!\n\nVerify it here: https://stadi.ke/certificates/verify/${cert.certificate_number}\n\nJoin me on Stadi — Learn Skills. Start Earning.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
      {[1,2].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stadi-dark" style={{ fontFamily: 'Playfair Display' }}>
            🏆 My Certificates
          </h1>
          <p className="text-stadi-gray text-sm mt-1">
            {certList.length} certificate{certList.length !== 1 ? 's' : ''} earned
          </p>
        </div>
        <Link to="/courses" className="text-sm text-stadi-green hover:underline">Earn more →</Link>
      </div>

      {certList.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-lg font-bold text-stadi-dark mb-2">No certificates yet</h3>
          <p className="text-stadi-gray text-sm mb-6 max-w-sm mx-auto">
            Complete a course and pass the final assessment to earn your first Stadi certificate.
          </p>
          <Link to="/courses"><Button variant="primary">Browse Courses</Button></Link>
        </div>
      ) : (
        <div className="space-y-8">
          {certList.map(cert => (
            <div key={cert.id} className="space-y-4">
              <CertificateCard cert={cert} />

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {cert.pdf_url && (
                  <a href={cert.pdf_url} target="_blank" rel="noreferrer" download>
                    <Button variant="primary" size="sm">
                      <Download size={14} /> Download PDF
                    </Button>
                  </a>
                )}
                <Button variant="outline" size="sm" onClick={() => shareWhatsApp(cert)}>
                  <Share2 size={14} /> Share on WhatsApp
                </Button>
                <Link to={`/certificates/verify/${cert.certificate_number}`}>
                  <Button variant="ghost" size="sm" className="border border-gray-200">
                    <QrCode size={14} /> Verify Certificate
                  </Button>
                </Link>
              </div>

              {/* Certificate details */}
              <div className="bg-stadi-green-light rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><div className="text-xs text-stadi-gray">Certificate #</div><div className="font-mono font-semibold text-stadi-dark text-xs">{cert.certificate_number}</div></div>
                <div><div className="text-xs text-stadi-gray">Course</div><div className="font-semibold text-stadi-dark text-xs truncate">{cert.courses?.title}</div></div>
                <div><div className="text-xs text-stadi-gray">Issued</div><div className="font-semibold text-stadi-dark text-xs">{new Date(cert.issued_at).toLocaleDateString('en-KE')}</div></div>
                <div><div className="text-xs text-stadi-gray">Status</div><div className={`font-semibold text-xs ${cert.is_valid ? 'text-stadi-green' : 'text-red-500'}`}>{cert.is_valid ? '✓ Valid' : '✗ Revoked'}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Certificate Verify page ───────────────────────────────────
export function CertificateVerifyPage() {
  const { number } = useParams();
  const [input, setInput] = useState(number || '');
  const [queried, setQueried] = useState(number || '');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cert-verify', queried],
    queryFn:  () => certificates.verify(queried),
    enabled:  !!queried,
    retry: false,
  });

  const result = data?.data;

  const handleVerify = () => {
    setQueried(input.trim().toUpperCase());
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">📜</div>
        <h1 className="text-2xl font-bold text-stadi-dark mb-2" style={{ fontFamily: 'Playfair Display' }}>
          Verify a Certificate
        </h1>
        <p className="text-stadi-gray text-sm">
          Enter the certificate number to confirm its authenticity
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-8">
        <input
          value={input}
          onChange={e => setInput(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleVerify()}
          placeholder="e.g. STD-2025-AB12CD34"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-stadi-green uppercase"
        />
        <Button variant="primary" onClick={handleVerify} loading={isLoading} disabled={!input.trim()}>
          Verify
        </Button>
      </div>

      {/* Result */}
      {isLoading && (
        <div className="text-center py-8">
          <Loader2 size={32} className="animate-spin text-stadi-green mx-auto mb-2" />
          <p className="text-stadi-gray text-sm">Checking certificate...</p>
        </div>
      )}

      {result && !isLoading && (
        <div className={`rounded-2xl p-6 border-2 ${result.valid ? 'bg-stadi-green-light border-stadi-green/30' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            {result.valid
              ? <CheckCircle size={32} className="text-stadi-green" />
              : <XCircle    size={32} className="text-red-500" />
            }
            <div>
              <div className={`text-lg font-bold ${result.valid ? 'text-stadi-green' : 'text-red-600'}`}>
                {result.valid ? '✅ Valid Certificate' : '❌ Certificate Revoked or Invalid'}
              </div>
              <div className="text-xs text-stadi-gray">Stadi Learning Platform</div>
            </div>
          </div>

          {result.valid && (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-stadi-green/20 pb-2">
                <dt className="text-stadi-gray">Learner Name</dt>
                <dd className="font-bold text-stadi-dark">{result.learnerName}</dd>
              </div>
              <div className="flex justify-between border-b border-stadi-green/20 pb-2">
                <dt className="text-stadi-gray">Course Completed</dt>
                <dd className="font-bold text-stadi-dark text-right max-w-[200px]">{result.courseTitle}</dd>
              </div>
              <div className="flex justify-between border-b border-stadi-green/20 pb-2">
                <dt className="text-stadi-gray">Category</dt>
                <dd className="font-semibold text-stadi-dark">{result.category}</dd>
              </div>
              <div className="flex justify-between border-b border-stadi-green/20 pb-2">
                <dt className="text-stadi-gray">Certificate Number</dt>
                <dd className="font-mono font-bold text-stadi-dark">{result.certificateNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stadi-gray">Date Issued</dt>
                <dd className="font-semibold text-stadi-dark">
                  {new Date(result.issuedAt).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
                </dd>
              </div>
            </dl>
          )}

          {!result.valid && (
            <p className="text-sm text-red-600 mt-2">
              This certificate has been revoked or does not exist. Contact <a href="mailto:support@stadi.ke" className="underline">support@stadi.ke</a> for assistance.
            </p>
          )}
        </div>
      )}

      {!result && queried && !isLoading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-stadi-gray text-sm">
            Certificate <strong className="font-mono">{queried}</strong> not found.
            <br />Please check the number and try again.
          </p>
        </div>
      )}

      {/* How to find certificate number */}
      <div className="mt-8 bg-gray-50 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-stadi-dark mb-2">Where to find the certificate number?</h3>
        <ul className="text-xs text-stadi-gray space-y-1">
          <li>• It is printed on the certificate PDF (e.g. STD-2025-XXXXXXXX)</li>
          <li>• Scan the QR code on the certificate to be taken directly to this page</li>
          <li>• The learner can find it in their Stadi dashboard under "My Certificates"</li>
        </ul>
      </div>
    </div>
  );
}
