import { LogoMark } from './Logo';

/**
 * Pixel-faithful ForenSecure "Certificate of Achievement".
 * Only the wording changes per student / course / quiz; the layout is fixed.
 * Sized in container-query units (cqw) so every element scales with the canvas
 * width — looks identical on screen and in print.
 */

interface CertData {
  studentName: string;
  courseName: string;
  certificateId: string;
  issueDate: string | Date;
  grade?: string;
  mode?: string;
}

const NAVY = '#152452';
const GOLD = '#c9a24e';

const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

// Large pale-gold laurel watermark behind the certificate text.
function Laurel() {
  const branch = (mirror = false) => (
    <g transform={mirror ? 'translate(100 0) scale(-1 1)' : undefined}>
      <path d="M49 92C10 79 2 34 35 5" fill="none" stroke={GOLD} strokeWidth=".55" />
      {Array.from({ length: 22 }).map((_, i) => {
        const t = 0.04 + (i / 21) * 0.92;
        const u = 1 - t;
        const x = u ** 3 * 49 + 3 * u ** 2 * t * 10 + 3 * u * t ** 2 * 2 + t ** 3 * 35;
        const y = u ** 3 * 92 + 3 * u ** 2 * t * 79 + 3 * u * t ** 2 * 34 + t ** 3 * 5;
        const dx = 3 * u ** 2 * (10 - 49) + 6 * u * t * (2 - 10) + 3 * t ** 2 * (35 - 2);
        const dy = 3 * u ** 2 * (79 - 92) + 6 * u * t * (34 - 79) + 3 * t ** 2 * (5 - 34);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI + (i % 2 === 0 ? 54 : -54);

        return (
          <path
            key={i}
            d="M0 0C2.5-3 7-3.5 10 0C7 3.5 2.5 3 0 0Z"
            transform={`translate(${x} ${y}) rotate(${angle})`}
            fill={GOLD}
            stroke={GOLD}
            strokeWidth=".16"
          />
        );
      })}
      <circle cx="43" cy="87" r="1.5" fill={GOLD} />
      <circle cx="40" cy="83" r="1.25" fill={GOLD} />
      <circle cx="45" cy="81" r="1.2" fill={GOLD} />
    </g>
  );

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" style={{ opacity: 0.11 }} aria-hidden>
      {branch()}
      {branch(true)}
    </svg>
  );
}

// Navy + gold ribbon corner ornament (top-right); rotated for bottom-left.
function Corner({ className, rotate = 0 }: { className: string; rotate?: number }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      style={{ transform: `rotate(${rotate}deg)`, filter: 'drop-shadow(-5px 7px 4px rgba(0,0,0,.28))' }}
      aria-hidden
    >
      <path d="M200 0H48C88 34 104 55 145 72C174 84 191 112 200 144Z" fill={GOLD} />
      <path d="M200 0H59C96 29 111 47 150 62C178 73 193 96 200 126Z" fill={NAVY} />
      <path d="M70 0C101 23 118 39 153 51C178 59 193 79 200 101" fill="none" stroke="#f2d477" strokeWidth="3" />
      <path d="M88 0C113 18 127 29 158 39C181 46 194 61 200 78" fill="none" stroke={GOLD} strokeWidth="2" opacity="0.85" />
    </svg>
  );
}

