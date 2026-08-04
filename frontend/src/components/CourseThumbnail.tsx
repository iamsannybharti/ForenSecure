import { Fingerprint, Cpu, Scale, Microscope, ShieldCheck } from 'lucide-react';

// Fallback art for courses without an uploaded image. Deterministic per category so the
// same course always looks the same, and never a broken image or an empty grey box.
const FALLBACKS = [
  { icon: Fingerprint, from: 'from-[#0b1329]', to: 'to-[#1e3a8a]' },
  { icon: Cpu, from: 'from-[#0f172a]', to: 'to-[#0e7490]' },
  { icon: Scale, from: 'from-[#111827]', to: 'to-[#4338ca]' },
  { icon: Microscope, from: 'from-[#0b1329]', to: 'to-[#065f46]' },
  { icon: ShieldCheck, from: 'from-[#111827]', to: 'to-[#7c2d12]' }
];

function pick(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return FALLBACKS[hash % FALLBACKS.length];
}

interface Props {
  src?: string;
  title: string;
  seed?: string;
  className?: string;
}

export default function CourseThumbnail({ src, title, seed, className = '' }: Props) {
  if (src) {
    return (
      <img
        src={src}
        alt={`${title} course thumbnail`}
        loading="lazy"
        decoding="async"
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  const { icon: Icon, from, to } = pick(seed || title);
  return (
    <div
      className={`w-full h-full bg-gradient-to-br ${from} ${to} flex items-center justify-center relative overflow-hidden ${className}`}
      role="img"
      aria-label={`${title} placeholder artwork`}
    >
      <div className="absolute inset-0 digital-grid opacity-20" aria-hidden="true" />
      <Icon className="w-10 h-10 text-white/80" aria-hidden="true" />
    </div>
  );
}
