"use client"

import { useRef, useState } from "react"
import type { Task } from "@/lib/types"

interface Props {
  task: Task
  createdByName?: string
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  onEdit: (id: string, content: string) => void
}

export default function TaskItem({ task, createdByName, onToggle, onDelete, onEdit }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(task.content)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setEditValue(task.content)
    setIsEditing(true)
    // Focus après le prochain render
    inputRef.current?.focus()
  }

  function commitEdit() {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== task.content) {
      onEdit(task.id, trimmed)
    }
    setIsEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commitEdit()
    if (e.key === "Escape") setIsEditing(false)
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3 animate-task-in">

      {/* ── Bouton de validation ── */}
      <button
        onClick={() => onToggle(task.id, task.completed)}
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

      {/* ── Contenu + auteur ── */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="w-full text-sm text-stone-900 bg-transparent border-b border-terra-500 outline-none pb-0.5"
          />
        ) : (
          <span className={`text-sm ${task.completed ? "line-through text-stone-400" : "text-stone-900"}`}>
            {task.content}
          </span>
        )}
        {createdByName && (
          <p className="text-xs text-stone-400 mt-0.5">Ajouté par {createdByName}</p>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center shrink-0">
        {/* Check pour valider l'édition — visible uniquement en mode édition */}
        {isEditing ? (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={commitEdit}
            className="p-2 text-terra-500 hover:text-terra-600 transition-colors"
            aria-label="Valider"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        ) : (
          /* Modifier — masqué si complété */
          !task.completed && (
            <button
              onClick={startEdit}
              className="p-2 text-stone-400 hover:text-stone-700 transition-colors"
              aria-label="Modifier"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )
        )}

        {/* Supprimer — toujours visible */}
        <button
          onClick={() => onDelete(task.id)}
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
