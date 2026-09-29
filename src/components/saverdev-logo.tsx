// Logo SAVERDEV — marque circulaire (arbre + courbes de sol/eau)
// Reprend la charte du logo original : vert forêt + marron terre + vert clair + bleu ciel.
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: number;
  withText?: boolean;
  variant?: "light" | "dark"; // dark = pour fond marron (sidebar)
}

export function SaverdevLogo({ className, size = 40, withText = false, variant = "dark" }: Props) {
  const textColor = variant === "dark" ? "#F5F0E6" : "#1F2A1B";
  const subColor = variant === "dark" ? "#A8C4A2" : "#2E8B57";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="SAVERDEV"
        role="img"
      >
        {/* Cercle bordure marron terre */}
        <circle cx="50" cy="50" r="47" fill="#FFFFFF" stroke="#4A3728" strokeWidth="5" />
        {/* Arbre stylisé (vert forêt) */}
        <g>
          <rect x="47" y="52" width="6" height="22" fill="#4A3728" rx="2" />
          <ellipse cx="50" cy="40" rx="22" ry="18" fill="#2E8B57" />
          <ellipse cx="38" cy="44" rx="12" ry="10" fill="#2E8B57" />
          <ellipse cx="62" cy="44" rx="12" ry="10" fill="#2E8B57" />
          <ellipse cx="50" cy="32" rx="13" ry="11" fill="#2E8B57" />
        </g>
        {/* Courbes sol/eau */}
        <path d="M16 78 Q30 72 50 78 T84 78" stroke="#7CC576" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M16 84 Q30 78 50 84 T84 84" stroke="#87CEEB" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M16 90 Q30 84 50 90 T84 90" stroke="#7CC576" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.7" />
      </svg>
      {withText && (
        <div className="flex flex-col leading-tight">
          <span className="font-bold tracking-wide" style={{ color: textColor, fontSize: "1rem" }}>
            SAVERDEV
          </span>
          <span className="text-[0.62rem] uppercase tracking-[0.18em]" style={{ color: subColor }}>
            Sahel Vert · Développement
          </span>
        </div>
      )}
    </div>
  );
}
