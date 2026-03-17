"use client"

// Modale de création d'une liste.
// Reçoit onClose pour fermer depuis l'extérieur.
// La logique de soumission sera ajoutée ultérieurement.

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";

interface Props {
  onClose: () => void
  userId: string | null
}

export default function CreateListModal({ onClose, userId }: Props) {
  const [listName, setListName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient()

  if (!userId) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      if (listName.trim() === "") {
        setError("Le nom de la liste est requis");
        return;
      }
      if (listName.length > 255) {
        setError("Le nom de la liste doit être inférieur à 255 caractères");
        return;
      }

      const { count: existingName, error } = await supabase.from("lists").select("*", { count: "exact", head: true }).eq("name", listName);


      if (error) {
        setError("Une erreur est survenue lors de la vérification du nom de la liste");
        return;
      }
      if (existingName && existingName > 0) {
        setError("Ce nom de liste est déjà utilisé");
        return;
      }
      await supabase.from("lists").insert({ name: listName, owner_id: userId })
      toast.success("Liste créée avec succès");
      onClose();

    } catch (error) {
      setError("Une erreur est survenue lors de la création de la liste");

    } finally {
      setLoading(false);
    }
  }
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
            onChange={(e) => setListName(e.target.value)}
            autoFocus
            className="w-full px-3 py-2.5 text-sm rounded-md border border-stone-200 bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-terra-500/30 focus:border-terra-500 transition"
          />
          {error && <p className="text-sm text-red-500 mt-2 text-center">{error}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              Annuler
            </button>
            <button
              disabled={loading}
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
