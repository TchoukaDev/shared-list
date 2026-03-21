"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Task } from "@/lib/types"

// Clé stable pour React — évite le remount au remplacement temp → réel
type TaskWithKey = Task & { _reactKey: string }

export function useRealtimeTasks(listId: string, initialTasks: Task[]): {
  tasks: TaskWithKey[]
  setTasks: React.Dispatch<React.SetStateAction<TaskWithKey[]>>
} {
  const [tasks, setTasks] = useState<TaskWithKey[]>(
    initialTasks.map(t => ({ ...t, _reactKey: t.id }))
  )

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`tasks:${listId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          // Pour INSERT et UPDATE, on filtre par list_id
          // Pour DELETE, payload.old ne contient que l'id — on tente le retrait directement
          if (payload.eventType !== "DELETE") {
            const eventListId = (payload.new as Task).list_id
            if (eventListId !== listId) return
          }

          if (payload.eventType === "INSERT") {
            const newTask = payload.new as Task
            setTasks(prev => {
              // La tâche existe déjà → c'est notre propre optimistic update, on ignore
              if (prev.some(t => t.id === newTask.id)) return prev
              return [...prev, { ...newTask, _reactKey: newTask.id }]
            })
          }

          if (payload.eventType === "UPDATE") {
            const updatedTask = payload.new as Task
            setTasks(prev =>
              prev.map(t =>
                t.id === updatedTask.id
                  ? { ...updatedTask, _reactKey: t._reactKey } // conserve la clé stable
                  : t
              )
            )
          }

          if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id as string
            setTasks(prev => prev.filter(t => t.id !== deletedId))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [listId])

  return { tasks, setTasks }
}
