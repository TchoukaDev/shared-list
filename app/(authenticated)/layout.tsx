import NavbarServer from "@/components/NavbarServer"

// Layout appliqué uniquement aux routes authentifiées (hors /login).
// Le route group (app) n'affecte pas les URLs — / reste /, pas /app.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <NavbarServer />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
