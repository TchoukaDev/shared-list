const CACHE_NAME = "shared-list-v1"

// Assets statiques à mettre en cache au premier chargement
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icon.svg",
]

// Installation : on précharge les assets statiques
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  // Active immédiatement sans attendre la fermeture des autres onglets
  self.skipWaiting()
})

// Activation : supprime les anciens caches (versions précédentes)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Push : affiche la notification reçue du serveur
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Shared List", {
      body: data.body ?? "",
      icon: "/icons/web-app-manifest-192x192.png",
      badge: "/icons/web-app-manifest-192x192.png",
      data: { url: data.url ?? "/" },
    })
  )
})

// Clic sur la notification — ouvre ou focus l'app
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      const url = event.notification.data?.url ?? "/"
      // Si un onglet est déjà ouvert, on le focus
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus()
          return
        }
      }
      // Sinon on ouvre un nouvel onglet
      clients.openWindow(url)
    })
  )
})

// Fetch : stratégie "network first" — on essaie le réseau, fallback sur le cache
// On ne cache pas les appels Supabase (API, auth, realtime)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Ignore les requêtes non-GET et les appels Supabase
  if (event.request.method !== "GET") return
  if (url.hostname.includes("supabase.co")) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mise en cache uniquement des assets statiques (_next/static)
        if (url.pathname.startsWith("/_next/static")) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request) ?? caches.match("/offline"))
  )
})
