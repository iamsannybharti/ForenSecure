import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { FsIconSprite, Icon } from '../components/FsIcons';
import FreeQuizCard from '../components/FreeQuizCard';
import { LogoMark } from '../components/Logo';

const MEDIA = ['media--a', 'media--b', 'media--c', 'media--d', 'media--e'];
const COURSE_ICONS = ['i-fingerprint', 'i-lock', 'i-dna', 'i-crime', 'i-bolt'];
const DIPLOMA_ICONS = ['i-dna', 'i-search', 'i-lock'];
const DIPLOMA_MEDIA = ['media--a', 'media--d', 'media--c'];
const DIPLOMA_HIGHLIGHTS = [['i-cap', 'Industry Curriculum'], ['i-target', 'Hands-on Training'], ['i-document', 'Case Studies']];
const ARTICLE_MEDIA = ['media--b', 'media--d', 'media--c', 'media--e', 'media--a', 'media--d'];

type Card = {
  slug: string;
  title: string;
  instructorName: string;
  durationWeeks: number;
  difficulty: string;
  courseType?: string;
  rating: number;
  ratingCount: number;
  priceINR: number;
};

const TRUST_LOGOS = [
  ['i-shield', 'MHA', 'Government of India'],
  ['i-scale', 'CBI', 'India'],
  ['i-cap', 'NFSU', 'National Forensic Sciences University'],
  ['i-shield', 'Delhi Police', ' '],
  ['i-cap', 'Amity', 'University'],
  ['i-flask', 'ICMR', 'India'],
  ['i-award', 'NABL', 'Accredited'],
];

const SERVICES = [
  ['i-lock', 'Cyber Investigation'],
  ['i-monitor', 'Digital Forensics'],
  ['i-briefcase', 'Corporate Fraud Investigation'],
  ['i-document', 'Document Examination'],
  ['i-fingerprint', 'Fingerprint Analysis'],
  ['i-search', 'Crime Scene Investigation'],
  ['i-gavel', 'Legal Expert Witness'],
];

const FAQS = [
  ['What is ForenSecure?', "ForenSecure is India's integrated forensic learning and research ecosystem, combining free quizzes, micro courses, diploma programs and upcoming investigation services in one platform."],
  ['Are the certificates recognized?', 'Yes, our certificates are industry-recognized and backed by partnerships with leading academic and law enforcement institutions.'],
  ['Do you provide live classes?', 'Every micro course and diploma program includes scheduled live sessions with instructors, alongside recorded content you can revisit anytime.'],
  ['Who can enroll in these programs?', 'Students, working professionals and law enforcement personnel of any background can enroll — each course lists its own prerequisites.'],
  ['Will investigation services be available soon?', 'Yes, our investigation services are launching soon. Join the notify list to be the first to know when they go live.'],
  ['How can I contact ForenSecure?', 'Reach our support team any time through the Contact page, or email us — we typically respond within one business day.'],
];

const inr = (value: number) => `₹${value.toLocaleString('en-IN')}`;
const ratingCount = (count: number) => (count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count));
// The design ribbons its strongest cards. Derive that from the rating rather
// than hardcoding which grid position gets a badge.
const courseBadge = (rating: number) =>
  rating >= 4.85
    ? { label: 'Bestseller', className: 'badge--bestseller' }
    : rating >= 4.7
      ? { label: 'Popular', className: 'badge--popular' }
      : null;

const dateFmt = (value?: string) =>
  value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '';

