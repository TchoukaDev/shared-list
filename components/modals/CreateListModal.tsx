"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { toast } from "react-toastify"

interface Props {
  onClose: () => void
  userId: string | null
}

export default function CreateListModal({ onClose, userId }: Props) {
  const [listName, setListName] = useState("")
  const [validationError, setValidationError] = useState("")
  const supabase = createClient()

  // Erreur serveur (doublon, insert échoué) — gérée via mutation.error
  // Erreur locale (nom vide, trop long) — gérée via validationError
  const mutation = useMutation({
    mutationFn: async (name: string) => {
      const { count: existingName, error } = await supabase
        .from("lists")
        .select("*", { count: "exact", head: true })
        .eq("name", name)
      if (error) throw new Error("Erreur lors de la vérification du nom")
      if (existingName && existingName > 0) throw new Error("Ce nom de liste est déjà utilisé")
      const { error: insertError } = await supabase
        .from("lists")
        .insert({ name, owner_id: userId })
      if (insertError) throw new Error("Impossible de créer la liste")
    },
    onSuccess: () => {
      toast.success("Liste créée avec succès")
      onClose()
    },
  })

  if (!userId) return null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setValidationError("")
    if (!listName.trim()) {
      setValidationError("Le nom de la liste est requis")
      return
    }
    if (listName.length > 255) {
      setValidationError("Le nom de la liste doit être inférieur à 255 caractères")
      return
    }
    mutation.mutate(listName.trim())
  }

  // Priorité : erreur locale > erreur serveur
  const errorMessage = validationError || (mutation.error instanceof Error ? mutation.error.message : "")

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Créer une liste"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panneau */}
      <div className="card relative z-10 w-full sm:max-w-sm mx-4 mb-4 sm:mb-0 p-6 animate-slide-up">
        <h2 className="text-base font-semibold text-stone-900 mb-4">
          Nouvelle liste
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nom de la liste"
            value={listName}
            onChange={(e) => { setListName(e.target.value); setValidationError("") }}
            autoFocus
            className="w-full px-3 py-2.5 text-sm rounded-md border border-stone-200 bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-terra-500/30 focus:border-terra-500 transition"
          />
          {errorMessage && <p className="text-sm text-red-500 mt-2 text-center">{errorMessage}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              Annuler
            </button>
            <button
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm font-medium bg-terra-500 hover:bg-terra-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
