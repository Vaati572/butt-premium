"use client"

// ── SETUP REQUIS ───────────────────────────────────────────────────────────
// Vercel → Settings → Environment Variables :
//   NEXT_PUBLIC_ANTHROPIC_KEY  →  ta clé API Anthropic (sk-ant-...)
//
// page.tsx — ajouter dans sidebar :
//   { id: "ia", label: "🤖 IA", icon: Sparkles }
// page.tsx — ajouter dans renderContent() :
//   case "ia": return <IAModule activeSociety={activeSociety} profile={profile} />
// ──────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
  Send, Sparkles, Search, MapPin, Plus, Check, X,
  RefreshCw, AlertTriangle, Clock, Phone, Mail,
  Building2, MessageSquare, Target, ChevronDown,
  Trash2, Copy, RotateCcw, Calendar, Info,
} from "lucide-react"

interface Props { activeSociety: any; profile: any }

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  ts: number
}

interface ProspectResult {
  nom: string
  entreprise: string
  adresse: string
  cp: string
  ville: string
  tel: string
  email: string
  horaires_ouverture: string
  notes: string
  // runtime
  _id: string
  _doublon: boolean
  _doublon_raison: string
  _selected: boolean
  _importing: boolean
  _imported: boolean
}

interface ExistingProspect {
  nom: string
  entreprise: string
  tel: string
  email: string
  adresse: string
}

const TYPES_RECHERCHE = [
  { id: "tatoueur",    label: "🖋️ Tatoueur",         query: "salon de tatouage" },
  { id: "esthetique",  label: "💅 Esthétique",         query: "salon esthétique institut de beauté" },
  { id: "pharmacie",   label: "💊 Pharmacie",          query: "pharmacie" },
  { id: "coiffure",    label: "✂️ Coiffure",            query: "salon de coiffure" },
  { id: "spa",         label: "🧖 Spa / Bien-être",    query: "spa bien-être massage" },
]

const AUTO_KEY = "ia_prospection_auto"
const CHAT_KEY = "ia_chat_history"

// ═════════════════════════════════════════════
//  HELPER — appel API Claude
// ═════════════════════════════════════════════
async function callClaude(messages: { role: string; content: string }[], systemPrompt: string, useWebSearch = false) {
  const body: any = {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3000,
    system: systemPrompt,
    messages,
  }
  if (useWebSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search" }]
  }

  const res = await fetch("/api/ia", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || err?.error || `Erreur API ${res.status}`)
  }

  const data = await res.json()
  const textBlocks = (data.content || []).filter((b: any) => b.type === "text")
  return textBlocks.map((b: any) => b.text).join("")
}

// ═════════════════════════════════════════════
//  HELPER — détection doublons (fuzzy)
// ═════════════════════════════════════════════
function similarity(a: string, b: string): number {
  if (!a || !b) return 0
  a = a.toLowerCase().trim()
  b = b.toLowerCase().trim()
  if (a === b) return 1
  if (a.includes(b) || b.includes(a)) return 0.85
  // Simple Jaccard sur mots
  const wa = new Set(a.split(/\s+/))
  const wb = new Set(b.split(/\s+/))
  const inter = [...wa].filter(w => wb.has(w)).length
  const union = new Set([...wa, ...wb]).size
  return inter / union
}

function normalizePhone(tel: string) {
  return (tel || "").replace(/[\s\-\.\(\)]/g, "").replace(/^(\+33|0033)/, "0")
}

