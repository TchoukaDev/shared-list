import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendPushNotification } from "@/lib/sendPushNotification"

type NotifyType = "list_deleted" | "task_added" | "task_deleted"

const TASK_THROTTLE_MS = 2 * 60 * 1000 // 2 minutes

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { type, listId, listName } = await req.json() as {
    type: NotifyType
    listId: string
    listName: string
  }

  if (!type || !listId || !listName) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const admin = createAdminClient()

  // Récupère owner + membres, exclut l'acteur
  const { data: list } = await admin.from("lists").select("owner_id").eq("id", listId).single()
  const { data: members } = await admin.from("list_members").select("user_id").eq("list_id", listId)

  const recipientIds = [
    list?.owner_id,
    ...(members?.map((m) => m.user_id) ?? []),
  ].filter((id): id is string => !!id && id !== user.id)

  if (!recipientIds.length) return NextResponse.json({ sent: 0 })

  // Throttle pour les events de tâches
  let filteredRecipients = recipientIds
  if (type === "task_added" || type === "task_deleted") {
    const now = new Date()

    const { data: throttles } = await admin
      .from("notification_throttle")
      .select("user_id, last_sent_at")
      .eq("list_id", listId)
      .in("user_id", recipientIds)

    filteredRecipients = recipientIds.filter((uid) => {
      const throttle = throttles?.find((t) => t.user_id === uid)
      if (!throttle) return true
      return now.getTime() - new Date(throttle.last_sent_at).getTime() > TASK_THROTTLE_MS
    })

    if (!filteredRecipients.length) return NextResponse.json({ sent: 0 })

    await admin.from("notification_throttle").upsert(
      filteredRecipients.map((uid) => ({
        user_id: uid,
        list_id: listId,
        last_sent_at: now.toISOString(),
      })),
      { onConflict: "user_id,list_id" }
    )
  }

  const messages: Record<NotifyType, { title: string; body: string; url: string }> = {
    list_deleted: {
      title: "Liste supprimée",
      body: `La liste "${listName}" a été supprimée`,
      url: "/",
    },
    task_added: {
      title: listName,
      body: "Une tâche a été ajoutée",
      url: `/lists/${listId}`,
    },
    task_deleted: {
      title: listName,
      body: "Une tâche a été supprimée",
      url: `/lists/${listId}`,
    },
  }

  await sendPushNotification(filteredRecipients, messages[type])
  return NextResponse.json({ sent: filteredRecipients.length })
}
