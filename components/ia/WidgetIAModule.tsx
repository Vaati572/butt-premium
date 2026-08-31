"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Send, Trash2, Save, RefreshCw, Code2, Eye, Plus, X, Sparkles, LayoutGrid, ChevronRight } from "lucide-react"

interface Props { activeSociety: any; profile: any }

interface Message { role: "user" | "assistant"; content: string }
interface Widget {
  id: string; title: string; description: string
  html_content: string; created_at: string; profile_id: string
}

const SYSTEM_PROMPT = `Tu es un générateur de widgets HTML/CSS/JS pour un CRM de tatouage professionnel (Butt Premium).

RÈGLES ABSOLUES :
- Génère UNIQUEMENT du code HTML complet et autonome (avec <style> et <script> intégrés)
- Le code doit fonctionner dans un iframe sans dépendances externes
- Style sombre : fond #0a0a0a, texte blanc, accents #eab308 (jaune), border #27272a
- Police system-ui ou Arial
- Responsive, compact, professionnel
- JAMAIS de commentaires avant le code, JAMAIS de markdown, JAMAIS d'explication
- Commence TOUJOURS directement par <!DOCTYPE html>
- Le widget doit être interactif si possible (cliquable, filtrable, etc.)
- Utilise des données d'exemple réalistes pour le tatouage/skincare

WIDGETS POSSIBLES : tableaux, calendriers, graphiques (avec canvas ou SVG), formulaires, listes, timelines, compteurs, etc.`

