import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Shield, Award, Users, Lightbulb, Compass, Milestone, ArrowRight, Sparkles, CheckCircle2, Target } from 'lucide-react';

export default function About() {
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
      description: 'We prioritize quality, scientific accuracy, and industry-relevant learning in every program.',
      icon: Award
    },
    {
      name: 'Accessibility',
      description: 'Making high-caliber forensic education available to passionate learners from every background.',
      icon: Compass
    },
    {
      name: 'Integrity',
      description: 'Upholding strict ethics, transparency, and professional responsibility in everything we create.',
      icon: Shield
    },
    {
      name: 'Innovation',
      description: 'Continuously advancing through technology, AI research, and modern investigative practices.',
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
      step: '01',
      title: 'The Beginning',
      desc: 'Started with a bold vision to make forensic education practical, accessible, and industry-ready.'
    },
    {
      step: '02',
      title: 'Launching Practical Learning',
      desc: 'Introduced hands-on micro courses, real-world case simulations, and baseline certifications.'
    },
    {
      step: '03',
      title: 'Expanding Academic Opportunities',
      desc: 'Developed comprehensive diploma tracks through academic and law enforcement collaborations.'
    },
    {
      step: '04',
      title: 'Growing National Community',
      desc: 'Building a vibrant network of thousands of learners, educators, and forensic experts across India.'
    },
    {
      step: '05',
      title: 'The Next Chapter',
      desc: 'Expanding into dedicated forensic research publications and physical investigation support services.'
    }
  ];

  return (
    <>
      <SEO 
        title="About Us — Empowering the Future of Digital & Forensic Science"
        description="At ForenSecure, we're building a platform that bridges forensic education, practical skills, and industry readiness."
        canonicalPath="/about"
      />

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-20">
        
        {/* ============ HERO BANNER ============ */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pt-16 pb-20 border-b border-slate-800">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-extrabold tracking-wide backdrop-blur-md">
              <Shield className="w-3.5 h-3.5" />
              <span>ABOUT FORENSECURE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black heading-display tracking-tight leading-tight text-white">
              Empowering the Future of <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-200 bg-clip-text text-transparent">
                Digital &amp; Forensic Science
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-normal">
              At ForenSecure, we are building India's first integrated ecosystem bridging forensic education, practical lab skills, and industry readiness for the next generation of investigators.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 pt-12">
          
          {/* ============ OUR STORY CARD ============ */}
          <section className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Milestone className="w-7 h-7" />
              </div>

              <div className="space-y-3">
                <div className="text-cyan-600 dark:text-cyan-400 text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>OUR STORY</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white heading-display">
                  Our Journey: From an Idea to a Growing Forensic Platform
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                  What began as a vision to make forensic education more practical has grown into a multi-faceted platform offering skill-based learning, industry-backed certifications, and career-focused programs. As we continue to evolve, we are expanding into active research collaborations, institutional partnerships, and physical investigation support services.
                </p>
              </div>
            </div>
          </section>

          {/* ============ MISSION & CORE VALUES ============ */}
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <div className="text-cyan-600 dark:text-cyan-400 text-xs font-extrabold uppercase tracking-widest">
                OUR FOUNDATION
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white heading-display">
                Our Mission &amp; Core Values
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                Every decision we make is driven by our commitment to quality education, scientific rigor, ethical practices, and continuous innovation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {coreValues.map((val) => {
                const IconComponent = val.icon;
                return (
                  <div 
                    key={val.name} 
                    className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-cyan-500/40 transition-all duration-300 space-y-4 flex flex-col justify-between"
                  >
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1.5">{val.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {val.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ============ FOUNDERS & DIRECTORS ============ */}
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <div className="text-cyan-600 dark:text-cyan-400 text-xs font-extrabold uppercase tracking-widest">
                VISIONARY LEADERSHIP
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white heading-display">
                Founders &amp; Directors
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                Meet the owners, board members, and technical leaders behind ForenSecure
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {founders.map((f) => (
                <div 
                  key={f.name} 
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-xl hover:border-cyan-500/30 transition-all duration-300 text-center space-y-4"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-cyan-950 border border-cyan-500/30 text-cyan-400 text-2xl font-black flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
                    {f.initials}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{f.name}</h3>
                    <span className="mt-1 inline-block px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-[11px] font-bold uppercase tracking-wider">
                      {f.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ============ MILESTONES TIMELINE ============ */}
          <section className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white heading-display">
                  Our Journey &amp; Milestones
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Key benchmarks in our mission to transform forensic education</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
              {milestones.map((m, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-2 relative">
                  <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 tracking-wider">
                    STEP {m.step}
                  </span>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                    {m.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ============ FINAL CTA ============ */}
          <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 border border-cyan-500/30 text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none" />
            
            <div className="max-w-2xl mx-auto space-y-3 relative z-10">
              <h2 className="text-2xl sm:text-4xl font-black heading-display tracking-tight text-white">
                Start Your Journey in Forensic Science Today
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Discover beginner-friendly courses, practical certifications, and expert-led training designed to help you build real-world forensic skills. Join thousands of passionate learners across India.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-4 justify-center relative z-10">
              <Link 
                to="/courses" 
                className="px-7 py-3 rounded-full bg-[#00f0ff] hover:bg-cyan-300 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-cyan-500/25 transition-all hover:scale-105"
              >
                Explore Programs <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                to="/quiz" 
                className="px-7 py-3 rounded-full border-2 border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff]/10 font-extrabold text-xs uppercase tracking-wider transition-all hover:scale-105"
              >
                Take a Free Assessment
              </Link>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
