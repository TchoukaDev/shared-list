export default function Loading() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <div className="h-4 w-20 bg-stone-200 rounded animate-pulse" />
      <div className="card overflow-hidden">
        <div className="px-4 py-4 border-b border-stone-200 flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-stone-200 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-stone-200 rounded animate-pulse w-1/2" />
            <div className="h-3 bg-stone-100 rounded animate-pulse w-1/4" />
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-stone-100 flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-stone-200 animate-pulse shrink-0" />
            <div className="h-4 bg-stone-100 rounded animate-pulse flex-1" />
          </div>
        ))}
        <div className="px-4 py-3">
          <div className="h-4 w-32 bg-stone-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
