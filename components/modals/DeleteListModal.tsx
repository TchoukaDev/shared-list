"use client"


interface Props {
  list: { id: string; name: string }
  onClose: () => void
  onDelete: (id: string) => void
  isLoading: boolean
}

export default function DeleteListModal({ list, onClose, onDelete, isLoading }: Props) {


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Supprimer la liste"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panneau */}
      <div className="card relative z-10 w-full sm:max-w-sm mx-4 p-6 animate-slide-up">
        <h2 className="text-base font-semibold text-stone-900 mb-1">
          Supprimer la liste
        </h2>
        <p className="text-sm text-stone-500 mb-6">
          Supprimer <span className="font-medium text-stone-700">{list.name}</span> ? Cette action est irréversible.
        </p>
        <form onSubmit={() => onDelete(list.id)}>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
            >
              Supprimer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
