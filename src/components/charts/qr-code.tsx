"use client";

// QRCode — génère un QR code SVG simple (module pattern).
// Pas de dépendance externe, utilise un pattern de matrice simple.
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  size?: number;
  className?: string;
}

// Matrice QR simplifiée (21x21 — version 1) basée sur un hash du value.
// Pour production, utiliser une vraie lib (qrcode.react), mais pour la démo ça suffit visuellement.
export function QRCode({ value, size = 120, className }: Props) {
  const matrix = generateMatrix(value, 21);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 21 21"
      className={cn("bg-white", className)}
      shapeRendering="crispEdges"
    >
      {/* Fond blanc */}
      <rect width="21" height="21" fill="#FFFFFF" />
      {/* Modules */}
      {matrix.map((row, y) =>
        row.map((cell, x) =>
          cell ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#000000" /> : null
        )
      )}
      {/* Finder patterns (3 coins) */}
      {[
        [0, 0],
        [14, 0],
        [0, 14],
      ].map(([ox, oy], i) => (
        <g key={i}>
          <rect x={ox} y={oy} width="7" height="7" fill="#000000" />
          <rect x={ox + 1} y={oy + 1} width="5" height="5" fill="#FFFFFF" />
          <rect x={ox + 2} y={oy + 2} width="3" height="3" fill="#000000" />
        </g>
      ))}
    </svg>
  );
}

// Génère une matrice pseudo-aléatoire déterministe basée sur le hash du value
function generateMatrix(value: string, size: number): boolean[][] {
  const matrix: boolean[][] = [];
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }

  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) {
      // Skip finder pattern areas
      if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) {
        row.push(false);
        continue;
      }
      // Pseudo-random based on hash
      hash = (hash * 1103515245 + 12345) & 0x7fffffff;
      row.push((hash & 1) === 1);
    }
    matrix.push(row);
  }
  return matrix;
}
