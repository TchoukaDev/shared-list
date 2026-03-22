import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendPushNotification } from "@/lib/sendPushNotification"

export async function POST(req: NextRequest) {
  const { listId, email } = await req.json()

  if (!listId || !email) {
    return NextResponse.json({ error: "listId et email sont requis" }, { status: 400 })
  }

  // Vérifie que l'appelant est authentifié
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  // Vérifie que l'appelant est bien owner de la liste
  const { data: list } = await supabase
    .from("lists")
    .select("owner_id, name")
    .eq("id", listId)
    .single()

  if (!list || list.owner_id !== user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  // Recherche l'utilisateur par email via le client admin (bypass RLS)
  const admin = createAdminClient()
  const { data: users, error: searchError } = await admin.auth.admin.listUsers()

  if (searchError) {
    return NextResponse.json({ error: "Erreur lors de la recherche de l'utilisateur" }, { status: 500 })
  }

  const target = users.users.find(u => u.email === email)

  if (!target) {
    return NextResponse.json({ error: "Aucun utilisateur trouvé avec cet email" }, { status: 404 })
  }

  if (target.id === user.id) {
    return NextResponse.json({ error: "Vous êtes déjà owner de cette liste" }, { status: 400 })
  }

  // Vérifie que l'utilisateur n'est pas déjà membre
  const { data: existing } = await supabase
    .from("list_members")
    .select("user_id")
    .eq("list_id", listId)
    .eq("user_id", target.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: "Cet utilisateur est déjà membre de la liste" }, { status: 400 })
  }

  // Ajoute le membre
  const { error: insertError } = await supabase
    .from("list_members")
    .insert({ list_id: listId, user_id: target.id, joined_at: new Date().toISOString() })

  if (insertError) {
    return NextResponse.json({ error: "Impossible d'ajouter le membre" }, { status: 500 })
  }

  // Notifie l'utilisateur invité — on ignore l'erreur, ce n'est pas bloquant
  await sendPushNotification([target.id], {
    title: "Nouvelle liste partagée",
    body: `Tu as été ajouté à la liste "${list.name}"`,
    url: "/",
  })

  return NextResponse.json({ success: true })
}
