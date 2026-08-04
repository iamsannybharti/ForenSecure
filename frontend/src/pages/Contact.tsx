import React, { useState } from 'react';
import SEO from '../components/SEO';
import { Mail, Phone, MapPin, CheckCircle, Send, Clock, BookOpen, GraduationCap, Handshake, Newspaper, HelpCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    setSending(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setSubmitted(true);
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Submission failed');
      }
    } catch (err) {
      setErrorMsg('Unable to send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const supportCategories = [
    {
      title: 'Learning Support',
      desc: 'Get assistance with course selection, learning resources, certifications, and technical queries.',
      icon: BookOpen
    },
    {
      title: 'Admissions & Enrollment',
      desc: 'Need help choosing the right diploma or certification? Our admissions team is here to guide you through the enrollment process.',
      icon: GraduationCap
    },
    {
      title: 'Academic & Industry Partnerships',
      desc: 'Collaborate with us on education, research, corporate training, or institutional initiatives that advance forensic science.',
      icon: Handshake
    },
    {
      title: 'Media, Events & Collaborations',
      desc: 'Reach out for interviews, speaking opportunities, media requests, educational events, or collaborative initiatives.',
      icon: Newspaper
    }
  ];

  const faqs = [
    {
      q: 'How long does it take to get a response?',
      a: 'Our support team typically responds to all inquiries within 24 business hours.'
    },
    {
      q: 'Who can I contact for diploma and course admissions?',
      a: 'Reach out to our Admissions & Enrollment team directly through this contact form or via email.'
    },
    {
      q: 'Do you offer custom institutional or police training batches?',
      a: 'Yes, we collaborate with police departments, universities, and corporate security teams. Select Academic & Industry Partnerships when getting in touch.'
    },
    {
      q: 'Where are ForenSecure certificates verified?',
      a: 'All digital certificates issued by ForenSecure can be validated directly through our online verification system.'
    }
  ];

  return (
    <>
      <SEO
        title="Let's Connect — ForenSecure Support & Enquiries"
        description="Whether you have a question about our courses, certifications, partnerships, or forensic services, our team is here to help."
        canonicalPath="/contact"
      />

      <div className="relative min-h-screen pt-12 pb-20 bg-slate-50 dark:bg-brand-darkBg transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16" data-reveal-stagger>

          {/* Page Hero Header */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight heading-display text-brand-deepBlue dark:text-white mb-3">
              Let's Connect
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
              Whether you have a question about our courses, certifications, partnerships, or forensic services, our team is here to help. Reach out and we'll get back to you as soon as possible.
            </p>
          </div>

          {/* Form & Info Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Contact Information & Support Hours */}
            <div className="lg:col-span-4 space-y-6">

              <div className="p-6 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-deepBlue dark:text-white mb-1">
                    Connect With Our Team
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Get in touch through email, phone, or visit our office. Whether you're a student, professional, institution, or organization, we're happy to assist you.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <Mail className="w-4 h-4 text-brand-glowCyan mt-0.5" />
                    <div>
                      <span className="block font-bold text-slate-700 dark:text-white">Email</span>
                      <span>imailforensecure@gmail.com</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <Phone className="w-4 h-4 text-brand-glowCyan mt-0.5" />
                    <div>
                      <span className="block font-bold text-slate-700 dark:text-white">Phone</span>
                      <span>+91 9876 543 210</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <MapPin className="w-4 h-4 text-brand-glowCyan mt-0.5" />
                    <div>
                      <span className="block font-bold text-slate-700 dark:text-white">Address</span>
                      <span>New Delhi, India</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Hours */}
              <div className="p-6 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-brand-deepBlue dark:text-white font-bold text-sm">
                  <Clock className="w-4 h-4 text-brand-glowCyan" />
                  <h3>We're Available</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Our team is available during business hours to answer your questions, guide you through our programs, and provide support whenever you need it.
                </p>
                <div className="text-xs font-semibold text-brand-glowBlue dark:text-brand-glowCyan">
                  Monday – Saturday: 9:00 AM – 6:00 PM IST
                </div>
              </div>

            </div>

            {/* Contact Form */}
            <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-extrabold text-brand-deepBlue dark:text-white heading-display mb-1">
                  Tell Us How We Can Help
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Have a question or need guidance? Share your details and we'll connect you with the right team to help you move forward.
                </p>
              </div>

              {submitted ? (
                <div className="py-12 text-center space-y-3">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto animate-bounce" />
                  <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white">Enquiry Received</h3>
                  <p className="text-xs text-slate-500">
                    Thank you for reaching out! Our team will connect with you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="cont-name" className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Your Name</label>
                      <input
                        id="cont-name"
                        type="text"
                        required
                        placeholder="John Doe"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-brand-glowCyan focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="cont-email" className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email Address</label>
                      <input
                        id="cont-email"
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-brand-glowCyan focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cont-sub" className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Subject / Category</label>
                    <input
                      id="cont-sub"
                      type="text"
                      placeholder="Course enquiry, Diploma admission, Partnership..."
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-brand-glowCyan focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="cont-msg" className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Message</label>
                    <textarea
                      id="cont-msg"
                      required
                      rows={5}
                      placeholder="How can we assist you?"
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      className="w-full p-3 rounded-lg text-xs bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-brand-glowCyan focus:outline-none"
                    ></textarea>
                  </div>

                  {errorMsg && (
                    <p className="text-xs font-semibold text-red-500">{errorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-deepBlue dark:bg-brand-glowBlue hover:bg-brand-glowCyan text-white text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Submitting...' : 'Submit Your Enquiry'}
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* Support Categories Section */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-brand-deepBlue dark:text-white heading-display mb-1">
                Support Categories
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct your message to the dedicated department for faster assistance.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {supportCategories.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <div key={cat.title} className="p-5 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-brand-darkBorder flex items-center justify-center text-brand-deepBlue dark:text-brand-glowCyan">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white">{cat.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{cat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-brand-deepBlue dark:text-white heading-display mb-1">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Find quick answers to common questions about admissions, certifications, payments, support, partnerships, and response times before reaching out.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {faqs.map((faq, idx) => (
                <div key={idx} className="space-y-1">
                  <h3 className="text-xs font-bold text-brand-deepBlue dark:text-white flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-brand-glowCyan flex-shrink-0" />
                    {faq.q}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-5">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Map Section */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-brand-deepBlue dark:text-white heading-display mb-1">
                Visit Our Office
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                We'd love to meet you. Visit our office for consultations, admissions guidance, partnership discussions, or general enquiries during business hours.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-brand-darkBg text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <span className="font-bold text-brand-deepBlue dark:text-white block">ForenSecure Headquarters</span>
              <span>New Delhi, India</span>
            </div>
          </div>

          {/* Final Call to Action */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-brand-deepBlue to-slate-900 text-white text-center space-y-4 shadow-xl">
            <h2 className="text-2xl font-extrabold heading-display text-white">
              Ready to Begin Your Forensic Journey?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Whether you're starting your forensic career, looking for professional training, or exploring collaboration opportunities, we're here to help you take the next step.
            </p>
            <div className="pt-2 flex justify-center gap-4">
              <a href="#cont-name" className="px-6 py-2.5 rounded-xl bg-brand-glowCyan text-brand-deepBlue font-bold text-xs hover:bg-white transition-colors inline-flex items-center gap-1.5">
                Start the Conversation <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
