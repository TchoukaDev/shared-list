"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import CreateListModal from "@/components/modals/CreateListModal"

interface Props {
  userId: string | null
}

export default function NewListButton({ userId }: Props) {
  const [open, setOpen] = useState(false)

  if (!userId) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-terra-500 hover:bg-terra-600 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Nouvelle liste
      </button>

      {open && createPortal(
        <CreateListModal onClose={() => setOpen(false)} userId={userId} />,
        document.body
      )}
    </>
  )
}
