import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client Supabase pour les Server Components et Server Actions.
// Async car cookies() est une API asynchrone en Next.js 16.
export const createClient = async () => {
  const cookieStore = await cookies();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_PUBLISHABLE_DEFAULT_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_PUBLISHABLE_DEFAULT_KEY is not set");
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_PUBLISHABLE_DEFAULT_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll échoue silencieusement dans les Server Components (lecture seule).
            // Ce n'est pas un problème : le proxy gère le refresh du token en amont.
          }
        },
      },
    }
  );
};
