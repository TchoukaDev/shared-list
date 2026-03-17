"use client"

import ListRow from "@/components/ListRow"
import NewListButton from "@/components/NewListButton"
import type { ListWithCount } from "@/lib/types"

interface Props {
  lists: ListWithCount[]
  userId: string | null
}

export default function ListsList({ lists, userId }: Props) {

  if (!userId) {
    return null;
  }
  return (
    <div className="px-4 py-6 space-y-3 max-w-lg mx-auto">

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-stone-900">Mes listes</h1>
        <NewListButton userId={userId} />
      </div>

      {lists.length > 0 ? (
        lists.map(({ list, taskCount, completedCount }, index) => (
          <ListRow key={list.id} list={list} index={index} taskCount={taskCount} completedCount={completedCount} />
        ))
      ) : (
        <div className="card p-10 text-center">
          <p className="text-stone-400 text-sm">Aucune liste pour l&apos;instant</p>
          <p className="text-stone-300 text-xs mt-1">Crée ta première liste ci-dessus</p>
        </div>
      )}

    </div>
  )
}