// Gold award medallion with ribbon tails.
function Seal() {
  return (
    <svg viewBox="0 0 100 130" className="h-full w-full" aria-hidden>
      <path d="M38 78 L30 122 L50 110 L70 122 L62 78 Z" fill={GOLD} />
      <path d="M38 78 L30 122 L50 110 Z" fill="#a67c2e" opacity="0.5" />
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return <circle key={i} cx={50 + 40 * Math.cos(a)} cy={45 + 40 * Math.sin(a)} r={4} fill={GOLD} />;
      })}
      <circle cx="50" cy="45" r="38" fill="#e9c86a" />
      <circle cx="50" cy="45" r="31" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.7" />
      <circle cx="50" cy="45" r="24" fill={GOLD} />
      <circle cx="50" cy="45" r="24" fill="url(#sealShine)" />
      <defs>
        <radialGradient id="sealShine" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff6d6" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#e9c86a" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export default function CertificateCanvas({ cert }: { cert: CertData }) {
  const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/certificates/${encodeURIComponent(cert.certificateId)}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(verifyUrl)}`;

  return (
    <div style={{ containerType: 'inline-size' } as React.CSSProperties} className="w-full">
      <div
        className="relative mx-auto w-full overflow-hidden"
        style={{
          aspectRatio: '1.46 / 1',
          color: NAVY,
          background: '#fffdf8',
          boxShadow: '0 20px 60px rgba(0,0,0,.18)'
        }}
      >
        {/* Gold frame */}
        <div className="pointer-events-none absolute" style={{ inset: '1.1cqw', border: `0.25cqw solid ${GOLD}` }} />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 146 100" preserveAspectRatio="none" aria-hidden>
          <g fill="none" stroke={GOLD} strokeWidth=".18" opacity=".72">
            <path d="M3 2h25l2-2 2 2h20l2-2 2 2h20l2-2 2 2h20l2-2 2 2h39" />
            <path d="M3 98h25l2 2 2-2h20l2 2 2-2h20l2 2 2-2h20l2 2 2-2h39" />
            <path d="M2 3v26l-2 2 2 2v18l-2 2 2 2v18l-2 2 2 2v20" />
            <path d="M144 3v26l2 2-2 2v18l2 2-2 2v18l2 2-2 2v20" />
          </g>
        </svg>

        {/* Corner ornaments */}
        {/* top-right */}
        <div className="absolute right-0 top-0" style={{ width: '31cqw', height: '31cqw' }}><Corner className="h-full w-full" /></div>
        {/* bottom-left (rotated 180) */}
        <div className="absolute bottom-0 left-0" style={{ width: '31cqw', height: '31cqw' }}><Corner className="h-full w-full" rotate={180} /></div>

        <Laurel />

        {/* Left navy ribbon banner */}
        <div
          className="absolute top-0 flex flex-col items-center text-white"
          style={{
            left: '5cqw', width: '13cqw', paddingTop: '2cqw', paddingBottom: '3cqw', gap: '1.25cqw',
            background: NAVY,
            borderLeft: `0.35cqw solid ${GOLD}`,
            borderRight: `0.35cqw solid ${GOLD}`,
            boxShadow: '0.6cqw 0.6cqw 0.7cqw rgba(0,0,0,.3)',
            clipPath: 'polygon(0 0, 100% 0, 100% 88%, 50% 100%, 0 88%)'
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: '4cqw', height: '4cqw' }} fill="none" stroke={GOLD} strokeWidth="1.5" aria-hidden>
            <rect x="3" y="5" width="18" height="16" rx="1" />
            <path d="M7 3v4M17 3v4M3 10h18M7 14h2M11 14h2M15 14h2M7 18h2M11 18h2M15 18h2" />
          </svg>
          <span style={{ fontSize: '1.5cqw', letterSpacing: '.08em' }} className="text-center font-bold leading-tight">DATE OF<br />COMPLETION</span>
          <span style={{ fontSize: '1.5cqw', color: GOLD }} className="font-bold">{formatDate(cert.issueDate)}</span>
          <span style={{ width: '5cqw', borderTop: `0.2cqw solid ${GOLD}`, opacity: 0.6 }} />
          <svg viewBox="0 0 24 24" style={{ width: '3.4cqw', height: '3.4cqw' }} fill="none" stroke={GOLD} strokeWidth="1.5" aria-hidden>
            <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
          </svg>
          <span style={{ fontSize: '1.5cqw', letterSpacing: '.08em' }} className="font-bold">MODE</span>
          <span style={{ fontSize: '1.5cqw', color: GOLD }} className="font-bold">{(cert.mode || 'ONLINE').toUpperCase()}</span>
        </div>

        {/* Main content column */}
        <div className="absolute inset-0 flex flex-col items-center text-center" style={{ paddingLeft: '20cqw', paddingRight: '20cqw', paddingTop: '3cqw' }}>
          {/* Brand header */}
          <div className="flex items-center justify-center" style={{ gap: '0.9cqw' }}>
            <LogoMark style={{ width: '4.2cqw', height: '4.2cqw', color: NAVY }} />
            <span className="font-extrabold tracking-tight" style={{ fontSize: '4.8cqw', color: '#111' }}>FORENSECURE</span>
          </div>
          <span style={{ fontSize: '1.35cqw', letterSpacing: '.12em', marginTop: '0.3cqw', color: '#111' }} className="font-semibold">
            STRENGTHENING INVESTIGATION EMPOWERING JUSTICE
          </span>

          {/* Title */}
          <h1 className="font-serif font-bold" style={{ fontSize: '6.4cqw', marginTop: '1.4cqw', lineHeight: 1, color: '#111' }}>CERTIFICATE</h1>
          <div
            className="text-white font-bold"
            style={{ fontSize: '2.2cqw', letterSpacing: '.06em', marginTop: '0.6cqw', padding: '0.45cqw 3.4cqw', background: NAVY, clipPath: 'polygon(6% 0, 94% 0, 100% 50%, 94% 100%, 6% 100%, 0 50%)' }}
          >
            OF ACHIEVEMENT
          </div>

          <span style={{ fontSize: '1.6cqw', letterSpacing: '.06em', marginTop: '1.4cqw', color: NAVY }} className="font-semibold">
            THIS CERTIFICATE IS PROUDLY PRESENTED TO
          </span>

          {/* Name */}
          <div className="font-serif" style={{ fontSize: '4.2cqw', letterSpacing: '.1em', marginTop: '0.8cqw', lineHeight: 1.1, color: NAVY }}>
            {cert.studentName}
          </div>
          {/* Ornamental divider */}
          <svg viewBox="0 0 200 12" style={{ width: '32cqw', marginTop: '0.5cqw' }} aria-hidden>
            <line x1="10" y1="6" x2="85" y2="6" stroke={GOLD} strokeWidth="1" />
            <line x1="115" y1="6" x2="190" y2="6" stroke={GOLD} strokeWidth="1" />
            <path d="M92 6 L100 1 L108 6 L100 11 Z" fill={GOLD} />
            <circle cx="85" cy="6" r="1.6" fill={GOLD} /><circle cx="115" cy="6" r="1.6" fill={GOLD} />
          </svg>

          {/* Body */}
          <p className="font-serif" style={{ fontSize: '1.65cqw', marginTop: '1.4cqw', color: '#4a5578' }}>
            for successfully completing the <span className="font-bold" style={{ color: GOLD }}>{cert.courseName}</span>
          </p>
          {cert.grade && (
            <p className="font-bold" style={{ fontSize: '1.65cqw', marginTop: '0.5cqw', color: NAVY }}>
              {cert.grade}
            </p>
          )}
          <p className="font-serif" style={{ fontSize: '1.65cqw', marginTop: '0.5cqw', color: '#4a5578' }}>Congratulations on your achievement!</p>
          <p className="font-serif" style={{ fontSize: '1.65cqw', color: '#4a5578' }}>We appreciate your valuable time, enthusiasm and effort.</p>
          <p className="font-serif" style={{ fontSize: '1.65cqw', color: '#4a5578' }}>Keep learning, keep growing!</p>
        </div>

        {/* QR verify block (top-right, under corner) */}
        <div className="absolute flex flex-col items-center text-center" style={{ right: '5cqw', top: '24cqw', width: '13cqw' }}>
          <img src={qrSrc} alt="Certificate verification QR" style={{ width: '11cqw', height: '11cqw' }} crossOrigin="anonymous" />
          <span style={{ fontSize: '1.25cqw', marginTop: '0.6cqw', color: '#4a5578' }} className="font-semibold">SCAN TO VERIFY THIS<br />CERTIFICATE</span>
        </div>

        {/* Center seal */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: '3cqw', width: '9cqw', height: '11.7cqw', marginLeft: '7cqw' }}>
          <Seal />
        </div>

        {/* Signatures */}
        <div className="absolute flex items-end justify-between" style={{ left: '24cqw', right: '8cqw', bottom: '4cqw' }}>
          <div className="text-center" style={{ width: '20cqw' }}>
            <div style={{ borderTop: `0.15cqw solid ${GOLD}`, marginBottom: '0.6cqw' }} />
            <div className="font-bold" style={{ fontSize: '1.6cqw', color: NAVY }}>MANAGING DIRECTOR</div>
            <div style={{ fontSize: '1.4cqw', color: '#4a5578' }}>FORENSECURE</div>
          </div>
          <div className="text-center" style={{ width: '20cqw' }}>
            <div style={{ borderTop: `0.15cqw solid ${GOLD}`, marginBottom: '0.6cqw' }} />
            <div className="font-bold" style={{ fontSize: '1.6cqw', color: NAVY }}>DIRECTOR (EDUCATION)</div>
            <div style={{ fontSize: '1.4cqw', color: '#4a5578' }}>FORENSECURE</div>
          </div>
        </div>

        {/* Certificate ID */}
        <span className="absolute" style={{ right: '5cqw', bottom: '1.6cqw', fontSize: '1.15cqw', letterSpacing: '.05em', color: '#7a83a0' }}>
          CERTIFICATE ID: {cert.certificateId}
        </span>
      </div>
    </div>
  );
}
