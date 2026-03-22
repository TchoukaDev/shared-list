"use client"

export default function OfflinePage() {
  return (
    <div className="min-h-dvh bg-sand-50 flex flex-col items-center justify-center px-6">
      <div className="card w-full max-w-sm p-8 text-center animate-slide-up">

        {/* Icône */}
        <div className="w-16 h-16 rounded-full bg-terra-100 flex items-center justify-center mx-auto mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-terra-500" aria-hidden="true">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>

        <h1 className="text-lg font-semibold text-stone-900 mb-2">Vous êtes hors-ligne</h1>
        <p className="text-sm text-stone-500 mb-6">
          Vérifiez votre connexion internet et réessayez.
        </p>

        <button
          onClick={() => { window.location.href = "/" }}
          className="w-full px-4 py-2.5 text-sm font-medium bg-terra-500 hover:bg-terra-600 text-white rounded-md transition-colors"
        >
          Réessayer
        </button>

      </div>
    </div>
  )
}
