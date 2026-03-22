"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import type { List } from "@/lib/types"
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
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleEdit = async (id: string, name: string) => {
    if (!isOwner) {
      toast.error("Tu n'es pas autorisé à modifier cette liste")
      return
    }
    setIsLoading(true)

    if (!id) {
      toast.error("Liste introuvable, essayez de recharger la page")
      return
    }
    if (!name.trim()) {
      toast.error("Un nom est requis pour la liste")
      return
    }
    if (name.length > 255) {
      toast.error("Le nom de la liste doit être inférieur à 255 caractères");
      return;
    }

    try {
      const { count: existingName, error } = await supabase.from("lists").select("*", { count: "exact", head: true }).eq('name', name)

      if (error) {
        toast.error("Une erreur est survenue lors de la récupération des listes")
        return
      }

      if (existingName && existingName > 0) {
        toast.error("Ce nom de liste est déjà utilisé")
        return
      }

      const { error: updateError } = await supabase.from("lists").update({ name }).eq("id", id)
      if (updateError) {
        toast.error("Impossible de modifier la liste, elle n'existe peut-être plus")
        return
      }
      toast.success("Nom de liste modifié avec succès")
      setShowEdit(false)
    } catch (error) {
      toast.error("Une erreur est survenue lors de la modification")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!isOwner) {
      toast.error("Tu n'es pas autorisé à supprimer cette liste")
      return
    }

    if (!id) {
      toast.error("Cette liste est introuvable, veuillez recharger la page")
      return
    }
    try {
      const { error: deleteError } = await supabase.from("lists").delete().eq("id", id)
      if (deleteError) {
        toast.error("Impossible de supprimer la liste, elle n'existe peut être plus.")
        return
      }
      // Notifie les membres avant que la liste soit supprimée en DB — fire and forget
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "list_deleted", listId: list.id, listName: list.name }),
      })

      toast.success("Liste supprimée avec succès")
      setShowDelete(false)
    } catch (error) {
      toast.error("Une erreur est survenue lors de la suppression")
    } finally {
      setIsLoading(false)
    }
  }

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
        <EditListModal list={list} onClose={() => setShowEdit(false)} onEdit={handleEdit} isLoading={isLoading} />,
        document.body
      )}
      {showDelete && createPortal(
        <DeleteListModal list={list} onClose={() => setShowDelete(false)} onDelete={handleDelete} isLoading={isLoading} />,
        document.body
      )}
    </>
  )
}