export default function Home() {
  const [courses, setCourses] = useState<Card[]>([]);
  const [diplomas, setDiplomas] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/courses')
      .then(res => (res.ok ? res.json() : Promise.reject(new Error('courses'))))
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        const catalog = data.filter(course => course.format !== 'diploma').slice(0, 5);
        const programs = data.filter(course => course.format === 'diploma').slice(0, 3);
        setCourses(catalog);
        setDiplomas(programs);
      })
      .catch(() => { });

    fetch('/api/blogs')
      .then(res => (res.ok ? res.json() : Promise.reject(new Error('blogs'))))
      .then((data: any[]) => {
        setArticles(Array.isArray(data) ? data.slice(0, 6) : []);
      })
      .catch(() => { });
  }, []);

  return (
    <div className="fs-mock">
      <SEO
        title="ForenSecure — India's First Integrated Forensic Ecosystem"
        description="From quiz certifications to advanced diploma programs and live classes — ForenSecure brings learning, research and future-ready investigation services into one powerful ecosystem."
        canonicalPath="/"
      />

      <FsIconSprite />

      {/* ============ HERO ============ */}
      <section className="w-full min-h-[85vh] lg:min-h-[92vh] relative bg-[#030712] flex items-center border-b border-slate-800/80 overflow-hidden text-white py-12 sm:py-16 lg:py-0">
        {/* Subtle background ambient glows */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-[#00f0ff]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Right Visual Image - 100% Edge to Edge on Right Side */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-1/2 z-0 overflow-hidden pointer-events-none">
          <img
            src="/hero-visual.png"
            alt="Forensic Science Laboratory"
            className="w-full h-full object-cover object-center [mask-image:linear-gradient(to_right,transparent_0%,black_20%,black_100%)]"
          />
        </div>

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6 lg:py-24">

              {/* Top Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/15 border border-[#00f0ff]/40 text-[#00f0ff] text-xs font-extrabold tracking-wide backdrop-blur-sm">
                <span>🚀</span> Building the Future of Forensics
              </div>

              {/* Branding Header */}
              <div className="flex items-center gap-4 sm:gap-5 pt-1">
                <LogoMark className="w-20 h-20 sm:w-24 sm:h-24 text-[#00f0ff] shrink-0 drop-shadow-[0_0_12px_rgba(0,240,255,0.5)]" />
                <div>
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-white heading-display block leading-tight" style={{ color: '#ffffff' }}>
                    Foren<span className="text-[#00f0ff]" style={{ color: '#00f0ff' }}>Secure</span>
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-[#00f0ff] block mt-1" style={{ color: '#00f0ff' }}>
                    FORENSIC EDUCATION REIMAGINED
                  </span>
                </div>
              </div>

              {/* Tagline / Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black heading-display tracking-tight text-white leading-[1.15]" style={{ color: '#ffffff' }}>
                Empowering the Next Generation of <span className="text-[#00f0ff]" style={{ color: '#00f0ff' }}>Forensics</span>
              </h1>

              {/* Description */}
              <p className="text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed font-normal" style={{ color: '#e2e8f0' }}>
                Master the future of forensics with industry-aligned programs, real-world case simulations, and cutting-edge AI tools.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/courses"
                  className="px-8 py-4 rounded-full bg-[#00f0ff] hover:bg-cyan-300 text-slate-950 font-extrabold text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2 shadow-xl shadow-cyan-500/30 transition-all hover:scale-105"
                  style={{ backgroundColor: '#00f0ff', color: '#030712' }}
                >
                  EXPLORE PROGRAMS <Icon id="i-arrow" className="w-4 h-4" />
                </Link>
                <Link
                  to="/quiz"
                  className="px-8 py-4 rounded-full border-2 border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff]/10 font-extrabold text-xs sm:text-sm tracking-wider uppercase transition-all hover:scale-105"
                  style={{ borderColor: '#00f0ff', color: '#00f0ff' }}
                >
                  DISCOVER MORE
                </Link>
              </div>

            </div>

            {/* Mobile / Tablet Visual Image Fallback */}
            <div className="lg:hidden block w-full relative pt-4">
              <img
                src="/hero-visual.png"
                alt="Forensic Science Laboratory"
                className="w-full h-[350px] sm:h-[450px] object-cover rounded-2xl [mask-image:radial-gradient(ellipse_at_center,_black_70%,_transparent_100%)]"
              />
            </div>

          </div>
        </div>
      </section>

      {/* ============ TRUSTED BY ============ */}
      <section className="trusted">
        <div className="container">
          <div className="trusted__panel">
            <div className="eyebrow">Trusted By</div>
            <div className="trusted__row">
              {TRUST_LOGOS.map(([icon, name, sub]) => (
                <div className="trust-logo" key={name}>
                  <Icon id={icon} />
                  <span className="trust-logo__text">{name}<span>{sub}</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ ECOSYSTEM ============ */}
      <section className="section" id="ecosystem">
        <div className="container">
          <div className="section-header">
            <div className="eyebrow eyebrow--center">Our Ecosystem</div>
          </div>
          <div className="ecosystem__grid">
            <div className="eco-card eco-card--featured">
              <div className="eco-card__icon"><Icon id="i-cert" /></div>
              <h3>Free Quiz with Certificate</h3>
              <p>Test your knowledge with forensic quizzes and earn industry-recognized certificates.</p>
              <Link to="/quiz" className="btn--text">Start Quiz <Icon id="i-arrow" /></Link>
            </div>
            <div className="eco-card">
              <div className="eco-card__icon"><Icon id="i-laptop" /></div>
              <h3>Micro Courses</h3>
              <p>Short, focused and practical courses designed by industry experts.</p>
              <Link to="/courses" className="btn--text">Explore Courses <Icon id="i-arrow" /></Link>
            </div>
            <div className="eco-card">
              <span className="badge badge--soon badge--pill eco-card__badge">Upcoming</span>
              <div className="eco-card__icon"><Icon id="i-cap" /></div>
              <h3>Diploma Programs</h3>
              <p>Career-oriented diploma programs with live training and placement support.</p>
              <Link to="/diplomas" className="btn--text">View Diplomas <Icon id="i-arrow" /></Link>
            </div>
            <div className="eco-card">
              <span className="badge badge--soon badge--pill eco-card__badge">Coming Soon</span>
              <div className="eco-card__icon"><Icon id="i-briefcase" /></div>
              <h3>Investigation Services</h3>
              <p>Advanced forensic investigation services by experts. Launching soon.</p>
              <Link to="/services" className="btn--text">Notify Me <Icon id="i-arrow" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURED COURSES ============ */}
      <section className="section section--alt" id="courses">
        <div className="container">
          <div className="section-header section-header--split">
            <div><div className="eyebrow">Featured Courses</div></div>
            <Link to="/courses" className="btn btn--outline btn--sm">View All Courses <Icon id="i-arrow" /></Link>
          </div>
          <div className="courses__grid">
            {courses.map((course, index) => {
              const badge = courseBadge(course.rating ?? 0);
              return (
                <article className="course-card" key={course.slug || index}>
                  <div className={`course-card__media ${MEDIA[index % MEDIA.length]}`}>
                    {badge && <span className={`badge ${badge.className} course-card__badge`}>{badge.label}</span>}
                    <Icon id={COURSE_ICONS[index % COURSE_ICONS.length]} />
                  </div>
                  <div className="course-card__body">
                    <h3>{course.title}</h3>
                    <div className="course-instructor">
                      <span className="course-instructor__avatar"><Icon id="i-user" /></span>
                      {course.instructorName || 'ForenSecure Faculty'}
                    </div>
                    <div className="course-meta">
                      <span><Icon id="i-clock" />{course.durationWeeks || 6} Weeks</span>
                      <span><Icon id="i-target" />{course.difficulty || 'Beginner'}</span>
                      <span><Icon id="i-monitor" />{course.courseType === 'recorded' ? 'Self Paced' : 'Live Sessions'}</span>
                    </div>
                    <div className="course-card__foot">
                      <span className="course-rating">
                        <Icon id="i-star" />{(course.rating ?? 4.8).toFixed(1)} <span>({ratingCount(course.ratingCount ?? 0)})</span>
                      </span>
                      <span className="course-price">{inr(course.priceINR ?? 0)}</span>
                    </div>
                    <Link to={course.slug ? `/courses/${course.slug}` : '/courses'} className="btn btn--primary btn--sm btn--block">Enroll Now</Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ QUIZ PROMO ============ */}
      <section className="section" id="quiz">
        <div className="container">
          <div className="quiz-promo__panel quiz-promo">
            {/* Panel is playable in place — quiz mock, pitch and certificate
                preview all move together, so they live in one component. */}
            <FreeQuizCard />
          </div>
        </div>
      </section>

      {/* ============ DIPLOMA PROGRAMS ============ */}
      <section className="section section--alt" id="diploma">
        <div className="container">
          <div className="section-header section-header--split">
            <div><div className="eyebrow flex items-center gap-2">Diploma Programs <span className="badge badge--soon badge--pill text-[10px] py-0.5 px-2 font-bold uppercase">Upcoming</span></div></div>
            <Link to="/diplomas" className="btn btn--outline btn--sm flex items-center gap-2">View All Diplomas <span className="badge badge--soon badge--pill text-[10px] py-0.5 px-2 font-bold uppercase">Upcoming</span> <Icon id="i-arrow" /></Link>
          </div>
          <div className="diploma__grid">
            {diplomas.map((diploma, index) => {
              const [thirdIcon, thirdLabel] = DIPLOMA_HIGHLIGHTS[index % DIPLOMA_HIGHLIGHTS.length];
              const months = diploma.durationWeeks ? Math.max(1, Math.round(diploma.durationWeeks / 4.345)) : 6;
              return (
                <article className="diploma-card" key={diploma.slug || index}>
                  <div className={`diploma-card__media ${DIPLOMA_MEDIA[index % DIPLOMA_MEDIA.length]}`}>
                    <span className="badge badge--soon badge--pill absolute top-3 right-3 z-10">Upcoming</span>
                    <Icon id={DIPLOMA_ICONS[index % DIPLOMA_ICONS.length]} />
                  </div>
                  <div className="diploma-card__body">
                    <h3>{diploma.title}</h3>
                    <ul className="diploma-feats">
                      <li><Icon id="i-clock" />Duration: {months} Months</li>
                      <li><Icon id="i-monitor" />Live Classes</li>
                      <li><Icon id={thirdIcon} />{thirdLabel}</li>
                      <li><Icon id="i-briefcase" />Placement Support</li>
                    </ul>
                    <Link to={diploma.slug ? `/courses/${diploma.slug}` : '/diplomas'} className="btn btn--outline btn--sm">
                      Learn More <Icon id="i-arrow" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ RESEARCH & INSIGHTS ============ */}
      <section className="section" id="research">
        <div className="container">
          <div className="section-header section-header--split">
            <div><div className="eyebrow">Research &amp; Insights</div></div>
            <Link to="/blogs" className="btn btn--outline btn--sm">View All Articles <Icon id="i-arrow" /></Link>
          </div>
          <div className="research__grid">
            {articles.map((article, index) => (
              <article className="article-card" key={article.slug || index}>
                <Link to={article.slug ? `/blogs/${article.slug}` : '/blogs'}>
                  <div className={`article-card__media ${ARTICLE_MEDIA[index % ARTICLE_MEDIA.length]}`}>
                    <span className="article-tag">{article.category}</span>
                  </div>
                  <div className="article-card__body">
                    <h4>{article.title}</h4>
                    <div className="article-meta">
                      {article.date || dateFmt(article.createdAt)}<span className="sep" />{article.readTimeMinutes || 5} Min Read
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ INVESTIGATION SERVICES (DARK) ============ */}
      <section className="section" id="services">
        <div className="container">
          <div className="services-dark">
            <div className="container">
              <div className="eyebrow">Investigation Services (Coming Soon)</div>
              <div className="services-dark__grid">
                {SERVICES.map(([icon, label]) => (
                  <div className="service-tile" key={label}>
                    <span className="service-tile__icon"><Icon id={icon} /></span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <div className="services-dark__cta">
                <Link to="/services" className="btn btn--primary">Notify Me When Services Launch <Icon id="i-arrow" /></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="eyebrow eyebrow--center">Frequently Asked Questions</div>
          </div>
          <div className="faq__grid">
            {/* name= makes these an exclusive accordion natively — no state, no JS. */}
            {FAQS.map(([question, answer], index) => (
              <details className="faq-item" name="fs-faq" key={question} open={index === 0}>
                <summary>
                  <span className="faq-item__q"><Icon id="i-document" className="icon q-icon" />{question}</span>
                  <Icon id="i-plus" className="icon toggle-icon" />
                </summary>
                <p className="faq-item__answer">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="cta">
        <div className="container">
          <div className="cta__panel">
            <span className="cta__deco cta__deco--1"><Icon id="i-dna" /></span>
            <span className="cta__deco cta__deco--2"><Icon id="i-fingerprint" /></span>
            <h2>Start Your Journey in Forensic Science Today</h2>
            <p>Discover beginner-friendly courses, practical certifications, and expert-led training designed to help you build real-world forensic skills. Join a growing community that's redefining forensic education through practical learning, innovation, and industry collaboration.</p>
            <div className="cta__actions">
              <Link to="/courses" className="btn btn--primary">Explore Programs <Icon id="i-arrow" /></Link>
              <Link to="/quiz" className="btn btn--ghost-dark">Take a Free Assessment <Icon id="i-arrow" /></Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
