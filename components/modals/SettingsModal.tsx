"use client"

import { createClient } from "@/lib/supabase/client"
import { Profile } from "@/lib/types"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "react-toastify"

interface Props {
  profile: Profile | null
  onClose: () => void
}

export default function SettingsModal({ profile, onClose }: Props) {

  const supabase = createClient()
  const router = useRouter()
  const [firstName, setFirstName] = useState(profile?.first_name || "")
  const [lastName, setLastName] = useState(profile?.last_name || "")
  // avatarPreview : URL locale (createObjectURL) ou URL distante existante
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null)
  // avatarFile : le fichier sélectionné, null si pas de changement
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!profile) return null

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    // Aperçu immédiat sans uploader — l'URL est locale, valide tant que la page est ouverte
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmedFirstName = firstName.trim()
    const trimmedLastName = lastName.trim()

    if (!trimmedFirstName) {
      toast.error("Veuillez saisir votre prénom")
      return
    }

    if (!trimmedLastName) {
      toast.error("Veuillez saisir votre nom")
      return
    }

    let avatarUrl = profile.avatar_url

    // Upload uniquement si un nouveau fichier a été sélectionné
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop()
      const path = `${profile.id}/${Date.now()}.${ext}`

      // 1. Upload du nouveau fichier d'abord
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true })

      if (uploadError) {
        toast.error("Erreur lors de l'upload de l'image")
        return
      }

      // getPublicUrl est synchrone — pas de requête réseau, c'est juste la construction de l'URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(path)
      avatarUrl = data.publicUrl
    }

    const { error } = await supabase
      .from("profiles")
      .update({ first_name: trimmedFirstName, last_name: trimmedLastName, avatar_url: avatarUrl })
      .eq("id", profile.id)

    if (error) {
      toast.error("Une erreur est survenue lors de la modification")
      return
    }

    // 3. Supprime l'ancien fichier seulement si l'update a réussi
    if (avatarFile && profile.avatar_url) {
      const oldPath = profile.avatar_url.split("/avatars/")[1]
      if (oldPath) {
        await supabase.storage.from("avatars").remove([oldPath])
        // On ignore l'erreur : fichier orphelin dans le bucket, pas bloquant
      }
    }

    toast.success("Profil mis à jour avec succès")
    router.refresh()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Paramètres"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-900/40 animate-fade-in" onClick={onClose} />

      {/* Panneau */}
      <div className="card relative z-10 w-full sm:max-w-sm mx-4 p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-stone-900">Mon profil</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Fermer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-stone-100">
            {/* Input caché — déclenché par le bouton ci-dessous */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Avatar"
                width={64}
                height={64}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-terra-100 flex items-center justify-center text-terra-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-terra-500 hover:text-terra-600 transition-colors"
            >
              Changer la photo
            </button>
          </div>

          {/* Prénom */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">
              Prénom
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ton prénom"
              className="w-full px-3 py-2.5 text-sm rounded-md border border-stone-200 bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-terra-500/30 focus:border-terra-500 transition"
            />
          </div>

          {/* Nom */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">
              Nom
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ton nom"
              className="w-full px-3 py-2.5 text-sm rounded-md border border-stone-200 bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-terra-500/30 focus:border-terra-500 transition"
            />
          </div>

          {/* Email — lecture seule */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">
              Email
            </label>
            <input
              type="email"
              disabled
              value={profile?.email ?? ""}
              className="w-full px-3 py-2.5 text-sm rounded-md border border-stone-200 bg-stone-50 text-stone-400 cursor-not-allowed"
            />
            <p className="text-xs text-stone-400 mt-1">L'email ne peut pas être modifié</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-terra-500 hover:bg-terra-600 text-white rounded-md transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
