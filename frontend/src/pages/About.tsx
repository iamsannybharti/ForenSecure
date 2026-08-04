import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Shield, Award, Users, Lightbulb, Compass, Milestone, ArrowRight } from 'lucide-react';

export default function About() {
  // Admin-managed roster; only active members are returned by the API.
  const [team, setTeam] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/team-members')
      .then(res => res.json())
      .then(data => setTeam(Array.isArray(data) ? data : []))
      .catch(() => setTeam([]));
  }, []);

  const coreValues = [
    {
      name: 'Excellence',
      description: 'We prioritize quality, scientific accuracy, and industry-relevant learning.',
      icon: Award
    },
    {
      name: 'Accessibility',
      description: 'Making forensic education available to learners from every background.',
      icon: Compass
    },
    {
      name: 'Integrity',
      description: 'Upholding ethics, transparency, and professional responsibility in everything we do.',
      icon: Shield
    },
    {
      name: 'Innovation',
      description: 'Continuously improving through technology, research, and modern investigative practices.',
      icon: Lightbulb
    }
  ];

  const founders = [
    {
      name: 'Kshitize Shukla',
      initials: 'KS',
      role: 'Founder & Director',
      desc: 'Forensic science graduate (SGT University) with an MSc from Anjaneya University, specializing in forensic toxicology and medicine.'
    },
    {
      name: 'Tiya Takshak',
      initials: 'TT',
      role: 'Founder & Director',
      desc: 'Forensic science graduate (SGT University) with an MSc in Forensic Chemistry from the University of Strathclyde, Glasgow.'
    },
    {
      name: 'Sanny Bharti',
      initials: 'SB',
      role: 'Co-Founder & Head of Technology',
      desc: "Computer Science engineer (CSVTU Bhilai) with 4+ years in software development, leading ForenSecure's technology and product strategy."
    }
  ];

  const milestones = [
    {
      title: 'The Beginning',
      desc: 'Started with a vision to make forensic education practical and accessible.'
    },
    {
      title: 'Launching Practical Learning',
      desc: 'Introduced industry-focused courses and certifications.'
    },
    {
      title: 'Expanding Learning Opportunities',
      desc: 'Developed advanced programs through academic and industry collaborations.'
    },
    {
      title: 'Growing Community',
      desc: 'Building a strong network of learners and professionals across India.'
    },
    {
      title: 'The Next Chapter',
      desc: 'Expanding into professional forensic and digital investigation services.'
    }
  ];

  return (
    <>
      <SEO 
        title="About Us — Empowering the Future of Digital & Forensic Science"
        description="At ForenSecure, we're building a platform that bridges forensic education, practical skills, and industry readiness."
        canonicalPath="/about"
      />

      <div className="relative min-h-screen pt-12 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-brand-darkBg transition-colors duration-300">
        <div className="max-w-4xl mx-auto space-y-12" data-reveal-stagger>
          
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-brand-deepBlue dark:bg-brand-darkBorder dark:text-brand-glowCyan">
              <Shield className="w-3.5 h-3.5" /> About ForenSecure
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight heading-display text-brand-deepBlue dark:text-white">
              Empowering the Future of Digital &amp; Forensic Science
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
              At ForenSecure, we're building a platform that bridges forensic education, practical skills, and industry readiness. Our mission is to prepare learners and professionals with the knowledge and experience needed for the evolving world of forensic science.
            </p>
          </div>

          {/* Story Section */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-brand-glowBlue dark:text-brand-glowCyan text-xs font-bold uppercase tracking-wider">
              <Milestone className="w-4 h-4" />
              <span>Our Story</span>
            </div>
            <h2 className="text-xl font-extrabold text-brand-deepBlue dark:text-white heading-display">
              Our Journey: From an Idea to a Growing Forensic Platform
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              What began as a vision to make forensic education more practical has grown into a platform offering skill-based learning, certifications, and career-focused programs. As we continue to evolve, we're expanding into research collaborations, industry partnerships, and investigation support services to create a complete forensic ecosystem.
            </p>
          </div>

          {/* Mission & Core Values */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-extrabold text-brand-deepBlue dark:text-white heading-display">
                Our Mission &amp; Core Values
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
                Every decision we make is driven by our commitment to quality education, practical learning, ethical practices, and continuous innovation in forensic science.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {coreValues.map((val) => {
                const IconComponent = val.icon;
                return (
                  <div key={val.name} className="p-6 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-brand-darkBorder flex items-center justify-center text-brand-deepBlue dark:text-brand-glowCyan">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white">{val.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {val.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Founders & Directors */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Meet the owners, board members, and specialist teams behind ForenSecure</p>
              <h2 className="text-2xl font-extrabold text-brand-deepBlue dark:text-white heading-display">
                Founders &amp; Directors
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
                Visionary leadership and forensic expertise
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {founders.map((f) => (
                <div key={f.name} className="p-6 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-brand-darkBorder flex items-center justify-center mx-auto text-lg font-extrabold text-brand-deepBlue dark:text-brand-glowCyan">
                    {f.initials}
                  </div>
                  <h4 className="text-base font-bold text-brand-deepBlue dark:text-white">{f.name}</h4>
                  <span className="text-xs font-semibold text-brand-glowBlue dark:text-brand-glowCyan block">{f.role}</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Meet the Team */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-extrabold text-brand-deepBlue dark:text-white heading-display">
                Meet the Experts Behind ForenSecure
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
                A multidisciplinary team of educators, forensic professionals, cybersecurity experts, and industry mentors working together to shape the future of forensic learning.
              </p>
            </div>

            {team.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {team.map((member) => (
                  <div key={member.id} className="p-5 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-brand-darkBg flex items-center justify-center mx-auto text-brand-glowBlue dark:text-brand-glowCyan">
                      <Users className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-brand-deepBlue dark:text-white">{member.name}</h4>
                    <span className="text-xs font-semibold text-brand-glowBlue dark:text-brand-glowCyan block">{member.role}</span>
                    {member.description && <p className="text-[11px] text-slate-400">{member.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Milestones Timeline */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-6">
            <h2 className="text-xl font-extrabold text-brand-deepBlue dark:text-white heading-display">
              Our Journey &amp; Milestones
            </h2>
            <div className="space-y-4 border-l-2 border-slate-200 dark:border-brand-darkBorder pl-4 sm:pl-6 ml-2">
              {milestones.map((m, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[25px] sm:-left-[33px] top-1.5 w-3 h-3 rounded-full bg-brand-deepBlue dark:bg-brand-glowCyan" />
                  <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white">{m.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Final Call to Action */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-brand-deepBlue to-slate-900 text-white text-center space-y-4 shadow-xl">
            <h2 className="text-2xl font-extrabold heading-display">
              Start Your Journey in Forensic Science Today
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Discover beginner-friendly courses, practical certifications, and expert-led training designed to help you build real-world forensic skills. Join a growing community that's redefining forensic education through practical learning, innovation, and industry collaboration.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 justify-center">
              <Link to="/courses" className="px-6 py-2.5 rounded-xl bg-brand-glowCyan text-brand-deepBlue font-bold text-xs hover:bg-white transition-colors inline-flex items-center gap-1.5">
                Explore Programs <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/quiz" className="px-6 py-2.5 rounded-xl border border-white/30 text-white font-semibold text-xs hover:bg-white/10 transition-colors inline-flex items-center gap-1.5">
                Take a Free Assessment
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
