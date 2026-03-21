"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { List, ListWithCount } from "@/lib/types"

export function useRealtimeLists(initialLists: ListWithCount[]): ListWithCount[] {
  const [lists, setLists] = useState<ListWithCount[]>(initialLists)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("lists")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lists" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newList = payload.new as List
            // Nouvelle liste — pas encore de tâches, compteurs à 0
            setLists((prev) => [...prev, { list: newList, taskCount: 0, completedCount: 0 }])
          }

          if (payload.eventType === "UPDATE") {
            const updatedList = payload.new as List
            // On remplace la liste mais on conserve les compteurs existants
            setLists((prev) =>
              prev.map((item) =>
                item.list.id === updatedList.id
                  ? { ...item, list: updatedList }
                  : item
              )
            )
          }

          if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id as string
            setLists((prev) => prev.filter((item) => item.list.id !== deletedId))
          }
        }
      )
      .subscribe()

    // Nettoyage : on se désabonne quand le composant se démonte
    return () => {
      supabase.removeChannel(channel)
    }
  }, []) // [] : on s'abonne une seule fois au montage

  return lists
}
