import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import Logo from './Logo';

const GROUPS = [
  { title: 'Courses', links: [['All Courses', '/courses'], ['Bestsellers', '/courses'], ['New Courses', '/courses'], ['Categories', '/courses']] },
  { title: 'Quiz', links: [['Free Quiz', '/quiz'], ['Quiz Leaderboard', '/quiz'], ['Certificates', '/certificates']] },
  { title: 'Diploma', links: [['All Diplomas', '/diplomas'], ['Upcoming Batches', '/diplomas'], ['Eligibility', '/diplomas']] },
  { title: 'Live Classes', links: [['Upcoming Classes', '/seminars'], ['Schedule', '/seminars'], ['Faculty', '/faculty']] },
  { title: 'Research', links: [['Articles', '/blogs'], ['Case Studies', '/research'], ['Publications', '/blogs']] },
  { title: 'Services', links: [['Investigation', '/services'], ['Corporate Services', '/services'], ['Coming Soon', '/services']] },
  { title: 'About', links: [['About Us', '/about'], ['Our Mission', '/about'], ['Our Team', '/faculty']] },
  { title: 'Contact', links: [['Contact Us', '/contact'], ['Career', '/contact'], ['Support', '/contact']] },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="border-t border-slate-800 bg-slate-950 pb-9 pt-16 text-slate-300">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="grid gap-x-5 gap-y-10 border-b border-slate-800 pb-12 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-[1.5fr_repeat(7,0.82fr)] 2xl:grid-cols-[1.5fr_repeat(7,0.82fr)_1.25fr]">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <Logo variant="dark" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">India's first integrated forensic ecosystem for learning, research and future-ready investigation services.</p>
            <div className="mt-5 flex gap-2">
              {[Facebook, Linkedin, Twitter, Instagram].map((Icon, index) => (
                <a key={index} href="#" aria-label={['Facebook', 'LinkedIn', 'Twitter', 'Instagram'][index]} className="grid h-9 w-9 place-items-center rounded-full border border-slate-800 bg-slate-900 text-slate-400 hover:border-blue-500 hover:text-blue-400">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {GROUPS.map(group => (
            <div key={group.title}>
              <h3 className="font-display text-sm font-bold text-white">{group.title}</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
                {group.links.map(([label, to]) => <li key={label}><Link to={to} className="hover:text-blue-400">{label}</Link></li>)}
              </ul>
            </div>
          ))}

          <div className="max-w-sm sm:col-span-2 md:col-span-4 xl:col-span-full 2xl:col-span-1">
            <h3 className="font-display text-sm font-bold text-white">Subscribe to our newsletter</h3>
            {subscribed ? (
              <p role="status" className="mt-4 text-sm font-semibold text-blue-400">You're subscribed.</p>
            ) : (
              <form onSubmit={subscribe} className="mt-4 flex overflow-hidden rounded-lg border border-slate-700 bg-slate-900 focus-within:border-blue-500">
                <label htmlFor="footer-email" className="sr-only">Email address</label>
                <input id="footer-email" type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="Enter your email" className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-500" />
                <button type="submit" className="bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Subscribe</button>
              </form>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 ForenSecure. All Rights Reserved.</span>
          <div className="flex gap-5"><a href="#" className="hover:text-white">Privacy Policy</a><a href="#" className="hover:text-white">Terms of Use</a></div>
        </div>
      </div>
    </footer>
  );
}
