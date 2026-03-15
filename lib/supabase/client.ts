import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is not set");
}

// Singleton : un seul client partagé pour toute la durée de vie de la page.
// Évite de recréer la connexion à chaque appel.
let client: ReturnType<typeof createBrowserClient> | null = null;

// Client Supabase pour les composants client ("use client").
// Utilise les cookies du navigateur pour gérer la session.
export const createClient = () => {
    if (!client) {
        client = createBrowserClient(supabaseUrl, supabaseKey);
    }
    return client;
};
