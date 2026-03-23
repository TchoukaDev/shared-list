import { createClient } from "@/lib/supabase/client"
import type { List, Task, ListWithCount } from "@/lib/types"

export async function fetchLists(): Promise<ListWithCount[]> {
  const supabase = createClient()

  const { data: lists } = await supabase
    .from("lists")
    .select("*")
    .order("updated_at", { ascending: true })

  return Promise.all(
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
}

export async function fetchTasks(listId: string): Promise<Task[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("list_id", listId)
    .order("position", { ascending: true })
  return data ?? []
}
