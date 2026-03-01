"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Vérifie la session avec un timeout de sécurité
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.push("/dashboard")
        } else {
          setReady(true)
        }
      } catch {
        setReady(true)
      }
    }
    check()
    // Timeout de sécurité : affiche la page après 3s max
    const timeout = setTimeout(() => setReady(true), 3000)
    return () => clearTimeout(timeout)
  }, [router])

  const handleLogin = async () => {
    setConnecting(true)
    setError("")
    const { error } = await supabase.auth.signInWithPassword({
      email: "yohan@buttpremium.local",
      password: "2209Yohan",
    })
    if (error) {
      setError(error.message)
      setConnecting(false)
      return
    }
    router.push("/dashboard")
  }

  if (!ready) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
      <p className="text-yellow-500 font-bold text-3xl mb-2">⚡ Butt Premium</p>
      <p className="text-zinc-500 text-sm mb-10">Logiciel de gestion</p>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-80 text-center">
        <p className="text-white font-semibold mb-6">Connexion</p>
        {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={connecting}
          className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors"
        >
          {connecting ? "Connexion..." : "Se connecter"}
        </button>
      </div>
    </div>
  )
}