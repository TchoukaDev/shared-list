"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const OTP_LENGTH = 6

export default function LoginPage() {
  // Deux étapes : saisie de l'email, puis saisie du code OTP reçu par email
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  // Un ref par case pour gérer le focus entre les cases
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  // Client Supabase browser — singleton partagé
  const supabase = createClient()

  // Reçoit le token en paramètre pour éviter la closure sur un état `otp` potentiellement périmé
  const verifyOtp = useCallback(async (token: string) => {
    setError(null)
    setLoading(true)
    // Vérifie le code OTP — si valide, Supabase crée la session et pose les cookies
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" })
    setLoading(false)
    if (error) {
      setError("Code invalide ou expiré.")
      // Vide les cases et replace le focus sur la première pour recommencer
      setOtp("")
      inputRefs.current[0]?.focus()
    } else {
      // Redirige vers l'app — le proxy prendra le relais pour protéger les routes
      router.push("/")
    }
  }, [email, supabase, router])

  // Étape 1 : envoie le code OTP à l'email saisi
  async function handleSubmitEmail(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    // shouldCreateUser: false = refuse les emails non enregistrés manuellement
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setStep("otp")
    }
  }

  // Saisie d'un chiffre dans une case : met à jour l'OTP, avance au suivant, et soumet si complet
  function handleOtpChange(index: number, value: string) {
    // value peut contenir plusieurs caractères si l'autofill mobile remplit tout d'un coup.
    // .replace(/\D/g, "") → supprime tout ce qui n'est pas un chiffre (\D = non-digit, /g = partout)
    //   ex: "a5b" → "5"
    // .slice(-1) → garde seulement le dernier caractère si plusieurs chiffres sont présents
    //   ex: "56" → "6" (on veut le nouveau chiffre, pas celui qui était déjà là)
    const digit = value.replace(/\D/g, "").slice(-1)

    // Les strings JS sont immutables, on ne peut pas faire otp[index] = digit directement.
    // .split("") découpe la string en tableau de caractères modifiable.
    //   ex: "123" → ["1","2","3"]
    const chars = otp.split("")

    // Remplace le caractère à la position index.
    //   ex: chars=["1","2","","","","","",""], index=2, digit="3" → ["1","2","3","","","","",""]
    chars[index] = digit

    // .join("") reforme la string depuis le tableau : ["1","2","3"] → "123"
    // .slice(0, OTP_LENGTH) sécurité : on tronque à 8 max
    const next = chars.join("").slice(0, OTP_LENGTH)
    setOtp(next)

    // Avance le focus à la case suivante si un chiffre vient d'être saisi
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // On passe `next` directement car `otp` en state n'est pas encore mis à jour ici
    if (next.length === OTP_LENGTH) {
      verifyOtp(next)
    }
  }

  // Backspace : efface la case courante, ou recule si elle est déjà vide
  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    // On intercepte Backspace avant que le navigateur l'applique, parce qu'une case vide
    // ne déclenche pas onChange — il faut gérer le retour en arrière manuellement.
    if (e.key === "Backspace") {
      if (otp[index]) {
        // otp[index] est truthy → la case contient un chiffre, on l'efface.
        // Même pattern que handleOtpChange : split → modifier → join (string immutable).
        const chars = otp.split("")
        chars[index] = ""
        setOtp(chars.join(""))
      } else if (index > 0) {
        // Case déjà vide → comportement UX naturel : recule au précédent.
        // ?. = optional chaining : n'appelle focus() que si le ref existe (évite un crash)
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  // Coller un code : ignore le paste natif, distribue les chiffres dans les cases
  function handleOtpPaste(e: React.ClipboardEvent) {
    // Sans preventDefault(), le texte collé s'écrirait dans une seule case
    e.preventDefault()

    const pasted = e.clipboardData.getData("text") // texte brut du presse-papiers
      .replace(/\D/g, "")                          // supprime tout ce qui n'est pas un chiffre
      .slice(0, OTP_LENGTH)                        // tronque à 8 max

    setOtp(pasted)

    // Focus sur la case après la dernière remplie (ou la dernière si tout est rempli)
    // Math.min évite de dépasser l'index 7 si pasted fait exactement 8 caractères
    //   ex: pasted="12345678" (8) → Math.min(8, 7) = 7 → focus case 7 (dernière)
    //   ex: pasted="123"     (3) → Math.min(3, 7) = 3 → focus case 3 (suivante vide)
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()

    if (pasted.length === OTP_LENGTH) {
      verifyOtp(pasted)
    }
  }

  return (
    <main className="min-h-dvh bg-sand-50 flex items-center justify-center px-4">
      {/* max-w-sm + p-6 : carte centrée, padding réduit sur petits écrans */}
      <div className="card w-full max-w-sm p-6 animate-slide-up">

        {/* Logo / titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-terra-100 mb-4">
            <span className="text-2xl">🛒</span>
          </div>
          <h1 className="text-xl font-semibold text-stone-900">Shared List</h1>
          {/* Le sous-titre change selon l'étape */}
          <p className="text-sm text-stone-600 mt-1">
            {step === "email"
              ? "Connecte-toi pour accéder à tes listes"
              : <>Code envoyé à <span className="font-medium text-stone-900">{email}</span></>
            }
          </p>
        </div>

        {/* Message d'erreur affiché si l'appel Supabase échoue */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3.5 py-2.5 mb-4">
            {error}
          </p>
        )}

        {step === "email" ? (
          <form className="space-y-4" onSubmit={handleSubmitEmail}>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-stone-700">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@example.com"
                required
                autoFocus         // focus automatique à l'ouverture — évite un tap inutile sur mobile
                autoCapitalize="none"  // désactive la majuscule automatique sur iOS
                autoCorrect="off"      // désactive la correction automatique sur mobile
                className="w-full px-3.5 py-2.5 rounded-md border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-terra-500/30 focus:border-terra-500 transition-colors"
              />
            </div>
            {/* disabled pendant le chargement pour éviter le double envoi */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-terra-500 hover:bg-terra-600 disabled:opacity-60 text-white font-medium text-sm py-3 rounded-md transition-colors"
            >
              {loading ? "Envoi…" : "Recevoir un code"}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Cases OTP — gap-1.5 pour tenir sur un écran 375px avec 8 cases */}
            <div className="flex gap-1.5 justify-center" onPaste={handleOtpPaste}>
              {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"   // clavier numérique sur mobile sans spinner
                  maxLength={1}
                  value={otp[i] ?? ""}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  disabled={loading}
                  // autoComplete="one-time-code" sur la première case : active l'autofill SMS sur iOS/Android
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  className="w-9 h-11 text-center text-base font-mono font-medium border border-stone-200 rounded-md bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-terra-500/30 focus:border-terra-500 disabled:opacity-50 transition-colors"
                />
              ))}
            </div>

            {/* Indicateur de chargement pendant la vérification automatique */}
            {loading && (
              <p className="text-center text-sm text-stone-400">Vérification…</p>
            )}

            {/* py-3 : touch target suffisant (44px minimum recommandé sur mobile) */}
            <button
              type="button"
              onClick={() => { setStep("email"); setOtp(""); setError(null) }}
              className="w-full py-3 text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              Changer d&apos;email
            </button>
          </div>
        )}

      </div>
    </main>
  )
}
