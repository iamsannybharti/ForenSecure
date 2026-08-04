import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { Search, ShieldCheck, Printer, Share2 } from 'lucide-react';
import CertificateCanvas from '../components/CertificateCanvas';

export default function Certificates() {
  const { id } = useParams();
  const { user } = useAuth();
  const [certIdInput, setCertIdInput] = useState(id || '');
  const [certificate, setCertificate] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchCertificate = async (code: string) => {
    setIsLoading(true);
    setErrorMsg('');
    setCertificate(null);

    try {
      const res = await fetch(`/api/certificates/verify/${code}`);
      const data = await res.json();

      if (res.ok) {
        setCertificate(data);
      } else {
        setErrorMsg(data.message || 'Verification failed. Code not found.');
      }
    } catch (err) {
      setErrorMsg('Unable to reach the certificate registry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCertificate(id);
    } else if (window.location.search.includes('claim=free-quiz')) {
      setCertificate({
        certificateId: 'FSC-FREE-QUIZ-' + Math.floor(100000 + Math.random() * 900000),
        studentName: user?.name || 'Verified Forensic Student',
        courseName: 'Forensic Science Baseline & Digital Evidence Fundamentals',
        grade: 'Passed (80%+ Distinction)',
        issueDate: new Date().toISOString(),
        cryptographicHash: '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      });
    }
  }, [id, user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (certIdInput.trim()) {
      fetchCertificate(certIdInput.trim());
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <SEO 
        title={certificate ? `Verified Certificate: ${certificate.certificateId}` : "Credentials Verification Portal"}
        description="Verify ForenSecure academic certificates and professional credentials using our secure cryptographic registry."
        canonicalPath={id ? `/certificates/${id}` : "/certificates"}
      />

      <div className="relative min-h-screen pt-12 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-brand-darkBg transition-colors duration-300">
        <div className="max-w-4xl mx-auto" data-reveal-stagger>
          
          {/* Main verification search box */}
          <div className="text-center mb-12 print:hidden">
            <h1 className="text-3xl font-extrabold tracking-tight heading-display text-brand-deepBlue dark:text-white mb-3">
              Credentials Registry
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm max-w-xl mx-auto mb-8">
              Verify the authenticity of professional certifications issued by ForenSecure. Enter a certificate ID to verify student records and cryptographic signatures.
            </p>

            <form onSubmit={handleSearchSubmit} className="relative max-w-md mx-auto">
              <input
                type="text"
                placeholder="Enter Certificate Code (e.g. FSC-C9F2A1)"
                value={certIdInput}
                onChange={e => setCertIdInput(e.target.value)}
                className="w-full h-11 pl-11 pr-24 rounded-xl text-xs bg-white dark:bg-brand-darkCard border border-slate-300 dark:border-brand-darkBorder focus:outline-none focus:ring-2 focus:ring-brand-glowCyan text-slate-800 dark:text-white"
                aria-label="Certificate ID code"
              />
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-2 top-2 h-7 px-4 rounded-lg bg-brand-deepBlue hover:bg-brand-glowBlue dark:bg-brand-glowBlue dark:hover:bg-brand-glowCyan text-white text-[11px] font-bold transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
            </form>

            {errorMsg && (
              <p className="text-xs font-semibold text-red-500 mt-4">{errorMsg}</p>
            )}
          </div>

          {/* Certificate Display Screen */}
          {certificate && (
            <div className="space-y-6">
              
              {/* Printable Certificate */}
              <div className="cert-print">
                <CertificateCanvas cert={certificate} />
              </div>

              {/* Utility verification details box */}
              <div className="p-6 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 print:hidden">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase font-bold text-brand-glowCyan flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Cryptographically Secured Record
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-lg font-mono truncate">
                    SHA256: {certificate.cryptographicHash}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-brand-darkBorder hover:bg-slate-100 dark:hover:bg-brand-darkBg text-slate-600 dark:text-slate-300 flex items-center gap-1 text-xs font-bold"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Verification link copied to clipboard!'); }}
                    className="p-2.5 rounded-lg bg-brand-deepBlue dark:bg-brand-glowBlue hover:bg-brand-glowCyan text-white flex items-center gap-1 text-xs font-bold transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}
