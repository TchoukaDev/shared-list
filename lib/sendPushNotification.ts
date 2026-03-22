import webpush from "web-push"
import { createAdminClient } from "@/lib/supabase/admin"

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

interface Payload {
  title: string
  body: string
  url: string
}

// Envoie une notification push à une liste de destinataires
export async function sendPushNotification(recipientIds: string[], payload: Payload) {
  if (!recipientIds.length) return

  const admin = createAdminClient()

  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", recipientIds)

  if (!subscriptions?.length) return

  await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  )
}
