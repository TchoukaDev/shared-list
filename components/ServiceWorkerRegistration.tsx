"use client"

import { useEffect } from "react"

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    // Le SW appelle déjà self.skipWaiting() à l'install — il prend le contrôle immédiatement.
    // On écoute controllerchange pour recharger la page et servir les nouveaux assets.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload()
    })

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed:", err)
    })
  }, [])

  return null
}
