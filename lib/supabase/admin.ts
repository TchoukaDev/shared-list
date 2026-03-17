import { createClient } from "@supabase/supabase-js"

// Client admin avec la Secret Key — jamais importé côté client.
// Bypass le RLS, uniquement pour les opérations serveur sensibles.
export const createAdminClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEYS) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEYS is not set")
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEYS,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
