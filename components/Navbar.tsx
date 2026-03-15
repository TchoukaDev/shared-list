"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()

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

        {/* Bouton de déconnexion en absolu à droite pour ne pas décaler le titre centré */}
        <button
          onClick={handleSignOut}
          className="absolute right-4 p-2 rounded-md text-stone-700 hover:text-stone-900 hover:bg-terra-200 transition-colors"
          aria-label="Se déconnecter"
        >
          {/* Icône logout */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>

      </div>
    </header>
  )
}