export default function WidgetIAModule({ activeSociety, profile }: Props) {
  const [messages, setMessages]     = useState<Message[]>([])
  const [input, setInput]           = useState("")
  const [loading, setLoading]       = useState(false)
  const [currentHtml, setCurrentHtml] = useState<string | null>(null)
  const [currentTitle, setCurrentTitle] = useState("")
  const [savedWidgets, setSavedWidgets] = useState<Widget[]>([])
  const [previewWidget, setPreviewWidget] = useState<Widget | null>(null)
  const [saving, setSaving]         = useState(false)
  const [view, setView]             = useState<"chat" | "library">("chat")
  const [showCode, setShowCode]     = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadWidgets() }, [activeSociety])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const loadWidgets = useCallback(async () => {
    if (!activeSociety?.id) return
    const { data } = await supabase.from("ai_widgets")
      .select("*").eq("society_id", activeSociety.id)
      .order("created_at", { ascending: false })
    setSavedWidgets(data || [])
  }, [activeSociety])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput("")
    setLoading(true)

    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }]
    setMessages(newMessages)

    // Préparer le contexte pour l'IA
    const contextMsg = `Génère un widget HTML autonome pour : ${userMsg}
    
Retourne UNIQUEMENT le code HTML complet, sans aucun texte avant ou après.`

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [
            ...newMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: contextMsg }
          ]
        })
      })

      const data = await res.json()
      const html = data.content?.[0]?.text || ""

      // Extraire le HTML si entouré de backticks
      const clean = html.includes("```html")
        ? html.split("```html")[1].split("```")[0].trim()
        : html.includes("```")
          ? html.split("```")[1].split("```")[0].trim()
          : html.trim()

      setCurrentHtml(clean)

      // Titre automatique basé sur la demande
      const titleRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 30,
          messages: [{ role: "user", content: `Donne un titre court (3-4 mots max) pour ce widget : "${userMsg}". Réponds uniquement avec le titre, sans ponctuation.` }]
        })
      })
      const titleData = await titleRes.json()
      setCurrentTitle(titleData.content?.[0]?.text?.trim() || userMsg.slice(0, 30))

      setMessages(prev => [...prev, {
        role: "assistant",
        content: `✅ Widget généré ! Vous pouvez le voir en prévisualisation. Dites-moi si vous voulez des modifications.`
      }])
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "❌ Erreur lors de la génération. Réessayez." }])
    } finally {
      setLoading(false)
    }
  }

  const saveWidget = async () => {
    if (!currentHtml || !activeSociety?.id) return
    setSaving(true)
    await supabase.from("ai_widgets").insert({
      society_id: activeSociety.id,
      profile_id: profile?.id,
      title: currentTitle,
      description: messages.filter(m => m.role === "user").slice(-1)[0]?.content || "",
      html_content: currentHtml
    })
    await loadWidgets()
    setSaving(false)
    setMessages(prev => [...prev, { role: "assistant", content: `💾 Widget "${currentTitle}" sauvegardé dans votre bibliothèque !` }])
  }

  const deleteWidget = async (id: string) => {
    await supabase.from("ai_widgets").delete().eq("id", id)
    setSavedWidgets(prev => prev.filter(w => w.id !== id))
    if (previewWidget?.id === id) setPreviewWidget(null)
  }

  const regenerate = () => {
    const lastUser = messages.filter(m => m.role === "user").slice(-1)[0]?.content
    if (lastUser) { setInput(lastUser + " (refaire différemment)"); }
  }

  const SUGGESTIONS = [
    "Tableau des 30 prochains jours avec cases à cocher",
    "Compteur de ventes du mois avec barre de progression",
    "Planning hebdomadaire tatoueur avec créneaux",
    "Checklist préparation convention",
    "Graphique CA mensuel en barres",
    "Timer Pomodoro pour les sessions",
    "Calculatrice remise client",
    "Grille de suivi pharmacies par statut",
  ]

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#0a0a0a]">

      {/* Header */}
      <div className="border-b border-zinc-900 px-5 py-3 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base">Studio IA</h1>
            <p className="text-zinc-500 text-[11px]">Crée des widgets personnalisés par description</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView("chat")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
            style={{ background: view==="chat" ? "rgba(167,139,250,0.15)" : "transparent", borderColor: view==="chat" ? "rgba(167,139,250,0.4)" : "#3f3f46", color: view==="chat" ? "#a78bfa" : "#71717a" }}>
            <Sparkles size={12} /> Créer
          </button>
          <button onClick={() => setView("library")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
            style={{ background: view==="library" ? "rgba(167,139,250,0.15)" : "transparent", borderColor: view==="library" ? "rgba(167,139,250,0.4)" : "#3f3f46", color: view==="library" ? "#a78bfa" : "#71717a" }}>
            <LayoutGrid size={12} /> Bibliothèque
            {savedWidgets.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400">{savedWidgets.length}</span>}
          </button>
        </div>
      </div>

      {view === "library" ? (
        /* ── BIBLIOTHÈQUE ── */
        <div className="flex-1 overflow-hidden flex flex-col">
          {previewWidget ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-900 shrink-0">
                <button onClick={() => setPreviewWidget(null)} className="text-zinc-500 hover:text-white flex items-center gap-1.5 text-sm">
                  <X size={14} /> Fermer
                </button>
                <span className="text-zinc-700">·</span>
                <span className="text-white font-bold text-sm">{previewWidget.title}</span>
                <button onClick={() => deleteWidget(previewWidget.id)} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10">
                  <Trash2 size={12} /> Supprimer
                </button>
              </div>
              <iframe srcDoc={previewWidget.html_content} className="flex-1 border-0 w-full" title={previewWidget.title} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-5">
              {savedWidgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                    <Sparkles size={28} className="text-violet-400" />
                  </div>
                  <p className="text-white font-bold text-lg mb-1">Aucun widget sauvegardé</p>
                  <p className="text-zinc-500 text-sm mb-4">Créez votre premier widget avec l'IA</p>
                  <button onClick={() => setView("chat")} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                    <Sparkles size={14} /> Créer un widget
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedWidgets.map(w => (
                    <div key={w.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors group">
                      {/* Mini preview */}
                      <div className="h-40 overflow-hidden relative bg-zinc-950">
                        <iframe srcDoc={w.html_content} className="w-full h-full border-0 pointer-events-none" style={{ transform: "scale(0.6)", transformOrigin: "top left", width: "167%", height: "167%" }} title={w.title} />
                        <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors" />
                      </div>
                      <div className="p-3">
                        <p className="text-white font-bold text-sm mb-0.5">{w.title}</p>
                        <p className="text-zinc-500 text-[11px] truncate mb-3">{w.description}</p>
                        <div className="flex gap-2">
                          <button onClick={() => setPreviewWidget(w)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border border-zinc-700 text-zinc-300 hover:border-violet-500/50 hover:text-violet-400 transition-colors">
                            <Eye size={12} /> Voir
                          </button>
                          <button onClick={() => deleteWidget(w.id)} className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/10 border border-zinc-800 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ── CHAT + PREVIEW ── */
        <div className="flex-1 overflow-hidden flex">

          {/* Chat */}
          <div className="w-96 shrink-0 flex flex-col border-r border-zinc-900">

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-3">
                      <Sparkles size={24} className="text-violet-400" />
                    </div>
                    <p className="text-white font-bold mb-1">Décris ton widget</p>
                    <p className="text-zinc-500 text-xs">L'IA génère le code en temps réel</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 px-1">Suggestions</p>
                    <div className="space-y-1.5">
                      {SUGGESTIONS.map((s, i) => (
                        <button key={i} onClick={() => setInput(s)}
                          className="w-full text-left px-3 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900 transition-all group">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 text-xs flex-1 group-hover:text-zinc-300 transition-colors">{s}</span>
                            <ChevronRight size={12} className="text-zinc-700 group-hover:text-zinc-400 shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-violet-500/20 border border-violet-500/30 text-violet-100 rounded-br-sm"
                      : "bg-zinc-800/60 border border-zinc-700/50 text-zinc-200 rounded-bl-sm"
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}
                    </div>
                    <span className="text-zinc-400 text-xs">Génération en cours...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Actions sur le widget courant */}
            {currentHtml && (
              <div className="px-3 py-2.5 border-t border-zinc-900 flex gap-2 shrink-0">
                <button onClick={saveWidget} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-all"
                  style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", opacity: saving ? 0.6 : 1 }}>
                  <Save size={12} /> {saving ? "Sauvegarde..." : "Garder"}
                </button>
                <button onClick={regenerate} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
                  <RefreshCw size={12} /> Refaire
                </button>
                <button onClick={() => { setCurrentHtml(null); setMessages([]); setCurrentTitle("") }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-500/30 transition-colors">
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-zinc-900 shrink-0">
              <div className="flex gap-2 items-end">
                <textarea value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
                  placeholder="Décris ce que tu veux créer..."
                  rows={2}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 resize-none" />
                <button onClick={send} disabled={loading || !input.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
                  style={{ background: input.trim() ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "#1a1a1a", border: "1px solid " + (input.trim() ? "rgba(124,58,237,0.5)" : "#2a2a2a") }}>
                  <Send size={14} className="text-white" />
                </button>
              </div>
              <p className="text-[10px] text-zinc-700 mt-1.5 text-center">Entrée pour envoyer · Shift+Entrée pour saut de ligne</p>
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {currentHtml ? (
              <>
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-900 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-white font-bold text-sm">{currentTitle || "Aperçu"}</span>
                    <span className="text-zinc-600 text-[11px]">— prévisualisation live</span>
                  </div>
                  <button onClick={() => setShowCode(p => !p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors">
                    <Code2 size={11} /> {showCode ? "Aperçu" : "Code"}
                  </button>
                </div>
                {showCode ? (
                  <pre className="flex-1 overflow-auto p-4 text-[11px] text-green-400 bg-zinc-950 font-mono leading-relaxed">
                    {currentHtml}
                  </pre>
                ) : (
                  <iframe srcDoc={currentHtml} className="flex-1 border-0 w-full" title="Preview" />
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/10 to-purple-600/10 border border-violet-500/15 flex items-center justify-center mb-5">
                  <Eye size={32} className="text-violet-400/50" />
                </div>
                <p className="text-zinc-500 font-bold text-base mb-1">Prévisualisation</p>
                <p className="text-zinc-700 text-sm">Le widget apparaîtra ici après génération</p>
                <div className="mt-8 grid grid-cols-2 gap-2 text-left max-w-sm w-full">
                  {[
                    { icon:"📅", text:"Calendriers & plannings" },
                    { icon:"📊", text:"Graphiques & stats" },
                    { icon:"✅", text:"Checklists interactives" },
                    { icon:"🧮", text:"Calculateurs & outils" },
                  ].map((ex, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/40 border border-zinc-800">
                      <span className="text-base">{ex.icon}</span>
                      <span className="text-zinc-500 text-xs">{ex.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
