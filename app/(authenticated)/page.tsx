import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ListsList from "@/components/ListsList"
import type { List, ListWithCount } from "@/lib/types"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: lists } = await supabase
    .from("lists")
    .select("*")
    .order("updated_at", { ascending: true })

  const listsWithCounts: ListWithCount[] = await Promise.all(
    (lists ?? []).map(async (list: List) => {
      const { count: taskCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("list_id", list.id)
      const { count: completedCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("list_id", list.id)
        .eq("completed", true)
      return { list, taskCount: taskCount ?? 0, completedCount: completedCount ?? 0 }
    })
  )

  return <ListsList lists={listsWithCounts} userId={user.id} />
}
