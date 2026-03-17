"use client"

import { useState } from "react"

interface Props {
  list: { id: string; name: string },
  isLoading: boolean,
  onClose: () => void
  onEdit: (id: string, name: string) => void
}

export default function EditListModal({ list, onClose, onEdit, isLoading }: Props) {
  const [name, setName] = useState(list.name)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Modifier la liste"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panneau */}
      <div className="card relative z-10 w-full sm:max-w-sm mx-4 p-6 animate-slide-up">
        <h2 className="text-base font-semibold text-stone-900 mb-4">
          Modifier la liste
        </h2>
        <form onSubmit={() => onEdit(list.id, name)}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full px-3 py-2.5 text-sm rounded-md border border-stone-200 bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-terra-500/30 focus:border-terra-500 transition"
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={name.trim() === "" || name === list.name || isLoading}
              className="px-4 py-2 text-sm font-medium bg-terra-500 hover:bg-terra-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div >
  )
}
