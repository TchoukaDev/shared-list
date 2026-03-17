"use client"

import { useState } from "react"
import { toast } from "react-toastify"

interface Props {
  listId: string
  onClose: () => void
}

export default function InviteModal({ listId, onClose }: Props) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) { setError("L'email est requis"); return }

    setLoading(true)
    setError("")

    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listId, email: trimmed }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? "Une erreur est survenue")
      return
    }

    toast.success("Membre ajouté avec succès")
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Inviter un utilisateur"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-900/40 animate-fade-in" onClick={onClose} />

      {/* Panneau */}
      <div className="card relative z-10 w-full sm:max-w-sm mx-4 p-6 animate-slide-up">
        <h2 className="text-base font-semibold text-stone-900 mb-1">Inviter un membre</h2>
        <p className="text-sm text-stone-500 mb-4">
          La personne doit déjà avoir un compte pour être invitée.
        </p>


        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemple.com"
            autoFocus
            inputMode="email"
            className="w-full px-3 py-2.5 text-sm rounded-md border border-stone-200 bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-terra-500/30 focus:border-terra-500 transition"
          />
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

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
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-terra-500 hover:bg-terra-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Envoi…" : "Inviter"}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
