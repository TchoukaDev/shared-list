"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import type { Task } from "@/lib/types"

// Clé stable pour React — évite le remount au remplacement temp → réel
type TaskWithKey = Task & { _reactKey: string }

export function useRealtimeTasks(listId: string): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`tasks:${listId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload: RealtimePostgresChangesPayload<Task>) => {
          // Pour INSERT et UPDATE, on filtre par list_id
          // Pour DELETE, payload.old ne contient que l'id — on tente le retrait directement
          if (payload.eventType !== "DELETE") {
            if ((payload.new as Task).list_id !== listId) return
          }

          queryClient.setQueryData<TaskWithKey[]>(["tasks", listId], (prev) => {
            if (!prev) return prev

            if (payload.eventType === "INSERT") {
              const newTask = payload.new as Task
              // La tâche existe déjà → c'est notre propre optimistic update, on ignore
              if (prev.some(t => t.id === newTask.id)) return prev
              return [...prev, { ...newTask, _reactKey: newTask.id }]
            }

            if (payload.eventType === "UPDATE") {
              const updatedTask = payload.new as Task
              return prev.map(t =>
                t.id === updatedTask.id
                  ? { ...updatedTask, _reactKey: t._reactKey } // conserve la clé stable
                  : t
              )
            }

            if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as { id: string }).id
              return prev.filter(t => t.id !== deletedId)
            }

            return prev
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [listId, queryClient])
}
