import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import CourseThumbnail from '../components/CourseThumbnail';
import CourseStatusBadge from '../components/CourseStatusBadge';
import { courseStatus } from '../lib/courseStatus';
import { sessionTimeRange } from '../lib/calendar';
import { Briefcase, Calendar, Users, GraduationCap, FileText, CheckCircle } from 'lucide-react';

export default function Diplomas() {
  const [downloadSubmitted, setDownloadSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [diplomas, setDiplomas] = useState<any[]>([]);
  const [liveClasses, setLiveClasses] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/courses')
      .then(res => (res.ok ? res.json() : []))
      .then(data => setDiplomas((Array.isArray(data) ? data : []).filter((c: any) => c.format === 'diploma')))
      .catch(() => setDiplomas([]));

    fetch('/api/seminars')
      .then(res => (res.ok ? res.json() : []))
      .then(data => setLiveClasses(
        (Array.isArray(data) ? data : [])
          .filter((s: any) => new Date(s.date).getTime() >= Date.now())
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      ))
      .catch(() => setLiveClasses([]));
  }, []);

  const handleBrochureDownload = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setDownloadSubmitted(true);
      setEmail('');
    }
  };

  // Upcoming programs are not open for self-service enrolment yet, so their Details button
  // routes to the contact page instead of the course player.
  const detailsHref = (diploma: any) =>
    courseStatus(diploma) === 'upcoming'
      ? `/contact?program=${encodeURIComponent(diploma.slug || diploma.title)}`
      : `/courses/${diploma.slug}`;

  return (
    <>
      <SEO 
        title="Professional Forensic Diplomas (1-Year Programs)"
        description="Earn post-graduate and professional diplomas in digital forensics, cyber crime law, and physical crime scene management with guaranteed internships."
        canonicalPath="/diplomas"
      />

      <div className="relative min-h-screen pt-12 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-brand-darkBg transition-colors duration-300">
        <div className="max-w-6xl mx-auto" data-reveal-stagger>
          
          <div className="text-center mb-16">
            <h1 className="text-3xl font-extrabold tracking-tight heading-display text-brand-deepBlue dark:text-white mb-3">
              Forensic Diploma Programs
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm max-w-2xl mx-auto">
              Our 1-year diplomas provide comprehensive academic training. Programs feature practical weekend laboratory camps and direct industry placement opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <div className="p-6 bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder rounded-2xl text-center">
              <Briefcase className="w-8 h-8 text-brand-glowCyan mx-auto mb-3" />
              <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white mb-1">Guaranteed Placements</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Direct interview pipelines with security cells, cyber cells, and private accounting teams.</p>
            </div>
            <div className="p-6 bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder rounded-2xl text-center">
              <Calendar className="w-8 h-8 text-brand-glowCyan mx-auto mb-3" />
              <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white mb-1">Hybrid Schedule</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Self-paced virtual modules combined with 3 physical laboratory residency camps.</p>
            </div>
            <div className="p-6 bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder rounded-2xl text-center">
              <GraduationCap className="w-8 h-8 text-brand-glowCyan mx-auto mb-3" />
              <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white mb-1">Expert Faculty</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Mentorship reviews by retired directors from Central Forensic Science Laboratories.</p>
            </div>
          </div>

          {/* Diploma programs + live class schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left: diploma list */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-2xl font-extrabold text-brand-deepBlue dark:text-white heading-display tracking-tight">
                Professional Diplomas
              </h2>

              {diplomas.length > 0 ? (
                diplomas.map(diploma => {
                  const status = courseStatus(diploma);
                  return (
                    <article
                      key={diploma.id || diploma.slug}
                      className="p-4 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm hover:shadow-md transition-shadow flex gap-4"
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-[72px] rounded-xl overflow-hidden flex-shrink-0 bg-slate-900">
                        <CourseThumbnail src={diploma.thumbnailUrl} title={diploma.title} seed={diploma.slug || diploma.id} />
                      </div>

                      <div className="flex-grow min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-extrabold text-brand-deepBlue dark:text-white leading-snug">
                            {diploma.title}
                          </h3>
                          {status !== 'self-paced' && <CourseStatusBadge status={status} />}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" aria-hidden="true" />
                            {diploma.durationWeeks ? `${diploma.durationWeeks} weeks` : 'Flexible schedule'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" aria-hidden="true" />
                            {diploma.instructorName || 'Mentor Support'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-1">
                          <span className="text-sm font-extrabold text-brand-glowBlue dark:text-brand-glowCyan">
                            ₹{diploma.priceINR?.toLocaleString('en-IN') || '—'}
                          </span>
                          <Link
                            to={detailsHref(diploma)}
                            className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-glowBlue dark:hover:text-brand-glowCyan"
                          >
                            {status === 'upcoming' ? 'Enquire' : 'Details'}
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="p-8 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder text-center">
                  <GraduationCap className="w-8 h-8 text-slate-400 mx-auto mb-3" aria-hidden="true" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Diploma intakes are being finalised. <Link to="/contact" className="font-bold text-brand-glowBlue dark:text-brand-glowCyan hover:underline">Talk to an advisor</Link> to be notified first.
                  </p>
                </div>
              )}
            </div>

            {/* Right: live class schedule */}
            <div className="lg:col-span-5 rounded-2xl bg-[#0b1329] border border-slate-800 p-6 text-white">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h2 className="text-xl font-extrabold tracking-tight">Live Classes</h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600/20 text-blue-300 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 live-dot" aria-hidden="true" />
                  Upcoming
                </span>
              </div>

              {liveClasses.length > 0 ? (
                <ul className="space-y-3">
                  {liveClasses.slice(0, 3).map((session, idx) => (
                    <li key={session.id || idx} className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 sm:w-14 flex-shrink-0 rounded-lg bg-slate-800/80 py-2 text-center">
                        <span className="block text-[10px] font-bold uppercase text-slate-400">
                          {new Date(session.date).toLocaleDateString(undefined, { month: 'short' })}
                        </span>
                        <span className="block text-base font-extrabold leading-none mt-0.5">
                          {new Date(session.date).getDate().toString().padStart(2, '0')}
                        </span>
                      </div>

                      <div className="flex-grow min-w-0">
                        <span className="block text-sm font-bold truncate">{session.title}</span>
                        <span className="block text-[11px] text-slate-400">
                          {sessionTimeRange(session.date, session.durationMinutes)}
                          {session.courseTitle ? ` · ${session.courseTitle}` : ''}
                        </span>
                      </div>

                      <a
                        href={session.link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold flex-shrink-0 transition-colors"
                      >
                        Join<span className="sr-only"> {session.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No live classes scheduled right now.</p>
              )}

              <Link
                to="/seminars"
                className="block text-center text-xs font-bold text-slate-200 hover:text-white mt-6 pt-4 border-t border-slate-800"
              >
                View Full Schedule
              </Link>
            </div>

          </div>

          {/* Brochure request card */}
          <div className="mt-16 p-8 rounded-3xl bg-brand-deepBlue text-white dark:bg-brand-darkCard border border-slate-700/50 dark:border-brand-darkBorder flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md">
              <h3 className="text-lg font-bold heading-display mb-2 flex items-center gap-2 text-white">
                <FileText className="w-5 h-5 text-brand-glowCyan" />
                Request Program Curriculum brochure
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Download the detailed syllabus brochure, batch intake capacities, internship details, and physical residency camp locations schedules.
              </p>
            </div>
            
            <form onSubmit={handleBrochureDownload} className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
              {downloadSubmitted ? (
                <span className="text-xs text-brand-glowCyan font-bold py-2.5 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Curriculum brochure link sent to email!
                </span>
              ) : (
                <>
                  <input
                    type="email"
                    placeholder="Enter academic email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-10 px-3 w-full sm:w-60 rounded-xl text-xs bg-white/10 dark:bg-brand-darkBg border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-brand-glowCyan"
                    aria-label="Email address for brochure download"
                  />
                  <button
                    type="submit"
                    className="h-10 px-4 rounded-xl text-xs font-bold bg-brand-glowCyan hover:bg-brand-glowBlue hover:text-white text-slate-900 transition-colors"
                  >
                    Download
                  </button>
                </>
              )}
            </form>
          </div>

        </div>
      </div>
    </>
  );
}
