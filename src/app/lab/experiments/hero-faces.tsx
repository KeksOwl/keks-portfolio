/** Mascot faces shared by lab games that let you pick a hero. */
export type Hero = "owl" | "cat" | "keks";

export const HEROES: Hero[] = ["owl", "cat", "keks"];

export function isHero(value: string | null): value is Hero {
  return value === "owl" || value === "cat" || value === "keks";
}

interface FaceProps {
  className?: string;
}

export function OwlFace({ className }: FaceProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M9 3.5 12.5 10H5.5Z" fill="#6d635a" />
      <path d="M23 3.5 26.5 10H19.5Z" fill="#6d635a" />
      <ellipse cx="16" cy="18" rx="12" ry="11.5" fill="#a3988c" />
      <ellipse cx="16" cy="19.5" rx="7" ry="6" fill="#d9d0c4" />
      <circle cx="11.2" cy="17.2" r="4.2" fill="#efe8dc" />
      <circle cx="20.8" cy="17.2" r="4.2" fill="#efe8dc" />
      <circle cx="11.2" cy="17.2" r="1.85" fill="#1a1410" />
      <circle cx="20.8" cy="17.2" r="1.85" fill="#1a1410" />
      <circle cx="10.6" cy="16.6" r="0.55" fill="#f5f0e8" />
      <circle cx="20.2" cy="16.6" r="0.55" fill="#f5f0e8" />
      <path d="M16 19.2 13.4 23.2h5.2Z" fill="#e1ac6e" />
    </svg>
  );
}

export function CatFace({ className }: FaceProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7 4.5 13 13H4Z" fill="#e89050" />
      <path d="M25 4.5 28 13H19Z" fill="#e89050" />
      <path d="M8.2 7.2 12.2 12.4H6.4Z" fill="#f4b8a0" />
      <path d="M23.8 7.2 25.6 12.4H20.8Z" fill="#f4b8a0" />
      <circle cx="16" cy="18.5" r="11.2" fill="#f0a060" />
      <ellipse cx="16" cy="22" rx="6.5" ry="4.2" fill="#ffe4c4" />
      <ellipse cx="11.5" cy="17.5" rx="1.7" ry="2.1" fill="#3d6a28" />
      <ellipse cx="20.5" cy="17.5" rx="1.7" ry="2.1" fill="#3d6a28" />
      <circle cx="11.5" cy="17.5" r="0.85" fill="#1a1410" />
      <circle cx="20.5" cy="17.5" r="0.85" fill="#1a1410" />
      <circle cx="11.15" cy="17.05" r="0.35" fill="#fff" />
      <circle cx="20.15" cy="17.05" r="0.35" fill="#fff" />
      <path d="M16 20.2c-.9 0-1.5.55-1.5 1.05S15.1 22.2 16 22.2s1.5-.45 1.5-.95S16.9 20.2 16 20.2Z" fill="#e8909a" />
      <path d="M16 22.2v1.6M14.2 23.4h3.6" stroke="#c86a38" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M6.5 19.5h4.2M6.8 21.2h3.6M21.3 19.5h4.2M21.6 21.2h3.6" stroke="#9a5a32" strokeWidth="0.65" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function KeksFace({ className }: FaceProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      {/* liner */}
      <path d="M8 18h16l-1.6 10.2a2 2 0 0 1-2 1.6h-8.8a2 2 0 0 1-2-1.6Z" fill="#e8b888" />
      <path d="M9.2 20h13.6M10 23.2h12M10.8 26.4h10.4" stroke="#c99460" strokeWidth="0.7" opacity="0.55" />
      {/* frosting */}
      <ellipse cx="16" cy="15.5" rx="11.5" ry="8.2" fill="#ffb0c8" />
      <ellipse cx="16" cy="13.2" rx="9.2" ry="5.8" fill="#ffc8d8" />
      <path
        d="M6.2 15.8c2.2-2.4 4.2-.2 5.8-1.8 1.8-1.8 3.2.6 5 .6s3.2-2.4 5-.6c1.6 1.6 3.6-.6 5.8 1.8"
        fill="none"
        stroke="#ff9bb4"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* cherry */}
      <circle cx="16" cy="7.2" r="2.4" fill="#e24b5a" />
      <path d="M16 5.2c.6-1.4 2-2.2 3.2-2.4" fill="none" stroke="#5a8a48" strokeWidth="1" strokeLinecap="round" />
      {/* face */}
      <circle cx="12.2" cy="15.2" r="1.35" fill="#1a1410" />
      <circle cx="19.8" cy="15.2" r="1.35" fill="#1a1410" />
      <circle cx="11.85" cy="14.85" r="0.4" fill="#fff" />
      <circle cx="19.45" cy="14.85" r="0.4" fill="#fff" />
      <path d="M14.2 18.2c.9 1.1 2.7 1.1 3.6 0" fill="none" stroke="#c86a80" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="10.2" cy="17.4" r="1.1" fill="#ff8aa8" opacity="0.7" />
      <circle cx="21.8" cy="17.4" r="1.1" fill="#ff8aa8" opacity="0.7" />
    </svg>
  );
}

export function HeroFace({ hero, className }: { hero: Hero } & FaceProps) {
  if (hero === "owl") return <OwlFace className={className} />;
  if (hero === "cat") return <CatFace className={className} />;
  return <KeksFace className={className} />;
}
