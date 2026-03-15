import Link from "next/link"
import ListCard from "@/components/ListCard"
import type { List, Task } from "@/lib/types"

// Données fictives — à remplacer par une requête Supabase avec le vrai id
const MOCK_LIST: List = {
  id: "1", name: "Courses", owner_id: "u1",
  created_at: "", updated_at: "2025-01-12T10:30:00Z",
}

const MOCK_TASKS: Task[] = [
  { id: "t1", list_id: "1", content: "Tomates cerises", completed: false, position: 0, created_by: "u1", created_at: "", updated_at: "" },
  { id: "t2", list_id: "1", content: "Pain de campagne", completed: true,  position: 1, created_by: "u2", created_at: "", updated_at: "" },
  { id: "t3", list_id: "1", content: "Comté 18 mois",   completed: false, position: 2, created_by: "u1", created_at: "", updated_at: "" },
]

// Mapping user_id → nom affiché — à remplacer par les vrais profils Supabase
const MOCK_MEMBER_NAMES: Record<string, string> = {
  u1: "Romain",
  u2: "Marie",
}

export default function ListDetailPage() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Mes listes
      </Link>
      {/* index=0 en mock — en prod, ce sera la position réelle dans la liste */}
      <ListCard list={MOCK_LIST} tasks={MOCK_TASKS} index={0} memberNames={MOCK_MEMBER_NAMES} />
    </div>
  )
}
