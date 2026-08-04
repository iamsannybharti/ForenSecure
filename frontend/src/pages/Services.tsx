import React, { useState } from 'react';
import SEO from '../components/SEO';
import { ShieldAlert, Server, Fingerprint, FileText, CheckCircle, PhoneCall } from 'lucide-react';

export default function Services() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', organization: '', email: '', phone: '', service: 'Digital Forensics', details: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) return;
    setSending(true);
    setError('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: `Service request: ${form.service}`,
          message: `Organization: ${form.organization || 'Not provided'}\nPhone: ${form.phone}\n\n${form.details || 'No additional details provided.'}`
        })
      });
      if (!response.ok) throw new Error('request');
      setSubmitted(true);
    } catch {
      setError('Unable to submit your request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const servicesList = [
    {
      title: 'Digital Forensics & Disk Analysis',
      icon: Server,
      desc: 'Bit-stream disk imaging, deleted database carvings, and filesystem metadata audits for corporate computers and portable drives.'
    },
    {
      title: 'Latent Fingerprint Examination',
      icon: Fingerprint,
      desc: 'Fuming developments on complex physical surfaces, ridge comparison reports, and AFIS indexing under expert supervision.'
    },
    {
      title: 'Corporate Auditing & Incident Response',
      icon: ShieldAlert,
      desc: 'Memory dump audits, tracking data breach intrusion points, ransomware analysis, and forensic logging setup.'
    },
    {
      title: 'Document & Handwriting Forgery',
      icon: FileText,
      desc: 'Chemical ink analysis, paper fiber examination, digital signature validations, and handwriting expert opinions.'
    }
  ];

  return (
    <>
      <SEO 
        title="Forensic Consulting & Investigation Services"
        description="ForenSecure provides certified forensic support: digital forensics, cyber crime incident audits, fingerprint analysis, and handwriting experts."
        canonicalPath="/services"
      />

      <div className="relative min-h-screen pt-12 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-brand-darkBg transition-colors duration-300">
        <div className="max-w-5xl mx-auto" data-reveal-stagger>
          
          <div className="text-center mb-16">
            <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-brand-deepBlue/5 dark:bg-brand-glowCyan/10 text-brand-deepBlue dark:text-brand-glowCyan mb-3">
              Consulting Division (Phase 2 Preview)
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight heading-display text-brand-deepBlue dark:text-white mb-3">
              Investigation & Auditing Services
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm max-w-2xl mx-auto">
              Our consulting division provides forensic investigations and corporate vulnerability audits. Contact our team to schedule an accredited analysis or expert witness testimony.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {servicesList.map((srv, idx) => {
              const Icon = srv.icon;
              return (
                <div key={idx} className="p-6 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-brand-darkBorder flex items-center justify-center text-brand-deepBlue dark:text-brand-glowCyan">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-brand-deepBlue dark:text-white">{srv.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{srv.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Callback Request Form */}
          <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-md">
            <h2 className="text-lg font-bold text-brand-deepBlue dark:text-white mb-6 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-brand-glowCyan" />
              Request Expert Case Review
            </h2>

            {submitted ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white">Request Received</h3>
                <p className="text-xs text-slate-500">
                  Our case managers will review your submission and contact you within 24 business hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="serv-name" className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Contact Name</label>
                    <input
                      id="serv-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:ring-1 focus:ring-brand-glowCyan focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="serv-org" className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Organization / Agency</label>
                    <input
                      id="serv-org"
                      type="text"
                      value={form.organization}
                      onChange={e => setForm({...form, organization: e.target.value})}
                      className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:ring-1 focus:ring-brand-glowCyan focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="serv-email" className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                    <input
                      id="serv-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:ring-1 focus:ring-brand-glowCyan focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="serv-phone" className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Phone number</label>
                    <input
                      id="serv-phone"
                      type="tel"
                      required
                      value={form.phone}
                      onChange={e => setForm({...form, phone: e.target.value})}
                      className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:ring-1 focus:ring-brand-glowCyan focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="serv-select" className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Select Service</label>
                  <select
                    id="serv-select"
                    value={form.service}
                    onChange={e => setForm({...form, service: e.target.value})}
                    className="w-full h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-brand-glowCyan focus:outline-none"
                  >
                    <option>Digital Forensics</option>
                    <option>Latent Fingerprint Examination</option>
                    <option>Corporate Incident Audits</option>
                    <option>Document Forgery Analysis</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="serv-details" className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Brief Description of Requirement</label>
                  <textarea
                    id="serv-details"
                    rows={3}
                    value={form.details}
                    onChange={e => setForm({...form, details: e.target.value})}
                    className="w-full p-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder focus:ring-1 focus:ring-brand-glowCyan focus:outline-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-2.5 rounded-lg bg-brand-deepBlue dark:bg-brand-glowBlue hover:bg-brand-glowCyan text-white text-xs font-bold transition-colors"
                >
                  {sending ? 'Submitting...' : 'Submit Case Request'}
                </button>
                {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
              </form>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
