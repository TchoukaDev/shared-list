export default function Loading() {
  return (
    <div className="px-4 py-6 space-y-3 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-24 bg-stone-200 rounded animate-pulse" />
        <div className="h-9 w-9 bg-stone-200 rounded-full animate-pulse" />
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card p-4 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-stone-200 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-stone-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-stone-100 rounded animate-pulse w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
