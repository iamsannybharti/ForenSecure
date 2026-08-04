import { useEffect, useState } from 'react';
import SEO from '../components/SEO';
import { User } from 'lucide-react';

export default function Faculty() {
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/team-members')
      .then(res => (res.ok ? res.json() : Promise.reject(new Error('faculty'))))
      .then(data => setMembers(Array.isArray(data) ? data : []))
      .catch(() => setMembers([]));
  }, []);

  return (
    <>
      <SEO 
        title="Faculty & Investigators Core Directory"
        description="Meet the senior staff scientists and former Central Forensic Science Laboratory directors leading academic training at ForenSecure."
        canonicalPath="/faculty"
      />

      <div className="relative min-h-screen pt-12 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-brand-darkBg transition-colors duration-300">
        <div className="max-w-5xl mx-auto" data-reveal-stagger>
          
          <div className="text-center mb-16">
            <h1 className="text-3xl font-extrabold tracking-tight heading-display text-brand-deepBlue dark:text-white mb-3">
              Faculty Directory
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm max-w-xl mx-auto">
              Learn directly from veteran examiners. Our faculty consists of retired government scientists, CFSL directors, and cybersecurity legal experts.
            </p>
          </div>

          <div className="space-y-8">
            {members.map(m => (
              <div 
                key={m.id}
                className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm flex flex-col md:flex-row gap-6 items-start"
              >
                {/* Faculty placeholder avatar with icon */}
                <div className="flex-shrink-0 w-24 h-24 rounded-2xl bg-gradient-to-tr from-brand-deepBlue to-brand-glowBlue text-white flex items-center justify-center">
                  <User className="w-12 h-12" />
                </div>

                {/* Faculty profile details */}
                <div className="flex-grow space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-brand-deepBlue dark:text-white leading-tight">
                      {m.name}
                    </h2>
                    <span className="text-xs text-slate-400 block mt-0.5 font-medium">{m.role}</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {m.description}
                  </p>
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
