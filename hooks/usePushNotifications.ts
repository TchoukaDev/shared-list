"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function usePushNotifications(userId: string | null) {
  useEffect(() => {
    if (!userId) return
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return

    async function subscribe() {
      if (Notification.permission === "denied") return

      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()

      // Subscription déjà présente → déjà en DB, rien à faire
      if (existing) return

      // Première visite ou subscription expirée → on demande la permission
      const permission = await Notification.requestPermission()
      if (permission !== "granted") return

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      const keys = subscription.toJSON().keys as { p256dh: string; auth: string }

      const supabase = createClient()
      await supabase.from("push_subscriptions").upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      }, { onConflict: "user_id,endpoint" })
    }

    subscribe()
  }, [userId])
}
