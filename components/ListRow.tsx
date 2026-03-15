"use client"

import Link from "next/link"
import type { List } from "@/lib/types"
import { listColor } from "@/lib/utils"

interface Props {
  list: List
  index: number       // position dans la liste — détermine la couleur
  taskCount: number
  completedCount: number
}

// Ligne représentant une liste sur la page d'accueil.
// Affiche : couleur, nom, progression des tâches, et un lien vers la page détail.
export default function ListRow({ list, index, taskCount, completedCount }: Props) {
  const color = listColor(index)
  return (
    <Link
      href={`/lists/${list.id}`}
      className="card flex items-center gap-4 px-4 py-4 active:scale-[0.98] transition-transform"
    >
      {/* Pastille de couleur */}
      <span
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />

      {/* Nom + progression */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-stone-900 text-sm truncate">{list.name}</p>
        {taskCount > 0 ? (
          <p className="text-xs text-stone-400 mt-0.5">
            {completedCount}/{taskCount} complété{completedCount > 1 ? "s" : ""}
          </p>
        ) : (
          <p className="text-xs text-stone-300 mt-0.5">Aucun élément</p>
        )}
      </div>

      {/* Chevron — indique la navigation */}
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-300 shrink-0" aria-hidden="true">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  )
}
