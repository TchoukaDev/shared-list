import { createClient } from "@/lib/supabase/server"
import Navbar from "@/components/Navbar"

// Wrapper serveur — récupère le profil et le passe à la Navbar client
export default async function NavbarServer() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null }

  return <Navbar profile={profile} />
}
