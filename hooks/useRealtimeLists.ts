"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import type { List, ListWithCount } from "@/lib/types"

export function useRealtimeLists(userId: string): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("lists")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lists" },
        (payload: RealtimePostgresChangesPayload<List>) => {
          queryClient.setQueryData<ListWithCount[]>(["lists", userId], (prev) => {
            if (!prev) return prev

            if (payload.eventType === "INSERT") {
              const newList = payload.new as List
              if (prev.some(item => item.list.id === newList.id)) return prev
              return [...prev, { list: newList, taskCount: 0, completedCount: 0 }]
            }

            if (payload.eventType === "UPDATE") {
              const updatedList = payload.new as List
              return prev.map(item =>
                item.list.id === updatedList.id ? { ...item, list: updatedList } : item
              )
            }

            if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as { id: string }).id
              return prev.filter(item => item.list.id !== deletedId)
            }

            return prev
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, queryClient])
}
