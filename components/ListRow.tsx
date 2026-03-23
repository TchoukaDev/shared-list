"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { List, ListWithCount } from "@/lib/types"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import ListRowMobile from "@/components/ListRowMobile"
import ListRowDesktop from "@/components/ListRowDesktop"
import EditListModal from "@/components/modals/EditListModal"
import DeleteListModal from "@/components/modals/DeleteListModal"
import { createClient } from "@/lib/supabase/client"
import { toast } from "react-toastify"

interface Props {
  list: List
  index: number
  taskCount: number
  completedCount: number
  userId: string | null
}

export default function ListRow({ list, index, taskCount, completedCount, userId }: Props) {
  const isOwner = userId === list.owner_id
  const supabase = createClient()
  const queryClient = useQueryClient()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  // ── Modifier ────────────────────────────────────────────────

  const editMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { count: existingName, error } = await supabase
        .from("lists")
        .select("*", { count: "exact", head: true })
        .eq("name", name)
      if (error) throw new Error("Erreur lors de la vérification du nom")
      if (existingName && existingName > 0) throw new Error("Ce nom de liste est déjà utilisé")
      const { error: updateError } = await supabase.from("lists").update({ name }).eq("id", id)
      if (updateError) throw new Error("Impossible de modifier la liste")
    },
    onMutate: async ({ id, name }) => {
      // Annule les refetch en cours pour éviter d'écraser l'optimistic update
      await queryClient.cancelQueries({ queryKey: ["lists", userId] })
      const previous = queryClient.getQueryData<ListWithCount[]>(["lists", userId])
      queryClient.setQueryData<ListWithCount[]>(["lists", userId], (prev) =>
        prev?.map(item => item.list.id === id ? { ...item, list: { ...item.list, name } } : item) ?? []
      )
      return { previous }
    },
    onError: (error, _, context) => {
      // Rollback
      if (context?.previous) queryClient.setQueryData(["lists", userId], context.previous)
      toast.error(error instanceof Error ? error.message : "Impossible de modifier la liste")
    },
    onSuccess: () => {
      toast.success("Nom de liste modifié avec succès")
      setShowEdit(false)
    },
  })

  // ── Supprimer ───────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lists").delete().eq("id", id)
      if (error) throw new Error("Impossible de supprimer la liste")
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["lists", userId] })
      const previous = queryClient.getQueryData<ListWithCount[]>(["lists", userId])
      queryClient.setQueryData<ListWithCount[]>(["lists", userId], (prev) =>
        prev?.filter(item => item.list.id !== id) ?? []
      )
      return { previous }
    },
    onError: (_, __, context) => {
      // Rollback
      if (context?.previous) queryClient.setQueryData(["lists", userId], context.previous)
      toast.error("Impossible de supprimer la liste")
    },
    onSuccess: () => {
      // Notifie les membres — fire and forget
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "list_deleted", listId: list.id, listName: list.name }),
      })
      toast.success("Liste supprimée avec succès")
      setShowDelete(false)
    },
  })

  const sharedProps = {
    list,
    index,
    taskCount,
    completedCount,
    isOwner,
    onEdit: isOwner ? () => setShowEdit(true) : undefined,
    onDelete: isOwner ? () => setShowDelete(true) : undefined,
  }

  return (
    <>
      {isDesktop
        ? <ListRowDesktop {...sharedProps} />
        : <ListRowMobile {...sharedProps} />
      }

      {showEdit && createPortal(
        <EditListModal
          list={list}
          onClose={() => setShowEdit(false)}
          onEdit={(id, name) => editMutation.mutate({ id, name })}
          isLoading={editMutation.isPending}
        />,
        document.body
      )}
      {showDelete && createPortal(
        <DeleteListModal
          list={list}
          onClose={() => setShowDelete(false)}
          onDelete={(id) => deleteMutation.mutate(id)}
          isLoading={deleteMutation.isPending}
        />,
        document.body
      )}
    </>
  )
}
