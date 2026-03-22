import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Crée un client Supabase adapté au contexte Edge (proxy).
// Contrairement au client serveur, on lit/écrit les cookies manuellement
// depuis l'objet request/response — l'API cookies() de Next.js n'est pas dispo ici.
export const createClient = (request: NextRequest) => {
    // Réponse par défaut : laisse passer la requête sans modification
    let supabaseResponse = NextResponse.next({
        request: { headers: request.headers },
    });

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is not set");
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                // Lit tous les cookies de la requête entrante
                getAll() {
                    return request.cookies.getAll()
                },
                // Écrit les cookies sur la requête ET sur la réponse.
                // Les deux sont nécessaires : la requête pour les Server Components
                // qui lisent immédiatement, la réponse pour que le navigateur persiste le token.
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        },
    );

    // Retourne les deux : supabase pour appeler getUser(), supabaseResponse pour la retourner à Next.js
    return { supabaseResponse, supabase };
};

export async function proxy(request: NextRequest) {
    const { supabase, supabaseResponse } = createClient(request)

    // Vérifie la session côté serveur (plus sécurisé que de lire le cookie directement)
    // Cet appel rafraîchit aussi le token si besoin
    const { data: { user } } = await supabase.auth.getUser()

    const isLoginPage = request.nextUrl.pathname.startsWith('/login')

    // Non connecté hors de /login → redirige vers /login
    if (!user && !isLoginPage) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Déjà connecté sur /login → redirige vers l'app (évite d'afficher la page de login inutilement)
    if (user && isLoginPage) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    // Retourne la réponse avec les cookies potentiellement mis à jour
    return supabaseResponse
}

// Exclut les assets statiques et les fichiers PWA publics de l'auth
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|offline|icons).*)'],
}
