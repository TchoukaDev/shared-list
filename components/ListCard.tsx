"use client"

import type { List, Task } from "@/lib/types"
import { listColor } from "@/lib/utils"
import TaskItem from "./TaskItem"

interface Props {
  list: List
  tasks: Task[]
  index: number       // position dans la liste parente — détermine la couleur
  memberNames?: Record<string, string>
}

// Carte représentant une liste et ses tâches.
// Affiche un header coloré, les tâches, et un bouton d'ajout.
export default function ListCard({ list, tasks, index, memberNames = {} }: Props) {
  const completedCount = tasks.filter(t => t.completed).length
  const color = listColor(index)

  // Formate updated_at en date lisible française : "12 jan. 2025"
  const updatedAt = list.updated_at
    ? new Date(list.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : null

  return (
    <div className="card overflow-hidden">

      {/* ── Header : couleur de la liste, nom, actions ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-200">

        {/* Pastille de couleur associée à la liste */}
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />

        {/* Nom + compteur de progression + date de modification */}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-stone-900 text-sm truncate">{list.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            {tasks.length > 0 && (
              <p className="text-xs text-stone-400">
                {completedCount}/{tasks.length} complété{completedCount > 1 ? "s" : ""}
              </p>
            )}
            {updatedAt && (
              <p className="text-xs text-stone-300">· Modifié le {updatedAt}</p>
            )}
          </div>
        </div>

        {/* Modifier la liste */}
        <button
          className="p-2 text-stone-400 hover:text-stone-700 transition-colors"
          aria-label="Modifier la liste"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>

        {/* Supprimer la liste */}
        <button
          className="p-2 text-stone-400 hover:text-red-500 transition-colors"
          aria-label="Supprimer la liste"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>

      {/* ── Tâches ── */}
      {tasks.length > 0 ? (
        <ul className="divide-y divide-stone-100">
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              // Résout le nom depuis le mapping — undefined si inconnu
              createdByName={task.created_by ? memberNames[task.created_by] : undefined}
            />
          ))}
        </ul>
      ) : (
        // État vide
        <p className="text-sm text-stone-400 text-center py-8">
          Aucun élément dans cette liste
        </p>
      )}

      {/* ── Bouton d'ajout d'un item ── */}
      <div className="border-t border-stone-100 px-4">
        <button className="flex items-center gap-2 w-full py-3 text-sm text-stone-500 hover:text-terra-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ajouter un élément
        </button>
      </div>

    </div>
  )
}
