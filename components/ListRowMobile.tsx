"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import type { List } from "@/lib/types"
import { listColor } from "@/lib/utils"

interface Props {
  list: List
  index: number
  taskCount: number
  completedCount: number
  isOwner: boolean
  onEdit?: () => void
  onDelete?: () => void
}

const SWIPE_THRESHOLD = 60
const ACTIONS_WIDTH = 96

export default function ListRowMobile({ list, index, taskCount, completedCount, isOwner, onEdit, onDelete }: Props) {
  const color = listColor(index)

  const [offsetX, setOffsetX] = useState(0)
  const [swiped, setSwiped] = useState(false)
  const [dragging, setDragging] = useState(false)

  const startX = useRef(0)
  const isDragging = useRef(false)
  const justClosedSwipe = useRef(false)

  // Ferme le swipe sur tap en dehors
  useEffect(() => {
    if (!swiped) return
    function handleOutsideClick() {
      setOffsetX(0)
      setSwiped(false)
      justClosedSwipe.current = true
    }
    document.addEventListener("pointerdown", handleOutsideClick)
    return () => document.removeEventListener("pointerdown", handleOutsideClick)
  }, [swiped])

  function handlePointerDown(e: React.PointerEvent) {
    if (!isOwner) return
    if ((e.target as HTMLElement).closest("[data-action]")) return
    startX.current = e.clientX
    isDragging.current = false
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isOwner) return
    const delta = e.clientX - startX.current
    if (Math.abs(delta) > 5) { isDragging.current = true; setDragging(true) }

    if (swiped) {
      const raw = -ACTIONS_WIDTH + delta
      setOffsetX(Math.max(-ACTIONS_WIDTH, Math.min(0, raw)))
    } else {
      setOffsetX(Math.min(0, delta))
    }
  }

  function handlePointerUp() {
    if (!isDragging.current) {
      if (swiped) {
        setOffsetX(0)
        setSwiped(false)
        justClosedSwipe.current = true
      }
      return
    }

    setDragging(false)
    isDragging.current = false

    if (swiped) {
      const shouldClose = offsetX > -ACTIONS_WIDTH + SWIPE_THRESHOLD
      setOffsetX(shouldClose ? 0 : -ACTIONS_WIDTH)
      setSwiped(!shouldClose)
    } else {
      const shouldOpen = offsetX < -SWIPE_THRESHOLD
      setOffsetX(shouldOpen ? -ACTIONS_WIDTH : 0)
      setSwiped(shouldOpen)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Boutons d'action — visibles uniquement pour le owner */}
      {isOwner && (
        <div
          className="absolute inset-y-0 right-0 flex items-stretch"
          style={{ width: ACTIONS_WIDTH }}
          aria-hidden={!swiped}
        >
          <button
            data-action
            onClick={() => { setOffsetX(0); setSwiped(false); onEdit?.() }}
            className="flex-1 flex items-center justify-center bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
            aria-label="Modifier la liste"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>

          <button
            data-action
            onClick={() => { setOffsetX(0); setSwiped(false); onDelete?.() }}
            className="flex-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-colors"
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
      )}

      {/* Contenu */}
      <div
        className="card flex items-center gap-4 px-4 py-4 cursor-pointer select-none touch-pan-y"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: dragging ? "none" : "transform 0.2s ease",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />

        <Link
          href={swiped ? "#" : `/lists/${list.id}`}
          className="flex-1 min-w-0"
          onClick={(e) => {
            if (isDragging.current || swiped || justClosedSwipe.current) {
              e.preventDefault()
              setOffsetX(0)
              setSwiped(false)
              justClosedSwipe.current = false
            }
          }}
        >
          <p className="font-medium text-stone-900 text-sm truncate">{list.name}</p>
          {taskCount > 0 ? (
            <p className="text-xs text-stone-400 mt-0.5">{completedCount}/{taskCount} complété{completedCount > 1 ? "s" : ""}</p>
          ) : (
            <p className="text-xs text-stone-300 mt-0.5">Aucun élément</p>
          )}
        </Link>

        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-300 shrink-0" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  )
}
