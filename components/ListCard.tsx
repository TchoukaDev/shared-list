"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"
import { createClient } from "@/lib/supabase/client"
import type { List, Task } from "@/lib/types"
import { listColor } from "@/lib/utils"
import TaskItem from "./TaskItem"
import { useRealtimeTasks } from "@/hooks/useRealtimeTasks"
import { fetchTasks } from "@/lib/queries"

type TaskWithKey = Task & { _reactKey: string }

interface Props {
  list: List
  tasks: Task[]
  index: number
  userId: string
  memberNames?: Record<string, string>
}

export default function ListCard({ list, tasks: initialTasks, index, userId, memberNames = {} }: Props) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [addingTask, setAddingTask] = useState(false)
  const [newTaskContent, setNewTaskContent] = useState("")

  // Résout l'index de couleur depuis le cache ["lists", userId] si disponible.
  // Fallback sur la prop index (0 depuis la page détail, correct depuis ListsList).
  const lists = queryClient.getQueryData<import("@/lib/types").ListWithCount[]>(["lists", userId])
  const cachedIndex = lists?.findIndex(item => item.list.id === list.id) ?? -1
  const colorIndex = cachedIndex >= 0 ? cachedIndex : index

  const { data: tasks = [] } = useQuery<TaskWithKey[]>({
    queryKey: ["tasks", list.id],
    queryFn: async () => {
      const data = await fetchTasks(list.id)
      return data.map(t => ({ ...t, _reactKey: t.id }))
    },
    initialData: initialTasks.map(t => ({ ...t, _reactKey: t.id })),
  })

  useRealtimeTasks(list.id)

  // Alias pour les optimistic updates — même signature que l'ancien setTasks
  const setTasks = (updater: TaskWithKey[] | ((prev: TaskWithKey[]) => TaskWithKey[])) => {
    queryClient.setQueryData<TaskWithKey[]>(["tasks", list.id], (prev) => {
      const current = prev ?? []
      return typeof updater === "function" ? updater(current) : updater
    })
  }

  const completedCount = tasks.filter(t => t.completed).length
  const color = listColor(colorIndex)

  const updatedAt = list.updated_at
    ? new Date(list.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : null

  // ── Ajouter ────────────────────────────────────────────────

  async function handleAddTask() {
    const content = newTaskContent.trim()
    if (!content) { setAddingTask(false); return }

    // Position = après la dernière tâche
    const position = tasks.length > 0 ? Math.max(...tasks.map(t => t.position)) + 1 : 0

    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const tempTask: TaskWithKey = {
      id: tempId,
      _reactKey: tempId,
      list_id: list.id,
      content,
      completed: false,
      position,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setTasks(prev => [...prev, tempTask])
    setNewTaskContent("")
    setAddingTask(false)

    const { data, error } = await supabase
      .from("tasks")
      .insert({ list_id: list.id, content, position, created_by: userId })
      .select()
      .single()

    if (error || !data) {
      setTasks(prev => prev.filter(t => t.id !== tempTask.id))
      toast.error("Impossible d'ajouter la tâche")
      return
    }

    // Remplace la tâche temporaire par la vraie.
    // Filtre aussi l'éventuel doublon ajouté par Realtime avant que le retour serveur arrive.
    setTasks(prev => {
      const filtered = prev.filter(t => t.id !== tempTask.id && t.id !== data.id)
      return [...filtered, { ...data, _reactKey: tempTask._reactKey }]
    })

    // Notifie les autres membres — fire and forget
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "task_added", listId: list.id, listName: list.name }),
    })
  }

  function handleAddKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAddTask()
    if (e.key === "Escape") { setAddingTask(false); setNewTaskContent("") }
  }

  // ── Valider / décocher ─────────────────────────────────────

  async function handleToggle(id: string, currentCompleted: boolean) {
    const newCompleted = !currentCompleted

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t))

    const { error } = await supabase
      .from("tasks")
      .update({ completed: newCompleted })
      .eq("id", id)

    if (error) {
      // Rollback
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: currentCompleted } : t))
      toast.error("Impossible de modifier la tâche")
    }
  }

  // ── Supprimer ──────────────────────────────────────────────

  async function handleDelete(id: string) {
    const previous = tasks.find(t => t.id === id)

    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== id))

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)

    if (error) {
      // Rollback — previous conserve déjà _reactKey
      if (previous) setTasks(prev => [...prev, previous].sort((a, b) => a.position - b.position))
      toast.error("Impossible de supprimer la tâche")
      return
    }

    // Notifie les autres membres — fire and forget
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "task_deleted", listId: list.id, listName: list.name }),
    })
  }

  // ── Modifier ───────────────────────────────────────────────

  async function handleEdit(id: string, content: string) {
    const previous = tasks.find(t => t.id === id)

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, content } : t))

    const { error } = await supabase
      .from("tasks")
      .update({ content })
      .eq("id", id)

    if (error) {
      // Rollback
      if (previous) setTasks(prev => prev.map(t => t.id === id ? previous : t))
      toast.error("Impossible de modifier la tâche")
    }
  }

  return (
    <div className="card overflow-hidden">

      {/* ── Header — fond teinté avec la couleur de la liste ── */}
      <div
        className="flex items-center gap-3 px-4 py-4 border-b border-stone-200"
        style={{ backgroundColor: `${color}18` }}
      >
        <span className="w-4 h-4 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: color }} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-stone-900 truncate">{list.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            {tasks.length > 0 && (
              <p className="text-xs font-medium" style={{ color }}>
                {completedCount}/{tasks.length} complété{completedCount > 1 ? "s" : ""}
              </p>
            )}
            {updatedAt && (
              <p className="text-xs text-stone-400">· Modifié le {updatedAt}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Tâches ── */}
      {tasks.length > 0 ? (
        <ul className="divide-y divide-stone-100">
          {[...tasks].sort((a, b) => Number(a.completed) - Number(b.completed)).map(task => (
            <TaskItem
              key={task._reactKey}
              task={task}
              createdByName={task.created_by ? memberNames[task.created_by] : undefined}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-stone-400 text-center py-8">Aucun élément dans cette liste</p>
      )}

      {/* ── Ajouter une tâche ── */}
      <div className="border-t border-stone-100 px-4">
        {addingTask ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTaskContent}
              onChange={(e) => setNewTaskContent(e.target.value)}
              onKeyDown={handleAddKeyDown}
              autoFocus
              placeholder="Nouvelle tâche…"
              className="flex-1 py-3 text-sm text-stone-900 bg-transparent border-b border-terra-500 outline-none placeholder:text-stone-400"
            />
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleAddTask}
              className="p-1.5 text-terra-500 hover:text-terra-600 transition-colors"
              aria-label="Valider"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingTask(true)}
            className="flex items-center gap-2 w-full py-3 text-sm text-stone-500 hover:text-terra-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Ajouter un élément
          </button>
        )}
      </div>

    </div>
  )
}
