"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { createClient } from "@/lib/supabase/client"
import SettingsModal from "@/components/modals/SettingsModal"
import { Profile } from "@/lib/types"
import Image from "next/image"

interface Props {
  profile: Profile | null
}

export default function Navbar({ profile }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [showSettings, setShowSettings] = useState(false)

  // Déconnecte l'utilisateur côté client et redirige vers /login
  // Le proxy bloquera tout accès aux routes protégées dès la déconnexion
  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    // safe-area-inset-top : sur iOS, évite que la navbar passe sous la Dynamic Island / barre de statut
    <header className="sticky top-0 z-10 bg-terra-100 border-b border-terra-200"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="relative flex items-center justify-center px-4 h-14">

        {/* Profil à gauche */}
        <button
          onClick={() => setShowSettings(true)}
          className="absolute left-4 flex items-center gap-2 hover:opacity-80 transition-opacity"
          aria-label="Mon profil"
        >
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt="Avatar"
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-terra-200 flex items-center justify-center text-terra-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
          <span className="text-sm font-medium text-stone-800 hidden sm:block">
            {[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email}
          </span>
        </button>

        {/* Titre centré */}
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-terra-500" aria-hidden="true">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span className="font-bold text-stone-900 text-base">Shared List</span>
        </div>

        {/* Boutons à droite */}
        <div className="absolute right-4 flex items-center gap-1">
          {/* Déconnexion */}
          <button
            onClick={handleSignOut}
            className="p-2 rounded-md text-stone-700 hover:text-stone-900 hover:bg-terra-200 transition-colors"
            aria-label="Se déconnecter"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>

        {showSettings && createPortal(
          <SettingsModal profile={profile} onClose={() => setShowSettings(false)} />,
          document.body
        )}

      </div>
    </header>
  )
}
