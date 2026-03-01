"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (cancelled) return
        if (session) router.push("/dashboard")
        else setReady(true)
      } catch {
        if (!cancelled) setReady(true)
      }
    }
    check()
    // Timeout de sécurité : 2s max, puis on affiche la page quoi qu'il arrive
    const timeout = setTimeout(() => {
      if (!cancelled) setReady(true)
    }, 2000)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [router])

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs")
      return
    }
    setConnecting(true)
    setError("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError("Email ou mot de passe incorrect")
      setConnecting(false)
      return
    }
    router.push("/dashboard")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin()
  }

  if (!ready) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <img src="/logo.png" alt="Butt Premium" className="h-28 w-auto mb-6 drop-shadow-lg" />

      {/* Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <p className="text-white font-bold text-lg mb-1">Connexion</p>
        <p className="text-zinc-500 text-xs mb-6">Entrez vos identifiants pour accéder à votre espace</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5 mb-4">
            <p className="text-red-400 text-xs font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Email */}
        <div className="mb-3">
          <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="votre@email.com"
            autoComplete="email"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 focus:bg-zinc-800 transition-colors"
          />
        </div>

        {/* Mot de passe */}
        <div className="mb-6">
          <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Mot de passe</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 pr-12 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors text-lg">
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        {/* Bouton */}
        <button
          onClick={handleLogin}
          disabled={connecting}
          className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          {connecting
            ? <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Connexion...</>
            : "Se connecter →"
          }
        </button>
      </div>

      <p className="text-zinc-700 text-xs mt-8">© 2025 Butt Premium</p>
    </div>
  )
}