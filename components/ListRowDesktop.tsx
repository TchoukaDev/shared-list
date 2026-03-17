"use client"

import Link from "next/link"
import { useState } from "react"
import type { List } from "@/lib/types"
import { listColor } from "@/lib/utils"

interface Props {
  list: List
  index: number
  taskCount: number
  completedCount: number
  onEdit: () => void
  onDelete: () => void
}

export default function ListRowDesktop({ list, index, taskCount, completedCount, onEdit, onDelete }: Props) {
  const color = listColor(index)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="card flex items-center gap-4 px-4 py-4">
      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />

      <Link href={`/lists/${list.id}`} className="flex-1 min-w-0 active:scale-[0.98] transition-transform">
        <p className="font-medium text-stone-900 text-sm truncate">{list.name}</p>
        {taskCount > 0 ? (
          <p className="text-xs text-stone-400 mt-0.5">{completedCount}/{taskCount} complété{completedCount > 1 ? "s" : ""}</p>
        ) : (
          <p className="text-xs text-stone-300 mt-0.5">Aucun élément</p>
        )}
      </Link>

      {/* Menu "..." */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="p-1.5 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          aria-label="Actions"
          aria-expanded={menuOpen}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
          </svg>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-8 z-20 card py-1 w-40 animate-fade-in">
              <button
                onClick={() => { setMenuOpen(false); onEdit() }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Modifier
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete() }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                Supprimer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