function checkDoublon(result: ProspectResult, existing: ExistingProspect[]): { doublon: boolean; raison: string } {
  for (const e of existing) {
    // Nom / entreprise similaire (>75%)
    if (similarity(result.nom, e.nom) > 0.75 || similarity(result.nom, e.entreprise) > 0.75) {
      return { doublon: true, raison: `Nom similaire : "${e.nom || e.entreprise}"` }
    }
    // Téléphone identique
    const t1 = normalizePhone(result.tel)
    const t2 = normalizePhone(e.tel)
    if (t1 && t2 && t1 === t2) {
      return { doublon: true, raison: `Même téléphone : ${e.tel}` }
    }
    // Email identique
    const m1 = (result.email || "").toLowerCase().trim()
    const m2 = (e.email || "").toLowerCase().trim()
    if (m1 && m2 && m1 === m2) {
      return { doublon: true, raison: `Même email : ${e.email}` }
    }
    // Adresse similaire (>80%)
    if (similarity(result.adresse, e.adresse) > 0.8) {
      return { doublon: true, raison: `Même adresse : "${e.adresse}"` }
    }
  }
  return { doublon: false, raison: "" }
}

// ═════════════════════════════════════════════
//  SOUS-COMPOSANT — Chat IA
// ═════════════════════════════════════════════
function ChatIA({ activeSociety, profile }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [businessData, setBusinessData] = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Charger historique
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${CHAT_KEY}_${activeSociety?.id}`)
      if (stored) setMessages(JSON.parse(stored))
    } catch {}
  }, [activeSociety?.id])

  // Sauvegarder historique
  useEffect(() => {
    if (messages.length === 0) return
    try {
      // Garder les 50 derniers messages
      const toStore = messages.slice(-50)
      localStorage.setItem(`${CHAT_KEY}_${activeSociety?.id}`, JSON.stringify(toStore))
    } catch {}
  }, [messages])

  // Scroll auto
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  // Charger données business pour le contexte
  const loadBusinessData = useCallback(async () => {
    if (!activeSociety?.id || businessData) return
    try {
      const today = new Date()
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
      const [{ data: ventes }, { data: prospects }, { data: clients }, { data: stock }] = await Promise.all([
        supabase.from("ventes").select("total_ttc, paiement, client_nom, created_at").eq("society_id", activeSociety.id).gte("created_at", firstOfMonth),
        supabase.from("prospects").select("statut, ville, source").eq("society_id", activeSociety.id),
        supabase.from("clients").select("id").eq("society_id", activeSociety.id),
        supabase.from("stock").select("produit_nom, quantite, seuil_alerte").eq("society_id", activeSociety.id),
      ])
      const caMonth = (ventes || []).reduce((s: number, v: any) => s + Number(v.total_ttc), 0)
      const ruptures = (stock || []).filter((s: any) => s.quantite <= 0).map((s: any) => s.produit_nom)
      const alertes = (stock || []).filter((s: any) => s.seuil_alerte > 0 && s.quantite <= s.seuil_alerte && s.quantite > 0).map((s: any) => s.produit_nom)
      setBusinessData({
        ca_mois: caMonth.toFixed(2),
        nb_ventes_mois: (ventes || []).length,
        nb_prospects: (prospects || []).length,
        prospects_a_faire: (prospects || []).filter((p: any) => p.statut === "a_faire").length,
        nb_clients: (clients || []).length,
        ruptures_stock: ruptures,
        alertes_stock: alertes,
        societe: activeSociety.name,
      })
    } catch {}
  }, [activeSociety?.id])

  useEffect(() => { loadBusinessData() }, [loadBusinessData])

  const buildSystemPrompt = () => {
    const bd = businessData
    return `Tu es l'assistant IA intégré dans le CRM "Butt Premium" de ${bd?.societe || "l'utilisateur"}.
Tu aides sur 4 domaines :
1. Questions business (données en temps réel ci-dessous)
2. Conseils commerciaux et prospection (secteurs tatouage, esthétique, pharmacie)
3. Questions générales (comme ChatGPT)
4. Rédaction d'emails, messages clients, devis

${bd ? `DONNÉES BUSINESS EN TEMPS RÉEL (ce mois-ci) :
- CA du mois : ${bd.ca_mois}€ (${bd.nb_ventes_mois} ventes)
- Prospects actifs : ${bd.nb_prospects} (dont ${bd.prospects_a_faire} à contacter)
- Clients : ${bd.nb_clients}
- Ruptures de stock : ${bd.ruptures_stock.length > 0 ? bd.ruptures_stock.join(", ") : "aucune"}
- Alertes stock : ${bd.alertes_stock.length > 0 ? bd.alertes_stock.join(", ") : "aucune"}` : ""}

Réponds en français, de façon concise et utile. Pour les emails ou messages, fournis directement le texte prêt à envoyer. Pour les conseils, sois précis et actionnable.`
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim(), ts: Date.now() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      // Construire l'historique pour Claude (max 20 derniers échanges)
      const history = newMessages.slice(-20).map(m => ({ role: m.role, content: m.content }))
      const text = await callClaude(history, buildSystemPrompt())
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: text, ts: Date.now() }
      setMessages(prev => [...prev, assistantMsg])
    } catch (e: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(), role: "assistant",
        content: `❌ Erreur : ${e.message}`, ts: Date.now()
      }
      setMessages(prev => [...prev, errMsg])
    }
    setLoading(false)
  }

  const clearHistory = () => {
    if (!confirm("Effacer tout l'historique du chat ?")) return
    setMessages([])
    localStorage.removeItem(`${CHAT_KEY}_${activeSociety?.id}`)
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content).catch(() => {})
  }

  const SUGGESTIONS = [
    "Quel est mon CA de ce mois ?",
    "Rédige un email de prospection pour un salon de tatouage",
    "Combien de prospects j'ai à contacter ?",
    "Donne-moi des conseils pour améliorer mon taux de conversion",
    "Rédige un message de relance client professionnel",
    "Quels sont mes produits en rupture de stock ?",
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-zinc-400 text-xs">Claude IA connecté</span>
          {businessData && <span className="text-zinc-600 text-xs">· données business chargées</span>}
        </div>
        <button onClick={clearHistory} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
          <Trash2 size={11} /> Effacer
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles size={24} className="text-yellow-500" />
              </div>
              <p className="text-white font-bold text-lg">Bonjour ! Comment puis-je t'aider ?</p>
              <p className="text-zinc-500 text-sm mt-1">Questions business, prospection, rédaction d'emails...</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50) }}
                  className="text-left text-sm text-zinc-400 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:text-white rounded-xl px-4 py-3 transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={14} className="text-yellow-500" />
              </div>
            )}
            <div className={`group max-w-[80%] ${msg.role === "user" ? "bg-yellow-500/15 border border-yellow-500/20 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-200"} rounded-2xl px-4 py-3 text-sm leading-relaxed relative`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-zinc-600 text-[10px]">{new Date(msg.ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                <button onClick={() => copyMessage(msg.content)} className="text-zinc-600 hover:text-zinc-400">
                  <Copy size={10} />
                </button>
              </div>
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold text-zinc-400">
                {profile?.email?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-yellow-500 animate-pulse" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <span className="text-zinc-500 text-xs">Claude réfléchit...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800 shrink-0">
        <div className="flex gap-3 items-end bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 focus-within:border-zinc-600 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Pose ta question... (Entrée pour envoyer, Shift+Entrée pour saut de ligne)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none resize-none max-h-32 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-xl bg-yellow-500 hover:bg-yellow-400 disabled:opacity-30 flex items-center justify-center text-black transition-all shrink-0">
            <Send size={14} />
          </button>
        </div>
        <p className="text-zinc-700 text-[10px] text-center mt-2">Claude peut faire des erreurs. Vérifie les informations importantes.</p>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════
//  SOUS-COMPOSANT — Prospection IA
// ═════════════════════════════════════════════
function ProspectionIA({ activeSociety, profile }: Props) {
  const [ville, setVille] = useState("")
  const [typeRecherche, setTypeRecherche] = useState(TYPES_RECHERCHE[0])
  const [maxProspects] = useState(20)
  const [results, setResults] = useState<ProspectResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [existingProspects, setExistingProspects] = useState<ExistingProspect[]>([])
  const [importedCount, setImportedCount] = useState(0)
  const [showAutoConfig, setShowAutoConfig] = useState(false)
  const [autoVille, setAutoVille] = useState("")
  const [autoType, setAutoType] = useState(TYPES_RECHERCHE[0])
  const [autoConfig, setAutoConfig] = useState<{ ville: string; type: string; lastRun: string } | null>(null)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)

  // Charger prospects existants pour détection doublons
  useEffect(() => {
    if (!activeSociety?.id) return
    supabase.from("prospects").select("nom, entreprise, tel, email, adresse").eq("society_id", activeSociety.id)
      .then(({ data }) => setExistingProspects(data || []))
  }, [activeSociety?.id])

  // Charger config auto
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${AUTO_KEY}_${activeSociety?.id}`)
      if (stored) {
        const cfg = JSON.parse(stored)
        setAutoConfig(cfg)
        setAutoVille(cfg.ville || "")
        setAutoType(TYPES_RECHERCHE.find(t => t.id === cfg.type) || TYPES_RECHERCHE[0])

        // Vérifier si auto-run nécessaire (7 jours)
        const last = new Date(cfg.lastRun)
        const next = new Date(last)
        next.setDate(next.getDate() + 7)
        if (new Date() >= next && cfg.ville) {
          setVille(cfg.ville)
          setTypeRecherche(TYPES_RECHERCHE.find(t => t.id === cfg.type) || TYPES_RECHERCHE[0])
          setTimeout(() => lancerRecherche(cfg.ville, cfg.type), 800)
        }
      }
    } catch {}
  }, [activeSociety?.id])

  const lancerRecherche = async (villeOverride?: string, typeOverride?: string) => {
    const targetVille = villeOverride || ville
    const targetType = TYPES_RECHERCHE.find(t => t.id === typeOverride) || typeRecherche
    if (!targetVille.trim()) { setError("Indique une ville"); return }

    setLoading(true)
    setError("")
    setResults([])

    const prompt = `Recherche sur internet les ${maxProspects} meilleurs ${targetType.query} situés à ${targetVille} en France.

Pour chaque établissement, fournis TOUTES ces informations :
- nom : nom exact de l'établissement
- adresse : numéro + rue complète
- cp : code postal (5 chiffres)
- ville : ville
- tel : numéro de téléphone français (ex: 06 12 34 56 78 ou 03 87 00 00 00)
- email : adresse email si disponible sur leur site ou Google (sinon "")
- horaires_ouverture : horaires complets sur plusieurs jours (ex: "Lun-Ven : 9h-19h\\nSam : 9h-17h\\nDim : fermé")
- notes : 1-2 phrases sur l'établissement (spécialité, style, ancienneté, réputation si connue)

IMPORTANT :
- Trouve VRAIMENT les établissements qui existent (pas inventés)
- Cherche leurs vrais numéros de téléphone et emails
- Maximum ${maxProspects} résultats
- Retourne UNIQUEMENT un JSON valide sans texte avant/après, sans backticks markdown :

{"prospects":[{"nom":"","adresse":"","cp":"","ville":"","tel":"","email":"","horaires_ouverture":"","notes":""}]}`

    try {
      const rawText = await callClaude([{ role: "user", content: prompt }], "Tu es un assistant de prospection commerciale. Tu recherches des établissements réels sur internet et retournes uniquement du JSON valide.", true)

      // Parser JSON robuste
      let parsed: { prospects: any[] } = { prospects: [] }
      try {
        const match = rawText.match(/\{[\s\S]*"prospects"[\s\S]*\}/)
        parsed = JSON.parse(match ? match[0] : rawText.trim())
      } catch {
        throw new Error("Réponse invalide de Claude. Réessaie.")
      }

      // Recharger prospects existants pour détection fraîche
      const { data: freshExisting } = await supabase.from("prospects")
        .select("nom, entreprise, tel, email, adresse").eq("society_id", activeSociety.id)
      const existants: ExistingProspect[] = freshExisting || []
      setExistingProspects(existants)

      const mapped: ProspectResult[] = (parsed.prospects || []).slice(0, maxProspects).map((p: any, i: number) => {
        const { doublon, raison } = checkDoublon(p, existants)
        return {
          ...p,
          _id: `r_${Date.now()}_${i}`,
          _doublon: doublon,
          _doublon_raison: raison,
          _selected: !doublon, // Doublons non sélectionnés par défaut
          _importing: false,
          _imported: false,
        }
      })

      if (mapped.length === 0) throw new Error("Aucun résultat trouvé. Essaie une autre ville ou un autre type.")
      setResults(mapped)

      // Sauvegarder dernier run
      const now = new Date().toISOString()
      const cfg = { ville: targetVille, type: targetType.id, lastRun: now }
      localStorage.setItem(`${AUTO_KEY}_${activeSociety.id}`, JSON.stringify(cfg))
      setAutoConfig(cfg)

    } catch (e: any) {
      setError(e.message || "Erreur lors de la recherche")
    }
    setLoading(false)
  }

  const importerProspect = async (r: ProspectResult) => {
    setResults(prev => prev.map(p => p._id === r._id ? { ...p, _importing: true } : p))
    const { error: err } = await supabase.from("prospects").insert({
      society_id: activeSociety.id,
      assigned_to: profile.id,
      nom: r.nom,
      entreprise: r.nom,
      poste: "Gérant(e)",
      tel: r.tel || "",
      email: r.email || "",
      adresse: r.adresse || "",
      cp: r.cp || "",
      ville: r.ville || "",
      statut: "a_faire",
      priorite: "normale",
      source: typeRecherche.id === "tatoueur" ? "Tatouage" : typeRecherche.id === "pharmacie" ? "Pharmacie" : typeRecherche.id === "esthetique" ? "Esthétique" : "Autre",
      notes: r.notes || "",
      horaires_ouverture: r.horaires_ouverture || "",
      prochaine_action: "Premier contact",
      prochaine_action_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      tags: ["IA", typeRecherche.label.replace(/^[^\s]+\s/, ""), r.ville].filter(Boolean),
      latitude: null, longitude: null,
    })
    if (err) {
      setResults(prev => prev.map(p => p._id === r._id ? { ...p, _importing: false } : p))
      alert("Erreur : " + err.message)
    } else {
      setResults(prev => prev.map(p => p._id === r._id ? { ...p, _importing: false, _imported: true } : p))
      setImportedCount(c => c + 1)
      // Mettre à jour la liste des existants pour détecter les futurs doublons dans ce même run
      setExistingProspects(prev => [...prev, { nom: r.nom, entreprise: r.nom, tel: r.tel, email: r.email, adresse: r.adresse }])
    }
  }

  const importerSelection = async () => {
    const toImport = results.filter(r => r._selected && !r._imported && !r._doublon)
    for (const r of toImport) await importerProspect(r)
  }

  const sauvegarderAutoConfig = () => {
    if (!autoVille.trim()) return
    const cfg = { ville: autoVille, type: autoType.id, lastRun: new Date(0).toISOString() }
    localStorage.setItem(`${AUTO_KEY}_${activeSociety.id}`, JSON.stringify(cfg))
    setAutoConfig(cfg)
    setShowAutoConfig(false)
    alert(`✅ Recherche auto configurée : ${autoType.label} à ${autoVille} — se relancera chaque semaine`)
  }

  const selectedCount = results.filter(r => r._selected && !r._imported && !r._doublon).length
  const doublonCount = results.filter(r => r._doublon).length
  const nouveauxCount = results.filter(r => !r._doublon).length

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">

      {/* ── CONFIG RECHERCHE ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-sm flex items-center gap-2"><Target size={15} className="text-yellow-500" />Nouvelle recherche</h2>
          {importedCount > 0 && (
            <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/20 px-3 py-1 rounded-xl font-bold">{importedCount} importé{importedCount > 1 ? "s" : ""}</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Ville */}
          <div className="md:col-span-1">
            <label className="block text-zinc-500 text-[10px] uppercase tracking-wider mb-1.5">Ville</label>
            <div className="relative">
              <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input value={ville} onChange={e => setVille(e.target.value)}
                onKeyDown={e => e.key === "Enter" && lancerRecherche()}
                placeholder="Metz, Nancy, Strasbourg..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/60" />
            </div>
          </div>

          {/* Type */}
          <div className="relative md:col-span-1">
            <label className="block text-zinc-500 text-[10px] uppercase tracking-wider mb-1.5">Type d'établissement</label>
            <button onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="w-full flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white hover:border-zinc-600 transition-colors">
              <span>{typeRecherche.label}</span>
              <ChevronDown size={13} className="text-zinc-500" />
            </button>
            {showTypeDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl z-20 overflow-hidden">
                {TYPES_RECHERCHE.map(t => (
                  <button key={t.id} onClick={() => { setTypeRecherche(t); setShowTypeDropdown(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${typeRecherche.id === t.id ? "bg-yellow-500/10 text-yellow-400" : "text-zinc-300 hover:bg-zinc-700"}`}>
                    {t.label}
                    {typeRecherche.id === t.id && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Max */}
          <div className="md:col-span-1">
            <label className="block text-zinc-500 text-[10px] uppercase tracking-wider mb-1.5">Max résultats</label>
            <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5">
              <span className="text-yellow-500 font-bold text-sm">{maxProspects}</span>
              <span className="text-zinc-500 text-xs">prospects maximum</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => lancerRecherche()} disabled={loading || !ville.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-black font-bold text-sm disabled:opacity-40 transition-all"
            style={{ backgroundColor: "#eab308" }}>
            {loading
              ? <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Recherche en cours...</>
              : <><Sparkles size={15} /> Lancer la recherche</>}
          </button>
          <button onClick={() => setShowAutoConfig(!showAutoConfig)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border font-semibold text-sm transition-all"
            style={autoConfig ? { borderColor: "#a855f750", color: "#a855f7", backgroundColor: "#a855f710" } : { borderColor: "#3f3f46", color: "#71717a", backgroundColor: "transparent" }}>
            <Calendar size={14} />
            {autoConfig ? "Auto ✓" : "Auto"}
          </button>
        </div>

        {/* Config auto */}
        {showAutoConfig && (
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 space-y-3">
            <p className="text-zinc-300 text-sm font-semibold flex items-center gap-2"><Calendar size={13} className="text-purple-400" />Recherche automatique hebdomadaire</p>
            <p className="text-zinc-500 text-xs">S'active automatiquement à chaque ouverture de cet onglet, 7 jours après la dernière recherche.</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Ville</label>
                <input value={autoVille} onChange={e => setAutoVille(e.target.value)} placeholder="Ville auto..."
                  className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Type</label>
                <select value={autoType.id} onChange={e => setAutoType(TYPES_RECHERCHE.find(t => t.id === e.target.value) || TYPES_RECHERCHE[0])}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                  {TYPES_RECHERCHE.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>
            {autoConfig && (
              <p className="text-zinc-500 text-xs">Dernier run : {new Date(autoConfig.lastRun).getFullYear() < 2000 ? "Jamais" : new Date(autoConfig.lastRun).toLocaleDateString("fr-FR")}</p>
            )}
            <button onClick={sauvegarderAutoConfig} disabled={!autoVille.trim()}
              className="w-full py-2 rounded-lg text-white font-semibold text-sm disabled:opacity-40 transition-colors"
              style={{ backgroundColor: "#a855f730", border: "1px solid #a855f750", color: "#c084fc" }}>
              Enregistrer la config auto
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* ── LOADER ── */}
      {loading && (
        <div className="text-center py-12 space-y-4">
          <div className="flex justify-center">
            <div className="relative w-14 h-14">
              <div className="w-14 h-14 border-2 border-yellow-500/20 rounded-full" />
              <div className="absolute inset-0 w-14 h-14 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={16} className="text-yellow-500" />
              </div>
            </div>
          </div>
          <div>
            <p className="text-white font-semibold">Claude recherche les {typeRecherche.label} à <span className="text-yellow-500">{ville}</span></p>
            <p className="text-zinc-500 text-sm mt-1">Recherche web en cours · 15-30 secondes</p>
          </div>
          <div className="flex justify-center gap-1">
            {["Recherche web", "Extraction des infos", "Détection doublons"].map((step, i) => (
              <span key={step} className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-1 rounded-lg">{step}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── RÉSULTATS ── */}
      {results.length > 0 && !loading && (
        <div className="space-y-4">

          {/* Barre résumé */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-white font-bold">{results.length} résultat{results.length > 1 ? "s" : ""} · <span className="text-zinc-400 font-normal text-sm">{typeRecherche.label} à {ville}</span></p>
              {nouveauxCount > 0 && <span className="text-[11px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-md font-semibold">{nouveauxCount} nouveaux</span>}
              {doublonCount > 0 && <span className="text-[11px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-md font-semibold">{doublonCount} doublon{doublonCount > 1 ? "s" : ""}</span>}
              {results.filter(r => r._imported).length > 0 && <span className="text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md font-semibold">{results.filter(r => r._imported).length} importé{results.filter(r => r._imported).length > 1 ? "s" : ""}</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setResults(prev => prev.map(r => ({ ...r, _selected: !r._doublon && !r._imported })))}
                className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 transition-colors">
                Tout sélectionner
              </button>
              {selectedCount > 0 && (
                <button onClick={importerSelection}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-black font-bold text-sm transition-colors"
                  style={{ backgroundColor: "#22c55e" }}>
                  <Plus size={13} /> Importer {selectedCount}
                </button>
              )}
            </div>
          </div>

          {/* Légende */}
          <div className="flex gap-3 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" />Sélectionné</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" />Doublon existant</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Importé</span>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {results.map(r => (
              <div key={r._id}
                onClick={() => !r._doublon && !r._imported && setResults(prev => prev.map(p => p._id === r._id ? { ...p, _selected: !p._selected } : p))}
                className={`relative bg-zinc-900 border rounded-2xl p-4 transition-all
                  ${r._imported ? "border-blue-500/30 bg-blue-500/5 cursor-default"
                  : r._doublon ? "border-orange-500/30 bg-orange-500/5 cursor-default opacity-75"
                  : r._selected ? "border-yellow-500/60 bg-yellow-500/5 cursor-pointer"
                  : "border-zinc-800 hover:border-zinc-600 cursor-pointer"}`}>

                {/* Checkbox / status */}
                <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0
                  ${r._imported ? "bg-blue-500 border-blue-500"
                  : r._doublon ? "bg-orange-500/30 border-orange-500/50"
                  : r._selected ? "bg-yellow-500 border-yellow-500"
                  : "border-zinc-600 bg-zinc-800"}`}>
                  {r._imported && <Check size={11} className="text-white" />}
                  {r._doublon && !r._imported && <X size={11} className="text-orange-400" />}
                  {!r._doublon && !r._imported && r._selected && <Check size={11} className="text-black" />}
                </div>

                {/* Badges */}
                <div className="flex gap-1.5 mb-2 pr-8 flex-wrap">
                  {r._imported && <span className="text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md font-semibold">✓ Importé</span>}
                  {r._doublon && <span className="text-[10px] bg-orange-500/15 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-md font-semibold">⚠ Doublon</span>}
                </div>

                {/* Nom */}
                <div className="flex items-start gap-2 mb-3 pr-8">
                  <Building2 size={13} className="text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-white font-bold text-sm leading-tight">{r.nom}</p>
                </div>

                {/* Doublon raison */}
                {r._doublon && r._doublon_raison && (
                  <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2.5 py-1.5 mb-2">
                    <Info size={10} className="text-orange-400 shrink-0" />
                    <p className="text-orange-400 text-[10px]">{r._doublon_raison}</p>
                  </div>
                )}

                {/* Infos */}
                <div className="space-y-1.5 mb-3">
                  {r.adresse && (
                    <p className="text-zinc-400 text-xs flex items-start gap-1.5">
                      <MapPin size={10} className="text-zinc-500 shrink-0 mt-0.5" />
                      {r.adresse}{r.cp ? `, ${r.cp}` : ""} {r.ville}
                    </p>
                  )}
                  {r.tel && (
                    <p className="text-zinc-400 text-xs flex items-center gap-1.5">
                      <Phone size={10} className="text-zinc-500" />{r.tel}
                    </p>
                  )}
                  {r.email && (
                    <p className="text-zinc-400 text-xs flex items-center gap-1.5 truncate">
                      <Mail size={10} className="text-zinc-500 shrink-0" />{r.email}
                    </p>
                  )}
                  {r.horaires_ouverture && (
                    <p className="text-blue-400/80 text-xs flex items-start gap-1.5">
                      <Clock size={10} className="text-blue-400/60 shrink-0 mt-0.5" />
                      <span className="whitespace-pre-line leading-relaxed">{r.horaires_ouverture}</span>
                    </p>
                  )}
                </div>

                {/* Notes */}
                {r.notes && (
                  <p className="text-zinc-500 text-[11px] italic leading-relaxed border-t border-zinc-800 pt-2">{r.notes}</p>
                )}

                {/* Action individuelle */}
                {!r._imported && !r._doublon && (
                  <button onClick={e => { e.stopPropagation(); importerProspect(r) }}
                    disabled={r._importing}
                    className="mt-3 w-full py-2 rounded-xl text-xs font-bold border border-zinc-700 text-zinc-300 hover:border-yellow-500/40 hover:text-yellow-400 transition-colors flex items-center justify-center gap-1.5">
                    {r._importing ? <><div className="w-3 h-3 border border-zinc-400 border-t-transparent rounded-full animate-spin" />Import...</> : <><Plus size={11} />Importer</>}
                  </button>
                )}
                {r._doublon && !r._imported && (
                  <button onClick={e => { e.stopPropagation(); importerProspect(r) }}
                    disabled={r._importing}
                    className="mt-3 w-full py-2 rounded-xl text-xs font-semibold border border-orange-500/20 text-orange-400/60 hover:text-orange-400 hover:border-orange-500/40 transition-colors flex items-center justify-center gap-1.5">
                    {r._importing ? <><div className="w-3 h-3 border border-orange-400 border-t-transparent rounded-full animate-spin" />Import...</> : "Importer quand même"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════
//  MODULE PRINCIPAL
// ═════════════════════════════════════════════
export default function IAModule({ activeSociety, profile }: Props) {
  const [tab, setTab] = useState<"chat" | "prospection">("chat")

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">

      {/* Header + Tabs */}
      <div className="px-5 pt-5 pb-0 border-b border-zinc-900 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
            <Sparkles size={18} className="text-yellow-500" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Intelligence Artificielle</h1>
            <p className="text-zinc-500 text-xs">Chat assistant · Recherche de prospects automatique</p>
          </div>
        </div>
        <div className="flex gap-1">
          {([
            { id: "chat",        label: "💬 Chat IA",      sub: "Assistant business" },
            { id: "prospection", label: "🎯 Prospection",  sub: "Trouver des clients" },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-bold transition-all border-b-2 ${
                tab === t.id
                  ? "text-white border-yellow-500 bg-yellow-500/5"
                  : "text-zinc-500 border-transparent hover:text-zinc-300"
              }`}>
              {t.label}
              <span className={`text-[10px] font-normal hidden md:block ${tab === t.id ? "text-zinc-400" : "text-zinc-600"}`}>{t.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === "chat"
          ? <ChatIA activeSociety={activeSociety} profile={profile} />
          : <ProspectionIA activeSociety={activeSociety} profile={profile} />
        }
      </div>
    </div>
  )
}