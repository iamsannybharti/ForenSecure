/**
 * The mockup's SVG symbol sprite, verbatim. One <use> reference per icon keeps
 * the markup as small as the original HTML instead of inlining every path.
 * Render <FsIconSprite /> once on any page that uses <Icon />.
 */
export function Icon({ id, className = 'icon' }: { id: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <use href={`#${id}`} />
    </svg>
  );
}

export function FsIconSprite() {
  return (
    <svg className="icon-sprite" aria-hidden="true">
      <defs>
        <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 8.9 8 10 4.6-1.1 8-5 8-10V5l-8-3Z" /><path d="M9 12l2 2 4-4" /></symbol>
        <symbol id="i-menu" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" /></symbol>
        <symbol id="i-close" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></symbol>
        <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></symbol>
        <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></symbol>
        <symbol id="i-star" viewBox="0 0 24 24"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" /></symbol>
        <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></symbol>
        <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.6-4 5-6 8-6s6.4 2 8 6" /></symbol>
        <symbol id="i-monitor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="1.5" /><path d="M8 21h8M12 17v4" /></symbol>
        <symbol id="i-award" viewBox="0 0 24 24"><circle cx="12" cy="8" r="5" /><path d="M8.5 12.5 7 22l5-3 5 3-1.5-9.5" /></symbol>
        <symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r=".5" /></symbol>
        <symbol id="i-cert" viewBox="0 0 24 24"><rect x="3" y="3" width="14" height="18" rx="1.5" /><path d="M6.5 8h7M6.5 11.5h7M6.5 15h4" /><circle cx="18" cy="17" r="3.5" /><path d="m16.5 19-.5 3 2-1 2 1-.5-3" /></symbol>
        <symbol id="i-laptop" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="11" rx="1.2" /><path d="M2 19h20M9 15v2M15 15v2" /></symbol>
        <symbol id="i-cap" viewBox="0 0 24 24"><path d="M12 4 2 9l10 5 10-5-10-5Z" /><path d="M6 11.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" /><path d="M22 9v6" /></symbol>
        <symbol id="i-briefcase" viewBox="0 0 24 24"><rect x="2.5" y="7" width="19" height="12" rx="1.5" /><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" /><path d="M2.5 12.5h19" /></symbol>
        <symbol id="i-fingerprint" viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7v2c0 4 2 7 4 9" /><path d="M12 2a7 7 0 0 1 7 7v3c0 1.3-.1 2.4-.4 3.5" /><path d="M9 21c-1.4-2-2-4.5-2-7v-3a5 5 0 0 1 10 0" /><path d="M8.5 16.5C8 15 7.5 13.6 7.5 11v-2a4.5 4.5 0 0 1 9 0v1" /><path d="M12 9v2c0 3.5 1 6 2.5 8" /></symbol>
        <symbol id="i-dna" viewBox="0 0 24 24"><path d="M7 3c0 5 10 5 10 9s-10 4-10 9" /><path d="M17 3c0 5-10 5-10 9s10 4 10 9" /><path d="M7.5 7h9M7 12h10M7.5 17h9" /></symbol>
        <symbol id="i-scale" viewBox="0 0 24 24"><path d="M12 3v18M7 21h10" /><path d="M12 5 5 8l3.5 7L12 12l3.5 3L19 8l-7-3Z" /><path d="M2 8l3.5 7M22 8l-3.5 7" /></symbol>
        <symbol id="i-lock" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="10" rx="1.5" /><path d="M7 10V7a5 5 0 0 1 10 0v3" /><circle cx="12" cy="15" r="1.6" /></symbol>
        <symbol id="i-document" viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6Z" /><path d="M15 2v5h5" /><path d="M9 13h6M9 17h6M9 9h2" /></symbol>
        <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></symbol>
        <symbol id="i-gavel" viewBox="0 0 24 24"><path d="m14.5 6.5 3 3M9.5 9.5l6 6" /><path d="m11 8-6 6 3 3 6-6" /><path d="M6.5 17.5 3 21M15 3l6 6M18 6l-9.5 9.5" /></symbol>
        <symbol id="i-crime" viewBox="0 0 24 24"><path d="M3 12h4M17 12h4M12 3v4M12 17v4" /><circle cx="12" cy="12" r="4" /></symbol>
        <symbol id="i-bolt" viewBox="0 0 24 24"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></symbol>
        <symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></symbol>
        <symbol id="i-flask" viewBox="0 0 24 24"><path d="M9 2h6M10 2v6.5L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 8.5V2" /><path d="M7.5 15h9" /></symbol>
      </defs>
    </svg>
  );
}
