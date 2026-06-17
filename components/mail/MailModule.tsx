"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import {
  Mail, RefreshCw, Search, Send, ChevronLeft, LogOut,
  Reply, AlertCircle, Inbox,
} from "lucide-react"

interface Props { activeSociety: any; profile: any }

interface MessageMeta {
  id: string; threadId: string; snippet: string; unread: boolean
  from: string; subject: string; date: string
}

interface MessageFull extends MessageMeta {
  to?: string; text: string; html: string; messageIdHeader?: string
}

const parseFrom = (from: string) => {
  const match = from.match(/^(.*?)\s*<(.+?)>$/)
  if (match) return { name: match[1].replace(/"/g, "").trim() || match[2], email: match[2] }
  return { name: from, email: from }
}

const relDate = (dateStr: string) => {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ""
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  if (diffDays === 1) return "Hier"
  if (diffDays < 7) return d.toLocaleDateString("fr-FR", { weekday: "short" })
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

const initialsFromName = (name: string) => name?.split(" ").map(w => w[0]).filter(Boolean).join("").toUpperCase().slice(0, 2) || "?"
const avatarColor = (seed: string) => {
  const palette = ["#eab308", "#3b82f6", "#22c55e", "#a855f7", "#f97316", "#ec4899", "#06b6d4"]
  let h = 0
  for (const c of seed || "?") h = (h + c.charCodeAt(0)) % palette.length
  return palette[h]
}

export default function MailModule({ activeSociety, profile }: Props) {
  const [status, setStatus]     = useState<"loading" | "disconnected" | "connected">("loading")
  const [accountEmail, setAccountEmail] = useState("")
  const [messages, setMessages] = useState<MessageMeta[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [error, setError]       = useState("")
  const [search, setSearch]     = useState("")
  const [selected, setSelected] = useState<MessageFull | null>(null)
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [replying, setReplying] = useState(false)
  const [replyBody, setReplyBody] = useState("")
  const [sending, setSending]   = useState(false)
  const [connecting, setConnecting] = useState(false)
  const searchTimer = useRef<any>(null)

  const authedFetch = useCallback(async (url: string, init?: RequestInit) => {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    return fetch(url, {
      ...init,
      headers: { ...(init?.headers || {}), Authorization: `Bearer ${token || ""}` },
    })
  }, [])

  const checkStatus = useCallback(async () => {
    setStatus("loading")
    try {
      const res = await authedFetch("/api/gmail/status")
      const d = await res.json()
      if (d.connected) { setStatus("connected"); setAccountEmail(d.email || "") }
      else setStatus("disconnected")
    } catch {
      setStatus("disconnected")
    }
  }, [authedFetch])

  const loadInbox = useCallback(async (q?: string) => {
    setLoadingList(true); setError("")
    try {
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      const res = await authedFetch(`/api/gmail/inbox?${params.toString()}`)
      const d = await res.json()
      if (d.error) { setError("Impossible de charger les emails."); setMessages([]) }
      else setMessages(d.messages || [])
    } catch {
      setError("Impossible de charger les emails.")
    } finally {
      setLoadingList(false)
    }
  }, [authedFetch])

  useEffect(() => { checkStatus() }, [checkStatus])
  useEffect(() => { if (status === "connected") loadInbox() }, [status, loadInbox])

  // Détecte le retour de l'OAuth Google (?tab=mail&mail_connected=1) et nettoie l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("mail_connected") || params.get("mail_error")) {
      if (params.get("mail_error")) {
        const code = params.get("mail_error")
        const detail = params.get("detail")
        setError(`Échec de connexion Gmail (${code}${detail ? " : " + detail : ""})`)
      }
      const url = new URL(window.location.href)
      url.searchParams.delete("mail_connected"); url.searchParams.delete("mail_error"); url.searchParams.delete("detail"); url.searchParams.delete("tab")
      window.history.replaceState({}, "", url.toString())
      checkStatus()
    }
  }, [checkStatus])

  const connect = () => {
    setConnecting(true)
    window.location.href = `/api/gmail/auth?profile_id=${profile.id}`
  }

  const disconnect = async () => {
    if (!confirm("Déconnecter cette boîte mail de l'application ?")) return
    await authedFetch("/api/gmail/disconnect", { method: "POST" })
    setStatus("disconnected"); setMessages([]); setSelected(null)
  }

  const openMessage = async (id: string) => {
    setLoadingMsg(true); setReplying(false); setReplyBody("")
    try {
      const res = await authedFetch(`/api/gmail/message/${id}`)
      const d = await res.json()
      if (!d.error) {
        setSelected(d)
        setMessages(prev => prev.map(m => m.id === id ? { ...m, unread: false } : m))
      }
    } finally {
      setLoadingMsg(false)
    }
  }

  const sendReply = async () => {
    if (!selected || !replyBody.trim()) return
    setSending(true)
    const { email } = parseFrom(selected.from)
    try {
      const res = await authedFetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email, subject: selected.subject?.startsWith("Re:") ? selected.subject : `Re: ${selected.subject}`,
          body: replyBody, threadId: selected.threadId, inReplyTo: selected.messageIdHeader,
        }),
      })
      const d = await res.json()
      if (d.success) { setReplying(false); setReplyBody("") }
      else setError("L'envoi a échoué.")
    } finally {
      setSending(false)
    }
  }

  const onSearchChange = (v: string) => {
    setSearch(v)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => loadInbox(v), 500)
  }

  const unreadCount = messages.filter(m => m.unread).length

  return (
    <div className="flex-1 overflow-hidden bg-[#0a0a0a] flex flex-col">
      <div className="border-b border-zinc-900 px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-white font-bold text-xl flex items-center gap-2"><Mail size={20} className="text-yellow-500"/> Boîte mail</h1>
            <p className="text-zinc-500 text-xs mt-0.5">
              {status === "connected" ? `${accountEmail} · ${unreadCount} non lu${unreadCount > 1 ? "s" : ""}` : "Connecte ta boîte Gmail pour accéder à tes emails ici"}
            </p>
          </div>
          {status === "connected" && (
            <div className="flex items-center gap-2">
              <button onClick={() => loadInbox(search)} disabled={loadingList}
                className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-50">
                <RefreshCw size={14} className={loadingList ? "animate-spin" : ""}/>
              </button>
              <button onClick={disconnect}
                className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-400 font-semibold px-3 py-2 rounded-xl text-xs">
                <LogOut size={12}/> Déconnecter
              </button>
            </div>
          )}
        </div>
      </div>

      {status === "loading" ? (
        <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/></div>
      ) : status === "disconnected" ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-3xl mb-4">📧</div>
          <p className="text-white text-lg font-bold mb-2">Connecte ta boîte mail</p>
          <p className="text-zinc-500 text-sm mb-6 max-w-sm">Accède à tes emails Gmail directement depuis Butt Premium, sans changer d'onglet.</p>
          {error && <p className="text-red-400 text-xs mb-4 flex items-center gap-1.5"><AlertCircle size={12}/> {error}</p>}
          <button onClick={connect} disabled={connecting}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold px-5 py-3 rounded-xl text-sm">
            {connecting ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <Mail size={15}/>}
            Connecter Gmail
          </button>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Liste des emails */}
          <div className={`${selected ? "hidden md:flex" : "flex"} flex-col w-full md:w-[360px] border-r border-zinc-900 shrink-0`}>
            <div className="p-3 border-b border-zinc-900 shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                <input type="text" value={search} onChange={e => onSearchChange(e.target.value)}
                  placeholder="Rechercher dans la boîte..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/40"/>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingList ? (
                <div className="flex items-center justify-center py-10"><div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <Inbox size={28} className="text-zinc-700 mb-2"/>
                  <p className="text-zinc-500 text-sm">Aucun email{search ? " pour cette recherche" : ""}</p>
                </div>
              ) : messages.map(m => {
                const { name } = parseFrom(m.from)
                const isSel = selected?.id === m.id
                return (
                  <button key={m.id} onClick={() => openMessage(m.id)}
                    className="w-full flex items-start gap-2.5 px-3 py-3 border-b border-zinc-900/60 text-left transition-colors"
                    style={{ backgroundColor: isSel ? "rgba(234,179,8,0.08)" : "transparent" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-black shrink-0 mt-0.5"
                      style={{ backgroundColor: avatarColor(name) }}>{initialsFromName(name)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${m.unread ? "text-white font-bold" : "text-zinc-300 font-medium"}`}>{name}</p>
                        <span className="text-zinc-600 text-[10px] shrink-0">{relDate(m.date)}</span>
                      </div>
                      <p className={`text-xs truncate ${m.unread ? "text-zinc-200 font-semibold" : "text-zinc-500"}`}>{m.subject}</p>
                      <p className="text-zinc-600 text-[11px] truncate">{m.snippet}</p>
                    </div>
                    {m.unread && <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0 mt-1.5"/>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Lecture du message */}
          <div className={`${selected ? "flex" : "hidden md:flex"} flex-1 flex-col overflow-hidden`}>
            {loadingMsg ? (
              <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/></div>
            ) : !selected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <Mail size={32} className="text-zinc-700 mb-2"/>
                <p className="text-zinc-500 text-sm">Sélectionne un email pour le lire</p>
              </div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-zinc-900 shrink-0">
                  <button onClick={() => setSelected(null)} className="md:hidden flex items-center gap-1 text-zinc-500 hover:text-white text-xs mb-3">
                    <ChevronLeft size={14}/> Retour
                  </button>
                  <h2 className="text-white font-bold text-base mb-1">{selected.subject}</h2>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-black shrink-0"
                      style={{ backgroundColor: avatarColor(parseFrom(selected.from).name) }}>{initialsFromName(parseFrom(selected.from).name)}</div>
                    <div className="min-w-0">
                      <p className="text-zinc-200 text-sm font-semibold truncate">{parseFrom(selected.from).name}</p>
                      <p className="text-zinc-600 text-[11px] truncate">{parseFrom(selected.from).email} · {new Date(selected.date).toLocaleString("fr-FR")}</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  {selected.html ? (
                    <div className="text-zinc-300 text-sm leading-relaxed [&_a]:text-yellow-400 [&_img]:max-w-full" dangerouslySetInnerHTML={{ __html: selected.html }}/>
                  ) : (
                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{selected.text || "(message vide)"}</p>
                  )}
                </div>
                <div className="p-4 border-t border-zinc-900 shrink-0">
                  {!replying ? (
                    <button onClick={() => setReplying(true)}
                      className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm">
                      <Reply size={14}/> Répondre
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <textarea value={replyBody} onChange={e => setReplyBody(e.target.value)} rows={4} autoFocus
                        placeholder={`Répondre à ${parseFrom(selected.from).name}...`}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/40 resize-none"/>
                      <div className="flex gap-2">
                        <button onClick={sendReply} disabled={sending || !replyBody.trim()}
                          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold px-4 py-2.5 rounded-xl text-sm">
                          {sending ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <Send size={14}/>}
                          Envoyer
                        </button>
                        <button onClick={() => { setReplying(false); setReplyBody("") }}
                          className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm">Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
