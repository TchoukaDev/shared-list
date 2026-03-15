import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn() — fusionne des classes Tailwind en résolvant les conflits.
 *
 * Problème sans cn() :
 *   className="px-4 px-2"  →  les deux s'appliquent, comportement imprévisible
 *
 * Avec cn() :
 *   cn("px-4", "px-2")     →  "px-2"  (le dernier gagne, proprement)
 *   cn("px-4", false, condition && "bg-red-500")  →  ignore les falsy
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Palette de couleurs pour les listes — issues du design system
const LIST_COLORS = ["#c05a3a", "#5d8f6e", "#4a7fa5", "#c49a2e", "#8b6fa8", "#6b7a8d"] as const

/**
 * listColor(index) — retourne une couleur en fonction de la position de la liste.
 * Le modulo assure le cycle : 0→terra, 1→sage, 2→ardoise, 3→miel, etc.
 */
export function listColor(index: number): string {
  return LIST_COLORS[index % LIST_COLORS.length]
}

/**
 * formatDate() — date relative en français.
 * "à l'instant", "il y a 5 min", "hier", "12 jan."
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();

  const minutes = Math.floor(diff / 60_000);
  const hours   = Math.floor(diff / 3_600_000);
  const days    = Math.floor(diff / 86_400_000);

  if (minutes < 1)  return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (hours   < 24) return `il y a ${hours}h`;
  if (days    === 1) return 'hier';
  if (days    < 7)  return `il y a ${days} jours`;

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
