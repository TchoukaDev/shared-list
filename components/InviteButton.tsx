"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import InviteModal from "@/components/modals/InviteModal"

interface Props {
  listId: string
}

export default function InviteButton({ listId }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-terra-500 hover:text-terra-600 bg-terra-100 hover:bg-terra-100/80 px-3 py-1.5 rounded-md transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
        Inviter
      </button>

      {open && createPortal(
        <InviteModal listId={listId} onClose={() => setOpen(false)} />,
        document.body
      )}
    </>
  )
}
