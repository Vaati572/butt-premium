"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import {
  Send, Plus, X, Users, MessageSquare,
  Check, CheckCheck, Search,
} from "lucide-react"

interface Props { activeSociety: any; profile: any }

interface Message {
  id: string
  sender_id: string
  sender_nom: string
  content: string
  created_at: string
  read_by: string[]
  conversation_id: string
}

interface Conversation {
  id: string
  type: "direct" | "group"
  name: string
  members: { id: string; nom: string; avatar_url?: string }[]
  last_message?: string
  last_message_at?: string
  unread_count: number
}

/* ── AVATAR ──────────────────────────────────── */
function Avatar({ nom, url, size = 36, online }: { nom: string; url?: string; size?: number; online?: boolean }) {
  const colors = ["#d97706","#b45309","#f59e0b","#92400e","#a16207"]
  const color = colors[(nom?.charCodeAt(0) || 0) % colors.length]
  const initials = nom?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"

  return (
    <div className="relative shrink-0">
      <div className="rounded-full overflow-hidden border border-zinc-700 flex items-center justify-center text-black font-bold"
        style={{ width: size, height: size, backgroundColor: url ? undefined : color, fontSize: size * 0.35 }}>
        {url ? <img src={url} className="w-full h-full object-cover" /> : initials}
      </div>
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${online ? "bg-green-400" : "bg-zinc-600"}`} />
      )}
    </div>
  )
}

/* ── MODAL NOUVEAU GROUPE ────────────────────── */
function GroupModal({ members, currentUser, onClose, onCreated }: {
  members: { id: string; nom: string }[]
  currentUser: any
  onClose: () => void
  onCreated: (name: string, memberIds: string[]) => void
}) {
  const [name, setName] = useState("")
  const [selected, setSelected] = useState<string[]>([currentUser.id])

  const toggle = (id: string) => {
    if (id === currentUser.id) return
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="text-white font-bold">👥 Nouveau groupe</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5">Nom du groupe</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Équipe Vente"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5">Membres</label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {members.filter(m => m.id !== currentUser.id).map(m => (
                <button key={m.id} onClick={() => toggle(m.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors text-left ${selected.includes(m.id) ? "bg-yellow-500/10 border-yellow-500/30" : "border-transparent hover:bg-zinc-800"}`}>
                  <Avatar nom={m.nom} size={28} />
                  <span className="text-sm text-white">{m.nom}</span>
                  {selected.includes(m.id) && <Check size={13} className="text-yellow-500 ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-5 pt-0">
          <button onClick={() => onCreated(name.trim(), selected)}
            disabled={!name.trim() || selected.length < 2}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-2.5 rounded-xl text-sm transition-colors">
            Créer le groupe ({selected.length} membres)
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN MODULE
══════════════════════════════════════════════ */
export default function MessagesModule({ activeSociety, profile }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const activeConvRef = useRef<Conversation | null>(null)
  const [members, setMembers] = useState<{ id: string; nom: string; avatar_url?: string }[]>([])
  const [input, setInput] = useState("")
  const [search, setSearch] = useState("")
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (activeSociety) {
      loadMembers()
      loadConversations()
    }
  }, [activeSociety])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel(`messages_${activeSociety?.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `society_id=eq.${activeSociety?.id}`,
      }, (payload) => {
        const msg = payload.new as Message
        // Use ref to avoid stale closure
        setMessages(prev => {
          if (activeConvRef.current && msg.conversation_id === activeConvRef.current.id) {
            // Évite les doublons si on vient de send
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          }
          return prev
        })
        // Update unread in conversation list
        loadConversations()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeSociety]) // activeConv via ref — pas besoin de resouscrire

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadMembers = async () => {
    const { data } = await supabase.from("profiles").select("id, nom, avatar_url")
      .eq("society_id", activeSociety.id)
    setMembers(data || [])
  }

  const loadConversations = async () => {
    // 1. Load conversations
    const { data: convs } = await supabase.from("conversations")
      .select("*")
      .eq("society_id", activeSociety.id)
      .contains("member_ids", [profile.id])
      .order("last_message_at", { ascending: false, nullsFirst: false })

    if (!convs) { setLoading(false); return }

    // 2. Load all member profiles separately (évite le join défaillant)
    const allMemberIds = [...new Set(convs.flatMap((c: any) => c.member_ids || []))]
    const { data: memberProfiles } = allMemberIds.length > 0
      ? await supabase.from("profiles").select("id, nom, avatar_url, color").in("id", allMemberIds)
      : { data: [] }

    const profileMap: Record<string, any> = {}
    ;(memberProfiles || []).forEach((p: any) => { profileMap[p.id] = p })

    // 3. Build conversation list
    const convList: Conversation[] = await Promise.all(convs.map(async (c: any) => {
      const { count } = await supabase.from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", c.id)
        .not("read_by", "cs", `{${profile.id}}`)
        .neq("sender_id", profile.id)

      const members = (c.member_ids || [])
        .map((id: string) => profileMap[id])
        .filter(Boolean)

      let displayName = c.name
      if (c.type === "direct" && !c.name) {
        const other = members.find((m: any) => m.id !== profile.id)
        displayName = other?.nom || "Conversation directe"
      }

      return {
        id: c.id,
        type: c.type,
        name: displayName,
        members,
        last_message: c.last_message,
        last_message_at: c.last_message_at,
        unread_count: count || 0,
      }
    }))

    setConversations(convList)
    setLoading(false)
  }

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv)
    setMessages([])
    activeConvRef.current = conv
    inputRef.current?.focus()

    // Load messages — sans filtre society_id (RLS sur conversation_id suffit)
    const { data, error } = await supabase.from("messages")
      .select("id, sender_id, sender_nom, content, created_at, read_by, conversation_id")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true })
      .limit(200)

    if (error) {
      console.error("Erreur chargement messages:", error)
      console.error("conversation_id:", conv.id)
    } else {
      console.log(`Messages chargés: ${(data || []).length} pour conv ${conv.id}`)
    }
    setMessages(data || [])

    // Mark as read
    const unread = (data || []).filter(m => m.sender_id !== profile.id && !m.read_by?.includes(profile.id))
    if (unread.length > 0) {
      await Promise.all(unread.map(msg =>
        supabase.from("messages").update({
          read_by: [...(msg.read_by || []), profile.id]
        }).eq("id", msg.id)
      ))
    }
    loadConversations()
  }

  const startDirectConv = async (member: { id: string; nom: string; avatar_url?: string; color?: string }) => {
    // Vérifier en BDD s'il existe déjà une conv directe avec cette personne
    const { data: existingConvs } = await supabase.from("conversations")
      .select("id, member_ids")
      .eq("society_id", activeSociety.id)
      .eq("type", "direct")
      .contains("member_ids", [profile.id])
      .contains("member_ids", [member.id])

    if (existingConvs && existingConvs.length > 0) {
      // Conv existante → l'ouvrir directement
      const existingInState = conversations.find(c => c.id === existingConvs[0].id)
      if (existingInState) {
        openConversation(existingInState)
      } else {
        // Pas encore dans le state → recharger puis ouvrir
        await loadConversations()
        const conv: Conversation = {
          id: existingConvs[0].id, type: "direct", name: member.nom,
          members: [{ id: profile.id, nom: profile.nom }, member],
          unread_count: 0,
        }
        openConversation(conv)
      }
      return
    }

    // Créer nouvelle conversation directe
    const { data } = await supabase.from("conversations").insert({
      society_id: activeSociety.id,
      type: "direct",
      member_ids: [profile.id, member.id],
      last_message_at: new Date().toISOString(),
    }).select().single()

    if (data) {
      await supabase.from("conversation_members").insert([
        { conversation_id: data.id, profile_id: profile.id },
        { conversation_id: data.id, profile_id: member.id },
      ])
      await loadConversations()
      openConversation({
        id: data.id, type: "direct", name: member.nom,
        members: [{ id: profile.id, nom: profile.nom }, member],
        unread_count: 0,
      })
    }
  }

  const createGroup = async (name: string, memberIds: string[]) => {
    const { data } = await supabase.from("conversations").insert({
      society_id: activeSociety.id,
      type: "group",
      name,
      member_ids: memberIds,
      last_message_at: new Date().toISOString(),
    }).select().single()

    if (data) {
      await supabase.from("conversation_members").insert(
        memberIds.map(id => ({ conversation_id: data.id, profile_id: id }))
      )
      setShowGroupModal(false)
      await loadConversations()
    }
  }

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Supprimer cette conversation et tous ses messages ?")) return
    await supabase.from("messages").delete().eq("conversation_id", convId)
    await supabase.from("conversation_members").delete().eq("conversation_id", convId)
    await supabase.from("conversations").delete().eq("id", convId)
    if (activeConv?.id === convId) { setActiveConv(null); setMessages([]) }
    loadConversations()
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeConv || sending) return
    setSending(true)
    const content = input.trim()
    setInput("")

    const { data: msg } = await supabase.from("messages").insert({
      society_id: activeSociety.id,
      conversation_id: activeConv.id,
      sender_id: profile.id,
      sender_nom: profile.nom || profile.username || "Moi",
      content,
      read_by: [profile.id],
    }).select().single()

    if (msg) setMessages(prev => [...prev, msg])

    // Update last_message in conversation
    await supabase.from("conversations").update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    }).eq("id", activeConv.id)

    setSending(false)
    loadConversations()
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diffDays === 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    if (diffDays === 1) return "Hier"
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
  }

  const otherMember = (conv: Conversation) => conv.members.find(m => m.id !== profile.id)

  const filteredConvs = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const membersNotInConv = members.filter(m =>
    m.id !== profile.id &&
    !conversations.some(c => c.type === "direct" && c.members.some(x => x.id === m.id))
  )

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0a0a0a]">

      {/* ── LEFT SIDEBAR ─────────────────────────── */}
      <div className="w-72 flex flex-col border-r border-zinc-900 bg-[#111111]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-900">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-sm">💬 Messages</h2>
            <button onClick={() => setShowGroupModal(true)}
              className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 rounded-lg hover:border-zinc-600 transition-colors">
              <Users size={11} /> Groupe
            </button>
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50" />
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {/* Existing conversations */}
          {filteredConvs.length > 0 && (
            <div className="py-2">
              <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider px-4 pb-1">Conversations</p>
              {filteredConvs.map(conv => {
                const isActive = activeConv?.id === conv.id
                const other = conv.type === "direct" ? otherMember(conv) : null
                return (
                  <div key={conv.id}
                    className={`relative group flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer ${isActive ? "bg-yellow-500/10 border-r-2 border-yellow-500" : "hover:bg-zinc-800/50"}`}
                    onClick={() => openConversation(conv)}>
                    {conv.type === "group" ? (
                      <div className="w-9 h-9 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center shrink-0">
                        <Users size={14} className="text-zinc-300" />
                      </div>
                    ) : (
                      <Avatar nom={other?.nom || conv.name} url={other?.avatar_url} size={36} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className={`text-sm font-semibold truncate ${isActive ? "text-yellow-400" : "text-white"}`}>{conv.name}</span>
                        {conv.last_message_at && (
                          <span className="text-[10px] text-zinc-600 shrink-0 ml-1">{formatTime(conv.last_message_at)}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-zinc-500 truncate max-w-[120px]">{conv.last_message || "Nouvelle conversation"}</p>
                        {conv.unread_count > 0 && (
                          <span className="ml-1 bg-yellow-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                            {conv.unread_count > 9 ? "9+" : conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Bouton supprimer — visible au hover */}
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 flex items-center justify-center transition-all"
                      title="Supprimer la conversation">
                      <X size={11} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Members to start a new conversation */}
          {membersNotInConv.length > 0 && (
            <div className="py-2 border-t border-zinc-900">
              <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider px-4 pb-1">Démarrer une conv.</p>
              {membersNotInConv.filter(m => m.nom.toLowerCase().includes(search.toLowerCase())).map(m => (
                <button key={m.id} onClick={() => startDirectConv(m)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors text-left">
                  <Avatar nom={m.nom} url={m.avatar_url} size={36} />
                  <div>
                    <p className="text-white text-sm font-semibold">{m.nom}</p>
                    <p className="text-zinc-600 text-[11px]">Démarrer la conversation</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT CONVERSATION AREA ──────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-semibold">Sélectionnez une conversation</p>
            <p className="text-xs mt-1 opacity-60">ou démarrez-en une nouvelle</p>
          </div>
        ) : (
          <>
            {/* Conv header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-900 bg-[#111111]">
              {activeConv.type === "group" ? (
                <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center">
                  <Users size={16} className="text-zinc-300" />
                </div>
              ) : (
                <Avatar nom={otherMember(activeConv)?.nom || activeConv.name} url={otherMember(activeConv)?.avatar_url} size={36} />
              )}
              <div>
                <p className="text-white font-bold text-sm">{activeConv.name}</p>
                {activeConv.type === "group" && (
                  <p className="text-zinc-500 text-[11px]">{activeConv.members.length} membres · {activeConv.members.map(m => m.nom).join(", ")}</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 && (
                <div className="text-center py-12 text-zinc-700">
                  <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Début de la conversation</p>
                </div>
              )}
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id === profile.id
                const showSender = !isMe && activeConv.type === "group"
                const prevMsg = messages[idx - 1]
                const showAvatar = !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id)
                const isRead = isMe && messages.slice(idx + 1).length === 0 && msg.read_by?.length > 1

                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar placeholder to maintain alignment */}
                    {!isMe && (
                      <div className="w-7 shrink-0">
                        {showAvatar && <Avatar nom={msg.sender_nom} size={28} />}
                      </div>
                    )}
                    <div className={`max-w-[65%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                      {showSender && <p className="text-[10px] text-zinc-500 mb-1 ml-1">{msg.sender_nom}</p>}
                      <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? "bg-yellow-500 text-black rounded-br-sm"
                          : "bg-zinc-800 text-white rounded-bl-sm"
                      }`}>
                        {msg.content}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? "flex-row-reverse" : ""}`}>
                        <p className="text-[10px] text-zinc-600">{formatTime(msg.created_at)}</p>
                        {isMe && (isRead
                          ? <CheckCheck size={11} className="text-yellow-500" />
                          : <Check size={11} className="text-zinc-600" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-zinc-900 bg-[#111111]">
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={`Écrire à ${activeConv.name}...`}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
                <button onClick={sendMessage} disabled={!input.trim() || sending}
                  className="w-10 h-10 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black rounded-full flex items-center justify-center transition-colors shrink-0 shadow-lg shadow-yellow-500/20">
                  {sending
                    ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    : <Send size={15} />
                  }
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Group modal */}
      {showGroupModal && (
        <GroupModal
          members={members}
          currentUser={profile}
          onClose={() => setShowGroupModal(false)}
          onCreated={createGroup}
        />
      )}
    </div>
  )
}