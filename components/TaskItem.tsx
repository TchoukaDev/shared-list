"use client"

import type { Task } from "@/lib/types"

interface Props {
  task: Task
  // Nom résolu de l'auteur — la résolution id→nom se fait dans le parent
  createdByName?: string
}

// Composant pour un item de liste.
// Animations task-in/task-out définies dans globals.css.
export default function TaskItem({ task, createdByName }: Props) {
  return (
    // animate-task-in : l'item glisse vers le bas à l'apparition
    <li className="flex items-center gap-3 px-4 py-3 animate-task-in">

      {/* ── Gauche : bouton de validation ── */}
      {/* Cercle vide = non complété, cercle plein + coche = complété */}
      <button
        className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: task.completed ? "var(--color-sage-500)" : "var(--color-stone-300)",
          backgroundColor: task.completed ? "var(--color-sage-500)" : "transparent",
        }}
        aria-label={task.completed ? "Marquer comme non fait" : "Marquer comme fait"}
      >
        {task.completed && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* ── Centre : contenu + auteur ── */}
      <div className="flex-1 min-w-0">
        <span className={`text-sm ${task.completed ? "line-through text-stone-400" : "text-stone-900"}`}>
          {task.content}
        </span>
        {/* Affiché uniquement si le nom de l'auteur est connu */}
        {createdByName && (
          <p className="text-xs text-stone-400 mt-0.5">Ajouté par {createdByName}</p>
        )}
      </div>

      {/* ── Droite : modifier + supprimer ── */}
      <div className="flex items-center shrink-0">
        {/* Modifier */}
        <button
          className="p-2 text-stone-400 hover:text-stone-700 transition-colors"
          aria-label="Modifier"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>

        {/* Supprimer */}
        <button
          className="p-2 text-stone-400 hover:text-red-500 transition-colors"
          aria-label="Supprimer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>

    </li>
  )
}
