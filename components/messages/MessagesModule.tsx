"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
  Send, X, Users, MessageSquare, Check, CheckCheck,
  Search, Smile, Paperclip, Reply, Download, Image,
  FileText, File, CornerUpLeft, AtSign,
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
  reply_to_id?: string | null
  reply_preview?: string | null
  reactions?: Record<string, string[]>   // emoji → [user_ids]
  file_url?: string | null
  file_type?: string | null
  file_name?: string | null
  file_size?: number | null
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

const EMOJI_LIST = ["👍","❤️","😂","😮","😢","🔥","👏","🎉"]

const formatSize = (bytes?: number | null) => {
  if (!bytes) return ""
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

/* ── AVATAR ────────────────────────────────── */
function Avatar({ nom, url, size = 36, online }: { nom: string; url?: string; size?: number; online?: boolean }) {
  const colors = ["#d97706","#b45309","#f59e0b","#92400e","#a16207"]
  const color = colors[(nom?.charCodeAt(0) || 0) % colors.length]
  const initials = nom?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"
  return (
    <div className="relative shrink-0">
      <div className="rounded-full overflow-hidden border border-zinc-700 flex items-center justify-center text-black font-bold"
        style={{ width: size, height: size, backgroundColor: url ? undefined : color, fontSize: size * 0.35 }}>
        {url ? <img src={url} className="w-full h-full object-cover" alt={nom} /> : initials}
      </div>
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${online ? "bg-green-400" : "bg-zinc-600"}`} />
      )}
    </div>
  )
}

/* ── GROUP MODAL ───────────────────────────── */
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
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nom du groupe"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
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
        <div className="p-5 pt-0">
          <button onClick={() => onCreated(name.trim(), selected)} disabled={!name.trim() || selected.length < 2}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-2.5 rounded-xl text-sm transition-colors">
            Créer ({selected.length} membres)
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── FILE PREVIEW ──────────────────────────── */
function FilePreview({ url, type, name, size }: { url: string; type?: string | null; name?: string | null; size?: number | null }) {
  if (!url) return null
  if (type?.startsWith("image/")) {
    return (
      <div className="mt-2 rounded-xl overflow-hidden max-w-[220px] cursor-pointer border border-zinc-700"
        onClick={() => window.open(url, "_blank")}>
        <img src={url} alt={name || "image"} className="w-full h-auto max-h-48 object-cover" />
      </div>
    )
  }
  return (
    <a href={url} download={name} target="_blank" rel="noreferrer"
      className="mt-2 flex items-center gap-2.5 bg-zinc-700/60 hover:bg-zinc-700 border border-zinc-600 rounded-xl px-3 py-2 transition-colors max-w-[220px]">
      <div className="w-8 h-8 rounded-lg bg-zinc-600 flex items-center justify-center shrink-0">
        {type?.includes("pdf") ? <FileText size={14} className="text-red-400" />
          : type?.startsWith("image") ? <Image size={14} className="text-purple-400" />
          : <File size={14} className="text-blue-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold truncate">{name || "Fichier"}</p>
        <p className="text-zinc-400 text-[10px]">{formatSize(size)}</p>
      </div>
      <Download size={12} className="text-zinc-400 shrink-0" />
    </a>
  )
}

/* ══════════════════════════════════════════════
   MAIN MODULE
══════════════════════════════════════════════ */
export default function MessagesModule({ activeSociety, profile }: Props) {
  const [conversations, setConversations]   = useState<Conversation[]>([])
  const [activeConv, setActiveConv]         = useState<Conversation | null>(null)
  const [messages, setMessages]             = useState<Message[]>([])
  const activeConvRef                       = useRef<Conversation | null>(null)
  const [members, setMembers]               = useState<{ id: string; nom: string; avatar_url?: string }[]>([])
  const [input, setInput]                   = useState("")
  const [convSearch, setConvSearch]         = useState("")
  const [msgSearch, setMsgSearch]           = useState("")
  const [showMsgSearch, setShowMsgSearch]   = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [loading, setLoading]               = useState(true)
  const [sending, setSending]               = useState(false)
  const [replyTo, setReplyTo]               = useState<Message | null>(null)
  const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null)
  const [mentionSearch, setMentionSearch]   = useState<string | null>(null)
  const [uploadingFile, setUploadingFile]   = useState(false)
  const [readByPopup, setReadByPopup]       = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLInputElement>(null)
  const fileRef        = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (activeSociety) { loadMembers(); loadConversations() }
  }, [activeSociety])

  // Realtime
  useEffect(() => {
    const channel = supabase.channel(`messages_${activeSociety?.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages",
        filter: `society_id=eq.${activeSociety?.id}` }, (payload) => {
        const msg = payload.new as Message
        setMessages(prev => {
          if (activeConvRef.current && msg.conversation_id === activeConvRef.current.id) {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          }
          return prev
        })
        loadConversations()
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages",
        filter: `society_id=eq.${activeSociety?.id}` }, (payload) => {
        const updated = payload.new as Message
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeSociety])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  // Close emoji picker on outside click
  useEffect(() => {
    const h = () => { setEmojiPickerFor(null); setReadByPopup(null) }
    document.addEventListener("click", h)
    return () => document.removeEventListener("click", h)
  }, [])

  const loadMembers = async () => {
    const { data } = await supabase.from("profiles").select("id, nom, avatar_url").eq("society_id", activeSociety.id)
    setMembers(data || [])
  }

  const loadConversations = async () => {
    const { data: convs } = await supabase.from("conversations")
      .select("*").eq("society_id", activeSociety.id)
      .contains("member_ids", [profile.id])
      .order("last_message_at", { ascending: false, nullsFirst: false })
    if (!convs) { setLoading(false); return }

    const allMemberIds = [...new Set(convs.flatMap((c: any) => c.member_ids || []))]
    const { data: memberProfiles } = allMemberIds.length > 0
      ? await supabase.from("profiles").select("id, nom, avatar_url").in("id", allMemberIds)
      : { data: [] }
    const profileMap: Record<string, any> = {}
    ;(memberProfiles || []).forEach((p: any) => { profileMap[p.id] = p })

    const convList: Conversation[] = await Promise.all(convs.map(async (c: any) => {
      const { count } = await supabase.from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", c.id)
        .not("read_by", "cs", `{${profile.id}}`)
        .neq("sender_id", profile.id)
      const mems = (c.member_ids || []).map((id: string) => profileMap[id]).filter(Boolean)
      let displayName = c.name
      if (c.type === "direct" && !c.name) {
        const other = mems.find((m: any) => m.id !== profile.id)
        displayName = other?.nom || "Conversation directe"
      }
      return { id: c.id, type: c.type, name: displayName, members: mems,
        last_message: c.last_message, last_message_at: c.last_message_at, unread_count: count || 0 }
    }))

    setConversations(convList)
    setLoading(false)
  }

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv); setMessages([]); activeConvRef.current = conv
    setReplyTo(null); setShowMsgSearch(false); setMsgSearch("")
    inputRef.current?.focus()
    const { data } = await supabase.from("messages")
      .select("*").eq("conversation_id", conv.id)
      .order("created_at", { ascending: true }).limit(300)
    setMessages(data || [])
    const unread = (data || []).filter(m => m.sender_id !== profile.id && !m.read_by?.includes(profile.id))
    if (unread.length > 0) {
      await Promise.all(unread.map(msg =>
        supabase.from("messages").update({ read_by: [...(msg.read_by || []), profile.id] }).eq("id", msg.id)
      ))
    }
    loadConversations()
  }

  const startDirectConv = async (member: { id: string; nom: string; avatar_url?: string }) => {
    const { data: existingConvs } = await supabase.from("conversations")
      .select("id, member_ids").eq("society_id", activeSociety.id).eq("type", "direct")
      .contains("member_ids", [profile.id]).contains("member_ids", [member.id])
    if (existingConvs && existingConvs.length > 0) {
      const existing = conversations.find(c => c.id === existingConvs[0].id)
      if (existing) { openConversation(existing); return }
    }
    const { data } = await supabase.from("conversations").insert({
      society_id: activeSociety.id, type: "direct",
      member_ids: [profile.id, member.id], last_message_at: new Date().toISOString(),
    }).select().single()
    if (data) {
      await loadConversations()
      openConversation({ id: data.id, type: "direct", name: member.nom,
        members: [{ id: profile.id, nom: profile.nom }, member], unread_count: 0 })
    }
  }

  const createGroup = async (name: string, memberIds: string[]) => {
    const { data } = await supabase.from("conversations").insert({
      society_id: activeSociety.id, type: "group", name,
      member_ids: memberIds, last_message_at: new Date().toISOString(),
    }).select().single()
    if (data) { setShowGroupModal(false); await loadConversations() }
  }

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Supprimer cette conversation ?")) return
    await supabase.from("messages").delete().eq("conversation_id", convId)
    await supabase.from("conversations").delete().eq("id", convId)
    if (activeConv?.id === convId) { setActiveConv(null); setMessages([]) }
    loadConversations()
  }

  /* ── SEND ─────────────────────────────────── */
  const sendMessage = async () => {
    if (!input.trim() || !activeConv || sending) return
    setSending(true)
    const content = input.trim()
    setInput(""); setReplyTo(null); setMentionSearch(null)

    const { data: msg } = await supabase.from("messages").insert({
      society_id: activeSociety.id,
      conversation_id: activeConv.id,
      sender_id: profile.id,
      sender_nom: profile.nom || "Moi",
      content,
      read_by: [profile.id],
      reply_to_id: replyTo?.id || null,
      reply_preview: replyTo?.content?.slice(0, 80) || null,
      reactions: {},
    }).select().single()

    if (msg) setMessages(prev => [...prev, msg])
    await supabase.from("conversations").update({
      last_message: content, last_message_at: new Date().toISOString(),
    }).eq("id", activeConv.id)
    setSending(false); loadConversations()
  }

  /* ── FILE UPLOAD ──────────────────────────── */
  const handleFileUpload = async (file: File) => {
    if (!activeConv) return
    setUploadingFile(true)
    const path = `messages/${activeSociety.id}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file, { upsert: true })
    let fileUrl = ""
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path)
      fileUrl = urlData.publicUrl
    }
    const { data: msg } = await supabase.from("messages").insert({
      society_id: activeSociety.id,
      conversation_id: activeConv.id,
      sender_id: profile.id,
      sender_nom: profile.nom || "Moi",
      content: "",
      read_by: [profile.id],
      file_url: fileUrl,
      file_type: file.type,
      file_name: file.name,
      file_size: file.size,
      reactions: {},
    }).select().single()
    if (msg) setMessages(prev => [...prev, msg])
    await supabase.from("conversations").update({
      last_message: `📎 ${file.name}`, last_message_at: new Date().toISOString(),
    }).eq("id", activeConv.id)
    setUploadingFile(false); loadConversations()
  }

  /* ── REACTIONS ────────────────────────────── */
  const toggleReaction = async (msg: Message, emoji: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const reactions = { ...(msg.reactions || {}) }
    const users = reactions[emoji] || []
    if (users.includes(profile.id)) {
      reactions[emoji] = users.filter((id: string) => id !== profile.id)
      if (reactions[emoji].length === 0) delete reactions[emoji]
    } else {
      reactions[emoji] = [...users, profile.id]
    }
    await supabase.from("messages").update({ reactions }).eq("id", msg.id)
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, reactions } : m))
    setEmojiPickerFor(null)
  }

  /* ── MENTIONS ─────────────────────────────── */
  const handleInputChange = (val: string) => {
    setInput(val)
    const atIdx = val.lastIndexOf("@")
    if (atIdx !== -1 && atIdx === val.length - 1) {
      setMentionSearch("")
    } else if (atIdx !== -1) {
      const after = val.slice(atIdx + 1)
      if (/^\w*$/.test(after)) setMentionSearch(after)
      else setMentionSearch(null)
    } else {
      setMentionSearch(null)
    }
  }

  const insertMention = (nom: string) => {
    const atIdx = input.lastIndexOf("@")
    setInput(input.slice(0, atIdx) + "@" + nom + " ")
    setMentionSearch(null)
    inputRef.current?.focus()
  }

  const filteredMentions = mentionSearch !== null
    ? (activeConv?.members || []).filter(m =>
        m.id !== profile.id && m.nom.toLowerCase().includes(mentionSearch.toLowerCase()))
    : []

  /* ── RENDER HELPERS ──────────────────────── */
  const formatTime = (date: string) => {
    const d = new Date(date)
    const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000)
    if (diffDays === 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    if (diffDays === 1) return "Hier"
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
  }

  const otherMember = (conv: Conversation) => conv.members.find(m => m.id !== profile.id)

  const renderContent = (content: string) => {
    if (!content) return null
    const parts = content.split(/(@\w+)/g)
    return parts.map((part, i) =>
      part.startsWith("@") ? (
        <span key={i} className="font-bold text-yellow-300 bg-yellow-500/10 px-0.5 rounded">{part}</span>
      ) : part
    )
  }

  const getReadByNames = (msg: Message) => {
    const readers = (msg.read_by || []).filter(id => id !== profile.id)
    return readers.map(id => {
      const m = members.find(x => x.id === id)
      return m?.nom || id
    })
  }

  const filteredMessages = msgSearch
    ? messages.filter(m => m.content?.toLowerCase().includes(msgSearch.toLowerCase()))
    : messages

  const filteredConvs = conversations.filter(c =>
    c.name.toLowerCase().includes(convSearch.toLowerCase())
  )

  const membersNotInConv = members.filter(m =>
    m.id !== profile.id &&
    !conversations.some(c => c.type === "direct" && c.members.some(x => x.id === m.id))
  )

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0a0a0a]">

      {/* ── LEFT SIDEBAR ─────────────────────── */}
      <div className="w-72 flex flex-col border-r border-zinc-900 bg-[#111111] shrink-0">
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
            <input type="text" placeholder="Rechercher..." value={convSearch} onChange={e => setConvSearch(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConvs.length > 0 && (
            <div className="py-2">
              <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider px-4 pb-1">Conversations</p>
              {filteredConvs.map(conv => {
                const isActive = activeConv?.id === conv.id
                const other = conv.type === "direct" ? otherMember(conv) : null
                return (
                  <div key={conv.id}
                    className={`relative group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isActive ? "bg-yellow-500/10 border-r-2 border-yellow-500" : "hover:bg-zinc-800/50"}`}
                    onClick={() => openConversation(conv)}>
                    {conv.type === "group"
                      ? <div className="w-9 h-9 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center shrink-0"><Users size={14} className="text-zinc-300" /></div>
                      : <Avatar nom={other?.nom || conv.name} url={other?.avatar_url} size={36} />}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className={`text-sm font-semibold truncate ${isActive ? "text-yellow-400" : "text-white"}`}>{conv.name}</span>
                        {conv.last_message_at && <span className="text-[10px] text-zinc-600 shrink-0 ml-1">{formatTime(conv.last_message_at)}</span>}
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
                    <button onClick={(e) => deleteConversation(conv.id, e)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 flex items-center justify-center transition-all">
                      <X size={11} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {membersNotInConv.length > 0 && (
            <div className="py-2 border-t border-zinc-900">
              <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider px-4 pb-1">Démarrer une conv.</p>
              {membersNotInConv.filter(m => m.nom.toLowerCase().includes(convSearch.toLowerCase())).map(m => (
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

          {loading && <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>}
        </div>
      </div>

      {/* ── RIGHT AREA ──────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
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
              {activeConv.type === "group"
                ? <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center shrink-0"><Users size={16} className="text-zinc-300" /></div>
                : <Avatar nom={otherMember(activeConv)?.nom || activeConv.name} url={otherMember(activeConv)?.avatar_url} size={36} />}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{activeConv.name}</p>
                {activeConv.type === "group" && (
                  <p className="text-zinc-500 text-[11px] truncate">{activeConv.members.length} membres · {activeConv.members.map(m => m.nom).join(", ")}</p>
                )}
              </div>
              {/* Search toggle */}
              <button onClick={(e) => { e.stopPropagation(); setShowMsgSearch(p => !p); setMsgSearch("") }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showMsgSearch ? "bg-yellow-500/20 text-yellow-400" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}>
                <Search size={14} />
              </button>
            </div>

            {/* Message search bar */}
            {showMsgSearch && (
              <div className="px-4 py-2 border-b border-zinc-900 bg-[#0f0f0f]">
                <div className="relative">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input autoFocus value={msgSearch} onChange={e => setMsgSearch(e.target.value)}
                    placeholder="Rechercher dans les messages..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50" />
                  {msgSearch && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px]">
                      {filteredMessages.length} résultat{filteredMessages.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1" onClick={() => { setEmojiPickerFor(null); setReadByPopup(null) }}>
              {filteredMessages.length === 0 && (
                <div className="text-center py-12 text-zinc-700">
                  <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">{msgSearch ? "Aucun message trouvé" : "Début de la conversation"}</p>
                </div>
              )}

              {filteredMessages.map((msg, idx) => {
                const isMe = msg.sender_id === profile.id
                const prevMsg = filteredMessages[idx - 1]
                const showAvatar = !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id)
                const showSender = !isMe && activeConv.type === "group" && showAvatar
                const isLastMine = isMe && (idx === filteredMessages.length - 1 || filteredMessages[idx + 1]?.sender_id !== profile.id)
                const readByNames = getReadByNames(msg)
                const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0

                // Highlight search match
                const isHighlighted = msgSearch && msg.content?.toLowerCase().includes(msgSearch.toLowerCase())

                return (
                  <div key={msg.id} className={`group flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${isHighlighted ? "bg-yellow-500/5 rounded-xl px-2 py-1 -mx-2" : ""}`}>
                    {/* Avatar placeholder */}
                    {!isMe && (
                      <div className="w-7 shrink-0 self-end mb-1">
                        {showAvatar && <Avatar nom={msg.sender_nom} size={28} />}
                      </div>
                    )}

                    <div className={`max-w-[65%] flex flex-col ${isMe ? "items-end" : "items-start"} relative`}>
                      {showSender && <p className="text-[10px] text-zinc-500 mb-1 ml-1">{msg.sender_nom}</p>}

                      {/* Reply preview */}
                      {msg.reply_to_id && msg.reply_preview && (
                        <div className={`flex items-start gap-1.5 mb-1 max-w-full px-2 py-1 rounded-lg border-l-2 border-zinc-600 bg-zinc-800/60 text-[11px] text-zinc-400 ${isMe ? "self-end" : "self-start"}`}>
                          <CornerUpLeft size={10} className="shrink-0 mt-0.5 text-zinc-600" />
                          <span className="truncate max-w-[180px]">{msg.reply_preview}</span>
                        </div>
                      )}

                      {/* Bubble */}
                      <div className={`relative px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        isMe ? "bg-yellow-500 text-black rounded-br-sm" : "bg-zinc-800 text-white rounded-bl-sm"
                      }`}>
                        {msg.content && <span>{renderContent(msg.content)}</span>}
                        {msg.file_url && <FilePreview url={msg.file_url} type={msg.file_type} name={msg.file_name} size={msg.file_size} />}

                        {/* Hover actions */}
                        <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "-left-20" : "-right-20"} hidden group-hover:flex items-center gap-1 z-10`}>
                          {/* Emoji trigger */}
                          <button onClick={(e) => { e.stopPropagation(); setEmojiPickerFor(emojiPickerFor === msg.id ? null : msg.id) }}
                            className="w-7 h-7 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center hover:bg-zinc-700 transition-colors">
                            <Smile size={12} className="text-zinc-400" />
                          </button>
                          {/* Reply */}
                          <button onClick={(e) => { e.stopPropagation(); setReplyTo(msg); inputRef.current?.focus() }}
                            className="w-7 h-7 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center hover:bg-zinc-700 transition-colors">
                            <Reply size={12} className="text-zinc-400" />
                          </button>
                        </div>

                        {/* Emoji picker */}
                        {emojiPickerFor === msg.id && (
                          <div className={`absolute ${isMe ? "right-0" : "left-0"} -top-12 flex gap-1 bg-zinc-800 border border-zinc-700 rounded-xl p-1.5 shadow-xl z-20`}
                            onClick={e => e.stopPropagation()}>
                            {EMOJI_LIST.map(emoji => (
                              <button key={emoji} onClick={(e) => toggleReaction(msg, emoji, e)}
                                className="text-base hover:scale-125 transition-transform px-0.5">
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Reactions */}
                      {hasReactions && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                          {Object.entries(msg.reactions || {}).map(([emoji, users]) =>
                            (users as string[]).length > 0 && (
                              <button key={emoji} onClick={(e) => toggleReaction(msg, emoji, e)}
                                className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-colors ${
                                  (users as string[]).includes(profile.id)
                                    ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400"
                                    : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600"
                                }`}>
                                <span>{emoji}</span>
                                <span className="text-[10px] font-semibold">{(users as string[]).length}</span>
                              </button>
                            )
                          )}
                        </div>
                      )}

                      {/* Time + read status */}
                      <div className={`flex items-center gap-1 mt-0.5 ${isMe ? "flex-row-reverse" : ""}`}>
                        <p className="text-[10px] text-zinc-600">{formatTime(msg.created_at)}</p>
                        {isMe && isLastMine && (
                          <button onClick={(e) => { e.stopPropagation(); setReadByPopup(readByPopup === msg.id ? null : msg.id) }}
                            className="flex items-center gap-0.5">
                            {readByNames.length > 0
                              ? <CheckCheck size={11} className="text-yellow-500" />
                              : <Check size={11} className="text-zinc-600" />}
                          </button>
                        )}
                        {/* Read by popup */}
                        {readByPopup === msg.id && readByNames.length > 0 && (
                          <div className="absolute right-0 -bottom-8 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-[10px] text-zinc-300 whitespace-nowrap shadow-xl z-20"
                            onClick={e => e.stopPropagation()}>
                            Lu par : {readByNames.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* ── INPUT AREA ─────────────────── */}
            <div className="border-t border-zinc-900 bg-[#111111]">
              {/* Reply banner */}
              {replyTo && (
                <div className="flex items-center gap-2 px-4 pt-2 pb-1">
                  <div className="flex-1 flex items-start gap-2 bg-zinc-800/60 border-l-2 border-yellow-500 rounded-lg px-3 py-1.5">
                    <CornerUpLeft size={12} className="text-yellow-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-yellow-500 text-[10px] font-bold">{replyTo.sender_nom}</p>
                      <p className="text-zinc-400 text-xs truncate">{replyTo.content || "📎 Fichier"}</p>
                    </div>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white">
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Mentions dropdown */}
              {filteredMentions.length > 0 && (
                <div className="mx-4 mb-1 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl">
                  {filteredMentions.map(m => (
                    <button key={m.id} onClick={() => insertMention(m.nom)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-700 transition-colors text-left">
                      <Avatar nom={m.nom} url={m.avatar_url} size={24} />
                      <div>
                        <p className="text-white text-xs font-semibold">{m.nom}</p>
                      </div>
                      <AtSign size={10} className="text-zinc-500 ml-auto" />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 px-4 py-3">
                {/* File upload */}
                <button onClick={() => fileRef.current?.click()}
                  disabled={uploadingFile}
                  className="w-9 h-9 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl flex items-center justify-center transition-colors shrink-0">
                  {uploadingFile
                    ? <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                    : <Paperclip size={14} className="text-zinc-400" />}
                </button>
                <input ref={fileRef} type="file" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />

                <div className="flex-1 relative">
                  <input ref={inputRef} type="text" value={input}
                    onChange={e => handleInputChange(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder={`Écrire à ${activeConv.name}... (@ pour mentionner)`}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 transition-colors pr-10" />
                  {/* @ shortcut */}
                  <button onClick={() => { setInput(p => p + "@"); inputRef.current?.focus(); setMentionSearch("") }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                    <AtSign size={13} />
                  </button>
                </div>

                <button onClick={sendMessage} disabled={!input.trim() || sending}
                  className="w-10 h-10 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black rounded-full flex items-center justify-center transition-colors shrink-0 shadow-lg shadow-yellow-500/20">
                  {sending
                    ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    : <Send size={15} />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showGroupModal && (
        <GroupModal members={members} currentUser={profile}
          onClose={() => setShowGroupModal(false)} onCreated={createGroup} />
      )}
    </div>
  )
}
