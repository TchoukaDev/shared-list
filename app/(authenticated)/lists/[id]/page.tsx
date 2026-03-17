import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ListCard from "@/components/ListCard"

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: list } = await supabase
    .from("lists")
    .select("*")
    .eq("id", id)
    .single()

  if (!list) notFound()

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("list_id", id)
    .order("position", { ascending: true })

  // Calcule l'index de la liste pour déterminer sa couleur
  const { data: allLists } = await supabase
    .from("lists")
    .select("id")
    .order("updated_at", { ascending: true })

  const listIndex = allLists?.findIndex(l => l.id === id) ?? 0

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

      <ListCard list={list} tasks={tasks ?? []} index={listIndex} userId={user.id} />
    </div>
  )
}
