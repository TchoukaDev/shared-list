import ListRow from "@/components/ListRow"
import type { List } from "@/lib/types"

// Données fictives — à remplacer par les vraies requêtes Supabase
// Les compteurs (taskCount, completedCount) seront calculés via COUNT() dans la requête
const MOCK_LISTS = [
  { list: { id: "1", name: "Courses",       owner_id: "u1", created_at: "", updated_at: "" } as List, taskCount: 3, completedCount: 1 },
  { list: { id: "2", name: "Bricolage",     owner_id: "u1", created_at: "", updated_at: "" } as List, taskCount: 2, completedCount: 2 },
  { list: { id: "3", name: "Vide-greniers", owner_id: "u1", created_at: "", updated_at: "" } as List, taskCount: 0, completedCount: 0 },
]

export default function HomePage() {
  return (
    <div className="px-4 py-6 space-y-3 max-w-lg mx-auto">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-stone-900">Mes listes</h1>

        {/* Créer une nouvelle liste */}
        <button className="flex items-center gap-1.5 bg-terra-500 hover:bg-terra-600 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouvelle liste
        </button>
      </div>

      {/* ── Lignes de listes ── */}
      {MOCK_LISTS.length > 0 ? (
        MOCK_LISTS.map(({ list, taskCount, completedCount }, index) => (
          <ListRow key={list.id} list={list} index={index} taskCount={taskCount} completedCount={completedCount} />
        ))
      ) : (
        <div className="card p-10 text-center">
          <p className="text-stone-400 text-sm">Aucune liste pour l&apos;instant</p>
          <p className="text-stone-300 text-xs mt-1">Crée ta première liste ci-dessus</p>
        </div>
      )}

    </div>
  )
}
