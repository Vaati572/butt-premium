"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { UserSettingsProvider, useUserSettings } from "@/lib/UserSettingsContext"
import ClientsModule from "@/components/clients/ClientsModule"
import StocksModule from "@/components/stocks/StocksModule"
import VenteModule from "@/components/vente/VenteModule"
import AdminModule from "@/components/admin/AdminModule"
import AccueilModule from "@/components/accueil/AccueilModule"
import DepensesOffertsModule from "@/components/depenses/DepensesModule"
import StatsModule from "@/components/stats/StatsModule"
import MessagesModule from "@/components/messages/MessagesModule"
import ProspectsModule from "@/components/prospects/ProspectsModule"
import NotesModule from "@/components/notes/NotesModule"
import DocumentsModule from "@/components/documents/DocumentsModule"
import HistoriqueModule from "@/components/historique/HistoriqueModule"
import ContratsModule from "@/components/contrats/ContratsModule"
import PharmaciesModule from "@/components/pharmacies/PharmaciesModule"
import CommandesModule from "@/components/commandes/CommandesModule"
import TourneesModule from "@/components/tournees/TourneesModule"
import ConventionModule from "@/components/conventions/ConventionModule"
import PlaylistsModule from "@/components/playlists/PlaylistsModule"
import MapModule from "@/components/map/MapModule"
import ParametresModule from "@/components/parametres/ParametresModule"
import IAModule from "@/components/IAModule" // ← AJOUT

const ADMIN_PIN = "18072209"

type PresenceStatus = "online" | "busy" | "away" | "meeting" | "offline"

interface OnlineUser {
  id: string; nom: string; avatar_url?: string; color?: string
  status: PresenceStatus
}

interface UnreadNotif {
  sender_nom: string
  content: string
  file_name?: string | null
  conv_name: string
  conv_id: string
  count: number
}

const PRESENCE: Record<PresenceStatus, { label: string; color: string; dot: string }> = {
  online:  { label: "En ligne",   color: "text-green-400",  dot: "bg-green-400"  },
  busy:    { label: "Occupé",     color: "text-red-400",    dot: "bg-red-400"    },
  away:    { label: "Absent",     color: "text-yellow-400", dot: "bg-yellow-400" },
  meeting: { label: "En réunion", color: "text-purple-400", dot: "bg-purple-400" },
  offline: { label: "Hors ligne", color: "text-zinc-500",   dot: "bg-zinc-600"   },
}

const ALL_NAV = [
  { section: "Principal", items: [
    { id: "accueil",     label: "Accueil",           icon: "🏠" },
    { id: "vente",       label: "Vente",             icon: "🛒" },
    { id: "conventions", label: "Conventions",       icon: "🎪" },
    { id: "clients",     label: "Clients",           icon: "👤" },
    { id: "playlists",   label: "Playlists clients", icon: "🎵" },
    { id: "stocks",      label: "Stock",             icon: "📦" },
  ]},
  { section: "Gestion", items: [
    { id: "commandes",  label: "Fournisseurs",        icon: "🏭" },
    { id: "depenses",   label: "Dépenses & Offerts", icon: "💸" },
    { id: "contrats",   label: "Contrats",           icon: "📑" },
    { id: "pharmacies", label: "Pharmacies",         icon: "🏥" },
  ]},
  { section: "Analyse", items: [
    { id: "stats",      label: "Statistiques",       icon: "📊" },
    { id: "historique", label: "Historique",         icon: "🕓" },
  ]},
  { section: "Outils", items: [
    { id: "messages",   label: "Messages",           icon: "💬" },
    { id: "notes",      label: "Notes",              icon: "📝" },
    { id: "documents",  label: "Documents",          icon: "📁" },
  ]},
  { section: "Démarchage", items: [
    { id: "prospects",  label: "Prospects",          icon: "🎯" },
    { id: "tournees",   label: "Tournées",           icon: "🛣️" },
    { id: "map",        label: "Map & Tournées",     icon: "🗺️" },
    { id: "ia",         label: "IA",                 icon: "🤖" }, // ← AJOUT
  ]},
  { section: "Système", items: [
    { id: "admin",      label: "Admin",              icon: "🔒" },
    { id: "parametres", label: "Paramètres",         icon: "⚙️" },
  ]},
]

/* ── ADMIN GATE ─────────────────────────────── */
function AdminGate({ activeSociety, profile }: { activeSociety: any; profile: any }) {
  const [pin, setPin] = useState(""); const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState(false); const [shake, setShake] = useState(false)
  const handle = (d: string) => {
    if (pin.length >= 8) return
    const next = pin + d; setPin(next); setError(false)
    if (next.length === 8) {
      if (next === ADMIN_PIN) setUnlocked(true)
      else { setShake(true); setError(true); setTimeout(() => { setPin(""); setShake(false) }, 600) }
    }
  }
  if (unlocked) return <AdminModule activeSociety={activeSociety} profile={profile} />
  return (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
      <div className={`bg-[#111111] border border-zinc-800 rounded-3xl p-8 w-80 text-center shadow-2xl ${shake ? "animate-bounce" : ""}`}>
        <p className="text-2xl mb-1">🔒</p>
        <p className="text-white font-bold text-lg mb-1">Panneau Admin</p>
        <p className="text-zinc-500 text-xs mb-6">Entrez le code PIN administrateur</p>
        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full ${i < pin.length ? (error ? "bg-red-500" : "bg-yellow-500") : "bg-zinc-700"}`} />
          ))}
        </div>
        {error && <p className="text-red-400 text-xs mb-3 font-semibold">Code incorrect</p>}
        <div className="grid grid-cols-3 gap-3">
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
            <button key={i} onClick={() => d === "⌫" ? setPin(p => p.slice(0,-1)) : d ? handle(d) : null}
              className={`h-14 rounded-2xl text-lg font-bold transition-all ${d === "⌫" ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-400" : d === "" ? "invisible" : "bg-zinc-800 hover:bg-yellow-500 hover:text-black text-white active:scale-95"}`}>
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function UserAvatar({ nom, url, color, size = 30 }: { nom: string; url?: string; color?: string; size?: number }) {
  const colors = ["#d97706","#b45309","#f59e0b","#92400e"]
  const bg = color || colors[(nom?.charCodeAt(0) || 0) % colors.length]
  const initials = nom?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"
  return (
    <div className="rounded-full overflow-hidden flex items-center justify-center text-black font-bold shrink-0"
      style={{ width: size, height: size, backgroundColor: url ? undefined : bg, fontSize: size * 0.35 }}>
      {url ? <img src={url} className="w-full h-full object-cover" alt={nom} /> : initials}
    </div>
  )
}

/* ══════════════════════════════════════════════
   UNREAD MESSAGES POPUP
══════════════════════════════════════════════ */
function UnreadMessagesPopup({ notifs, onGoToMessages, onClose, ACCENT }: {
  notifs: UnreadNotif[]
  onGoToMessages: () => void
  onClose: () => void
  ACCENT: string
}) {
  const total = notifs.reduce((sum, n) => sum + n.count, 0)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const duration = 8000
    const interval = 50
    const step = (interval / duration) * 100
    const timer = setInterval(() => {
      setProgress(p => {
        if (p <= 0) { clearInterval(timer); onClose(); return 0 }
        return p - step
      })
    }, interval)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-80">
      <div className="bg-[#18181b] border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden"
        style={{ boxShadow: `0 8px 40px ${ACCENT}20, 0 0 0 1px ${ACCENT}15` }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80"
          style={{ background: `linear-gradient(135deg, ${ACCENT}15, transparent)` }}>
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: ACCENT + "20", border: `1px solid ${ACCENT}30` }}>
                💬
              </div>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-black text-[9px] font-black flex items-center justify-center"
                style={{ backgroundColor: ACCENT }}>
                {total > 9 ? "9+" : total}
              </span>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Messages non lus</p>
              <p className="text-zinc-400 text-[11px]">{total} message{total > 1 ? "s" : ""} pendant votre absence</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-white transition-colors shrink-0">
            ✕
          </button>
        </div>
        <div className="max-h-56 overflow-y-auto divide-y divide-zinc-800/50">
          {notifs.slice(0, 5).map((n, i) => (
            <div key={i} className="px-4 py-2.5 hover:bg-zinc-800/30 transition-colors cursor-default">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-black font-bold text-[11px] shrink-0 mt-0.5"
                  style={{ backgroundColor: ACCENT }}>
                  {n.sender_nom?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-white text-xs font-semibold truncate">{n.sender_nom}</p>
                    {n.count > 1 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: ACCENT + "20", color: ACCENT }}>
                        {n.count} msg
                      </span>
                    )}
                  </div>
                  {n.conv_name !== n.sender_nom && (
                    <p className="text-zinc-600 text-[10px] truncate">dans {n.conv_name}</p>
                  )}
                  <p className="text-zinc-400 text-[11px] truncate mt-0.5">
                    {n.content ? `"${n.content.slice(0, 50)}${n.content.length > 50 ? "…" : ""}"` : n.file_name ? `📎 ${n.file_name}` : "Nouveau message"}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {notifs.length > 5 && (
            <div className="px-4 py-2 text-center">
              <p className="text-zinc-600 text-[10px]">+ {notifs.length - 5} autre{notifs.length - 5 > 1 ? "s" : ""} conversation{notifs.length - 5 > 1 ? "s" : ""}</p>
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-zinc-800/80 flex gap-2">
          <button onClick={onGoToMessages}
            className="flex-1 py-2 rounded-xl text-black font-bold text-xs transition-all hover:brightness-110 active:scale-95"
            style={{ backgroundColor: ACCENT }}>
            Voir les messages →
          </button>
          <button onClick={onClose}
            className="px-3 py-2 rounded-xl text-zinc-400 font-medium text-xs bg-zinc-800 hover:bg-zinc-700 transition-colors">
            Plus tard
          </button>
        </div>
        <div className="h-0.5 bg-zinc-800">
          <div className="h-full rounded-full transition-all duration-50"
            style={{ width: `${progress}%`, backgroundColor: ACCENT }} />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   INNER DASHBOARD
══════════════════════════════════════════════ */
/* ── ACCESS DENIED PANEL ──────────────────────────────── */
function AccessDeniedPanel({ tabLabel }: { tabLabel: string }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center p-8 max-w-sm">
        <div className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">🚫</span>
        </div>
        <h2 className="text-white text-xl font-bold mb-2">Accès non autorisé</h2>
        <p className="text-zinc-500 text-sm mb-4">
          Tu n&apos;as pas la permission d&apos;accéder à l&apos;onglet{" "}
          <span className="text-red-400 font-semibold">&quot;{tabLabel}&quot;</span>.
        </p>
        <p className="text-zinc-700 text-xs">Contacte un administrateur pour obtenir l&apos;accès.</p>
      </div>
    </div>
  )
}

function InnerDashboard({ profile, activeSociety }: { profile: any; activeSociety: any }) {
  const { settings } = useUserSettings()
  const [activeTab, setActiveTab]           = useState(settings.start_page || "vente")
  const [myStatus, setMyStatus]             = useState<PresenceStatus>("online")
  const [onlineUsers, setOnlineUsers]       = useState<OnlineUser[]>([])
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [sidebarOpen, setSidebarOpen]       = useState(false)
  const [focusProspect, setFocusProspect]   = useState<any>(null)
  const [activeConvention, setActiveConvention] = useState<any>(null)
  const [showConvPopup, setShowConvPopup]   = useState(false)
  const [activeTournee, setActiveTournee]   = useState<any>(null)
  const [unreadNotifs, setUnreadNotifs]     = useState<UnreadNotif[]>([])
  const [showUnreadPopup, setShowUnreadPopup] = useState(false)

  const heartbeatRef  = useRef<NodeJS.Timeout | null>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)
  const router        = useRouter()

  const ACCENT      = settings.accent_color || "#eab308"
  const BG          = settings.background   || "#0a0a0a"
  const SIDEBAR_BG  = settings.sidebar_accent ? ACCENT + "15" : "#0d0d0d"
  const APP_THEME   = (settings as any).app_theme  || "1"
  const BG_GRADIENT = (settings as any).bg_gradient || ""

  useEffect(() => {
    if (settings.start_page) setActiveTab(settings.start_page)
  }, [settings.start_page])

  useEffect(() => {
    if (!activeSociety) return
    // Check conventions that are ACTUALLY running today (based on real dates, not just statut)
    const todayStr = new Date().toISOString().split("T")[0]
    supabase.from("conventions")
      .select("*").eq("society_id", activeSociety.id)
      .lte("date_debut", todayStr)
      .gte("date_fin", todayStr)
      .order("date_debut", { ascending: false })
      .limit(1).single()
      .then(({ data }) => { if (data) { setActiveConvention(data); setShowConvPopup(true) } })
  }, [activeSociety])

  useEffect(() => {
    if (!profile || !activeSociety) return
    const check = async () => {
      const { data: convs } = await supabase.from("conversations")
        .select("id, name, type, member_ids")
        .eq("society_id", activeSociety.id)
        .contains("member_ids", [profile.id])
      if (!convs || convs.length === 0) return

      const allMemberIds = [...new Set(convs.flatMap((c: any) => c.member_ids || []))]
      const { data: memberProfiles } = await supabase.from("profiles")
        .select("id, nom").in("id", allMemberIds)
      const profileMap: Record<string, string> = {}
      ;(memberProfiles || []).forEach((p: any) => { profileMap[p.id] = p.nom })

      const notifs: UnreadNotif[] = []

      await Promise.all(convs.map(async (conv: any) => {
        const { data: unreadMsgs } = await supabase.from("messages")
          .select("id, sender_nom, sender_id, content, file_name")
          .eq("conversation_id", conv.id)
          .not("read_by", "cs", `{${profile.id}}`)
          .neq("sender_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(20)

        if (!unreadMsgs || unreadMsgs.length === 0) return

        let convName = conv.name
        if (conv.type === "direct" && !conv.name) {
          const otherId = (conv.member_ids || []).find((id: string) => id !== profile.id)
          convName = otherId ? profileMap[otherId] || "Conversation directe" : "Conversation directe"
        }

        const bySender: Record<string, { nom: string; msgs: typeof unreadMsgs }> = {}
        unreadMsgs.forEach((m: any) => {
          if (!bySender[m.sender_id]) bySender[m.sender_id] = { nom: m.sender_nom, msgs: [] }
          bySender[m.sender_id].msgs.push(m)
        })

        Object.values(bySender).forEach(({ nom, msgs }) => {
          notifs.push({
            sender_nom: nom,
            content: msgs[0].content || "",
            file_name: msgs[0].file_name,
            conv_name: convName,
            conv_id: conv.id,
            count: msgs.length,
          })
        })
      }))

      if (notifs.length > 0) {
        setTimeout(() => { setUnreadNotifs(notifs); setShowUnreadPopup(true) }, 1200)
      }
    }
    check()
  }, [profile, activeSociety])

  useEffect(() => {
    if (!profile || !activeSociety) return
    let channel: ReturnType<typeof supabase.channel> | null = null
    supabase.from("user_presence").upsert({
      user_id: profile.id, society_id: activeSociety.id,
      status: "online", last_seen: new Date().toISOString(),
    }, { onConflict: "user_id" }).then(() => { setMyStatus("online"); loadUsers() })

    heartbeatRef.current = setInterval(() => {
      supabase.from("user_presence").update({ last_seen: new Date().toISOString() }).eq("user_id", profile.id)
    }, 30000)

    channel = supabase.channel(`presence_${activeSociety.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, loadUsers)
      .subscribe()

    const bye = () => { supabase.from("user_presence").update({ status: "offline" }).eq("user_id", profile.id) }
    window.addEventListener("beforeunload", bye)
    return () => {
      if (channel) supabase.removeChannel(channel)
      window.removeEventListener("beforeunload", bye)
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    }
  }, [profile, activeSociety])

  useEffect(() => {
    if (!profile || !activeSociety) return
    const countUnread = () => {
      supabase.from("messages").select("*", { count: "exact", head: true })
        .eq("society_id", activeSociety.id)
        .not("read_by", "cs", `{${profile.id}}`)
        .neq("sender_id", profile.id)
        .then(({ count: c }) => setUnreadMessages(c || 0))
    }
    countUnread()
    const ch = supabase.channel(`unread_${profile.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, countUnread)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [profile, activeSociety])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) setShowStatusMenu(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const map: Record<string, string> = {
        [settings.shortcut_vente]:      "vente",
        [settings.shortcut_clients]:    "clients",
        [settings.shortcut_stocks]:     "stocks",
        [settings.shortcut_stats]:      "stats",
        [settings.shortcut_messages]:   "messages",
        [settings.shortcut_notes]:      "notes",
        [settings.shortcut_parametres]: "parametres",
      }
      const target = map[e.key]
      if (target) { e.preventDefault(); setActiveTab(target) }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [settings])

  const loadUsers = async () => {
    const [{ data: members }, { data: presences }] = await Promise.all([
      supabase.from("profiles").select("id, nom, avatar_url, color").eq("society_id", activeSociety.id),
      supabase.from("user_presence").select("*").eq("society_id", activeSociety.id),
    ])
    const ORDER: Record<PresenceStatus, number> = { online: 0, meeting: 1, busy: 2, away: 3, offline: 4 }
    const users: OnlineUser[] = (members || [])
      .filter(m => m.id !== profile.id)
      .map(m => {
        const p = presences?.find(x => x.user_id === m.id)
        const minsAgo = p ? (Date.now() - new Date(p.last_seen).getTime()) / 60000 : 999
        const status: PresenceStatus = !p ? "offline" : minsAgo > 2 ? "offline" : p.status
        return { id: m.id, nom: m.nom, avatar_url: m.avatar_url, color: m.color, status }
      })
      .sort((a, b) => (ORDER[a.status] ?? 5) - (ORDER[b.status] ?? 5))
    setOnlineUsers(users)
  }

  const updateStatus = async (s: PresenceStatus) => {
    setMyStatus(s); setShowStatusMenu(false)
    await supabase.from("user_presence").update({ status: s, last_seen: new Date().toISOString() }).eq("user_id", profile.id)
  }

  const logout = async () => {
    if (profile) await supabase.from("user_presence").update({ status: "offline" }).eq("user_id", profile.id)
    if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    await supabase.auth.signOut(); router.push("/")
  }

  // ALL tabs visible — restricted ones shown in red with lock
  const visibleNav = ALL_NAV.map(section => ({
    ...section,
    items: section.items.map(tab => ({
      ...tab,
      restricted: settings.hidden_tabs.includes(tab.id),
    }))
  })).filter(section => section.items.length > 0)

  const myCfg       = PRESENCE[myStatus]
  const onlineCount = onlineUsers.filter(u => u.status !== "offline").length

  // ── RENDER CONTENT ──────────────────────────
  const allTabsFlat = ALL_NAV.flatMap(s => s.items)
  const activeTabMeta = allTabsFlat.find(t => t.id === activeTab)
  const isActiveTabRestricted = settings.hidden_tabs.includes(activeTab)

  const renderContent = () => {
    if (isActiveTabRestricted) return <AccessDeniedPanel tabLabel={activeTabMeta?.label || activeTab} />
    switch (activeTab) {
      case "accueil":    return <AccueilModule         activeSociety={activeSociety} profile={profile} />
      case "clients":    return <ClientsModule         activeSociety={activeSociety} profile={profile} />
      case "conventions":return <ConventionModule      activeSociety={activeSociety} profile={profile} />
      case "stocks":     return <StocksModule          activeSociety={activeSociety} profile={profile} />
      case "vente":      return <VenteModule           activeSociety={activeSociety} profile={profile} />
      case "depenses":   return <DepensesOffertsModule activeSociety={activeSociety} profile={profile} />
      case "stats":      return <StatsModule           activeSociety={activeSociety} profile={profile} />
      case "notes":      return <NotesModule           activeSociety={activeSociety} profile={profile} />
      case "documents":  return <DocumentsModule       activeSociety={activeSociety} profile={profile} />
      case "historique": return <HistoriqueModule      activeSociety={activeSociety} profile={profile} />
      case "contrats":   return <ContratsModule        activeSociety={activeSociety} profile={profile} />
      case "pharmacies": return <PharmaciesModule      activeSociety={activeSociety} profile={profile} />
      case "commandes":  return <CommandesModule       activeSociety={activeSociety} profile={profile} />
      case "playlists":  return <PlaylistsModule       activeSociety={activeSociety} profile={profile} />
      case "tournees":   return <TourneesModule        activeSociety={activeSociety} profile={profile}
          onLaunchOnMap={(t: any) => setActiveTournee(t)}
          onSwitchToMap={() => setActiveTab("map")} />
      case "prospects":  return <ProspectsModule       activeSociety={activeSociety} profile={profile}
          onShowOnMap={(p: any) => setFocusProspect(p)}
          onSwitchToMap={() => setActiveTab("map")}
          onSwitchToTournees={() => setActiveTab("tournees")} />
      case "map":        return <MapModule             activeSociety={activeSociety} profile={profile}
          focusProspect={focusProspect}
          activeTournee={activeTournee}
          onClearFocus={() => { setFocusProspect(null); setActiveTournee(null) }}
          onSwitchToProspects={() => setActiveTab("prospects")} />
      case "messages":   return <MessagesModule        activeSociety={activeSociety} profile={profile} />
      case "parametres": return <ParametresModule      activeSociety={activeSociety} profile={profile} />
      case "admin":      return <AdminGate             activeSociety={activeSociety} profile={profile} />
      case "ia":         return <IAModule              activeSociety={activeSociety} profile={profile} />
      default: return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-5xl mb-4">🚧</p>
            <p className="text-white text-xl font-bold">{ALL_NAV.flatMap(s => s.items).find(t => t.id === activeTab)?.label}</p>
            <p className="text-zinc-500 text-sm mt-2">Module en cours de construction</p>
          </div>
        </div>
      )
    }
  }

  const fontSizeMap  = { small: "13px", normal: "14px", large: "16px" }
  const baseFontSize = fontSizeMap[settings.font_size as keyof typeof fontSizeMap] || "14px"
  const radiusMap    = { rounded: "12px", sharp: "4px", pill: "20px" }
  const cardRadius   = radiusMap[settings.card_style as keyof typeof radiusMap] || "12px"

  const unreadPopup = showUnreadPopup && unreadNotifs.length > 0 && (
    <UnreadMessagesPopup
      notifs={unreadNotifs}
      ACCENT={ACCENT}
      onGoToMessages={() => { setActiveTab("messages"); setShowUnreadPopup(false) }}
      onClose={() => setShowUnreadPopup(false)}
    />
  )

  if (APP_THEME === "2") return (
    <>
      <Theme2Layout
        activeSociety={activeSociety} profile={profile}
        activeTab={activeTab} setActiveTab={setActiveTab}
        visibleNav={visibleNav} renderContent={renderContent}
        ACCENT={ACCENT} BG={BG} BG_GRADIENT={BG_GRADIENT}
        baseFontSize={baseFontSize} cardRadius={cardRadius}
        unreadMessages={unreadMessages}
        sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
        onlineUsers={onlineUsers} onlineCount={onlineCount}
        myStatus={myStatus} showStatusMenu={showStatusMenu}
        setShowStatusMenu={setShowStatusMenu} statusMenuRef={statusMenuRef}
        logout={logout} showConvPopup={showConvPopup}
        setShowConvPopup={setShowConvPopup} activeConvention={activeConvention}
      />
      {unreadPopup}
    </>
  )

  return (
    <div className="h-screen text-white flex overflow-hidden"
      style={{ background: BG_GRADIENT || BG, fontSize: baseFontSize, ["--card-radius" as any]: cardRadius }}>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* DESKTOP sidebar */}
      <aside className="hidden md:flex w-56 border-r border-zinc-900 flex-col shrink-0 transition-colors duration-300 h-screen overflow-hidden"
        style={{ backgroundColor: SIDEBAR_BG }}>
        <div className="px-4 pt-3 pb-3 border-b border-zinc-900">
          <img src="/logo.png" alt="Butt Premium" className="h-10 w-auto" />
          {activeSociety && (
            <div className="flex items-center gap-1 mt-1.5">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: activeSociety.color || ACCENT }} />
              <p className="text-zinc-500 text-[10px] truncate">{activeSociety.name}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-3">
          {visibleNav.map(({ section, items }) => (
            <div key={section}>
              <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest px-2 mb-1">{section}</p>
              {items.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 group relative mb-0.5"
                    style={{
                      backgroundColor: isActive ? (tab.restricted ? "#ef444418" : ACCENT + "18") : undefined,
                      color: tab.restricted ? (isActive ? "#ef4444" : "#7f1d1d") : (isActive ? ACCENT : "#71717a")
                    }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; if (!isActive) { el.style.backgroundColor = tab.restricted ? "#ef444412" : ACCENT + "12"; el.style.color = tab.restricted ? "#ef4444" : ACCENT } }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; if (!isActive) { el.style.backgroundColor = ""; el.style.color = tab.restricted ? "#7f1d1d" : "#71717a" } }}>
                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3.5 rounded-full" style={{ backgroundColor: tab.restricted ? "#ef4444" : ACCENT }} />}
                    <span className="text-sm">{tab.icon}</span>
                    <span className="flex-1 truncate">{tab.label}</span>
                    {tab.restricted && <span className="text-[9px] text-red-500/70">🔒</span>}
                    {tab.id === "messages" && unreadMessages > 0 && (
                      <span className="text-black text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: ACCENT }}>
                        {unreadMessages > 9 ? "9+" : unreadMessages}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {onlineUsers.length > 0 && (
          <div className="border-t border-zinc-900 px-2 pt-2 pb-1">
            <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest px-2 mb-1.5">
              Équipe · <span className={onlineCount > 0 ? "text-green-500" : "text-zinc-600"}>
                {onlineCount > 0 ? `${onlineCount} en ligne` : "hors ligne"}
              </span>
            </p>
            <div className="space-y-0.5 max-h-24 overflow-y-auto">
              {onlineUsers.slice(0, 5).map(u => (
                <button key={u.id} onClick={() => setActiveTab("messages")}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800/50 transition-colors group text-left">
                  <div className="relative shrink-0">
                    <UserAvatar nom={u.nom} url={u.avatar_url} color={u.color} size={24} />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${PRESENCE[u.status].dot} ring-1 ring-[#0d0d0d]`} />
                  </div>
                  <p className="text-zinc-400 text-[11px] font-medium truncate group-hover:text-zinc-200 transition-colors">{u.nom}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-zinc-900 p-2">
          <div className="relative" ref={statusMenuRef}>
            <button onClick={() => setShowStatusMenu(p => !p)}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 transition-colors">
              <div className="relative shrink-0">
                <UserAvatar nom={profile?.nom || profile?.username || "?"} url={profile?.avatar_url} color={profile?.color} size={28} />
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${myCfg.dot} ring-1 ring-[#0d0d0d]`} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-white text-[11px] font-semibold truncate">{profile?.nom || profile?.username}</p>
                <p className={`text-[9px] font-medium ${myCfg.color}`}>{myCfg.label}</p>
              </div>
              <span className="text-zinc-700 text-[10px]">▾</span>
            </button>
            {showStatusMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1a1a1a] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider px-3 pt-2 pb-1">Mon statut</p>
                {(Object.entries(PRESENCE) as [PresenceStatus, typeof PRESENCE[PresenceStatus]][]).map(([s, cfg]) => (
                  <button key={s} onClick={() => updateStatus(s)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-800 transition-colors ${myStatus === s ? "bg-zinc-800/60" : ""}`}>
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-[13px] ${myStatus === s ? "text-white font-semibold" : "text-zinc-400"}`}>{cfg.label}</span>
                    {myStatus === s && <span className="ml-auto text-[11px] font-bold" style={{ color: ACCENT }}>✓</span>}
                  </button>
                ))}
                <div className="border-t border-zinc-800 mt-1">
                  <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors text-[13px]">
                    <span>→</span> Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MOBILE drawer */}
      {sidebarOpen && (
        <aside className="fixed top-0 left-0 h-full w-72 z-50 flex flex-col border-r border-zinc-900 md:hidden overflow-y-auto"
          style={{ backgroundColor: SIDEBAR_BG }}>
          <button onClick={() => setSidebarOpen(false)}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white text-lg">✕</button>
          <div className="px-4 pt-4 pb-3.5 border-b border-zinc-900">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Butt Premium" className="h-8 w-auto" />
              {activeSociety && <p className="text-zinc-500 text-[10px] mt-0.5">{activeSociety.name}</p>}
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-3">
            {visibleNav.map(({ section, items }) => (
              <div key={section}>
                <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest px-2 mb-1">{section}</p>
                {items.map(tab => {
                  const isActive = activeTab === tab.id
                  return (
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
                      className="w-full flex items-center gap-2 px-2.5 py-2.5 rounded-lg text-sm font-medium mb-0.5 relative"
                      style={{ backgroundColor: isActive ? ACCENT + "18" : undefined, color: isActive ? ACCENT : "#71717a" }}>
                      {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full" style={{ backgroundColor: ACCENT }} />}
                      <span className="text-base">{tab.icon}</span>
                      <span className="flex-1 truncate">{tab.label}</span>
                      {tab.id === "messages" && unreadMessages > 0 && (
                        <span className="text-black text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: ACCENT }}>{unreadMessages > 9 ? "9+" : unreadMessages}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </nav>
          <div className="border-t border-zinc-900 p-3">
            <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-zinc-900/80">
              <UserAvatar nom={profile?.nom || profile?.username || "?"} url={profile?.avatar_url} color={profile?.color} size={28} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{profile?.nom || profile?.username}</p>
                <p className="text-zinc-500 text-[10px]">En ligne</p>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* MAIN */}
      <main className="flex-1 overflow-hidden flex flex-col" style={{ backgroundColor: BG }}>
        <button onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-3 left-3 z-30 w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl shadow-xl border border-zinc-700"
          style={{ backgroundColor: SIDEBAR_BG }}>
          <span className="w-5 h-0.5 rounded-full" style={{ backgroundColor: ACCENT }} />
          <span className="w-5 h-0.5 rounded-full" style={{ backgroundColor: ACCENT }} />
          <span className="w-3.5 h-0.5 rounded-full" style={{ backgroundColor: ACCENT }} />
        </button>
        {renderContent()}

        {showConvPopup && activeConvention && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111111] border border-zinc-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="px-6 pt-6 pb-4 text-center" style={{ background: "linear-gradient(135deg, #eab30815, #eab30805)" }}>
                <div className="text-5xl mb-3">🎪</div>
                <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1 mb-3">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-xs font-bold">Convention en cours</span>
                </div>
                <h2 className="text-white font-bold text-xl">{activeConvention.nom}</h2>
                {activeConvention.lieu && <p className="text-zinc-500 text-sm mt-1">📍 {activeConvention.lieu}</p>}
              </div>
              <div className="px-6 py-4 space-y-3 border-t border-zinc-800">
                <div className="flex items-center justify-between bg-zinc-900 rounded-xl px-4 py-3">
                  <span className="text-zinc-500 text-sm">Début</span>
                  <span className="text-white text-sm font-semibold">
                    {new Date(activeConvention.date_debut + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-zinc-900 rounded-xl px-4 py-3">
                  <span className="text-zinc-500 text-sm">Fin</span>
                  <span className="text-white text-sm font-semibold">
                    {new Date(activeConvention.date_fin + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  </span>
                </div>
              </div>
              <div className="px-6 pb-6 space-y-2">
                <button onClick={() => { setShowConvPopup(false); setActiveTab("conventions") }}
                  className="w-full py-3 rounded-xl text-black font-bold text-sm transition-colors"
                  style={{ backgroundColor: ACCENT }}>📋 Aller à la convention</button>
                <button onClick={() => setShowConvPopup(false)}
                  className="w-full py-3 rounded-xl text-zinc-400 font-medium text-sm bg-zinc-900 hover:bg-zinc-800 transition-colors">
                  Continuer vers l'accueil
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {unreadPopup}
    </div>
  )
}

/* ══════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════ */
export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading]             = useState(true)
  const [activeSociety, setActiveSociety] = useState<any>(null)
  const [profile, setProfile]             = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/"); return }
      let { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
      if (!prof) {
        const nom = session.user.user_metadata?.full_name || session.user.user_metadata?.name
          || session.user.email?.split("@")[0] || "Utilisateur"
        const { data: soc } = await supabase.from("societies").select("id").limit(1).single()
        await supabase.from("profiles").insert({
          id: session.user.id, nom, email: session.user.email,
          society_id: soc?.id, role: "vendeur", is_active: true,
        })
        const { data: newProf } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
        prof = newProf
      }
      if (prof) setProfile({ ...prof, email: session.user.email })
      const { data: socs } = await supabase.from("societies").select("*").eq("active", true)
      if (socs?.length) setActiveSociety(socs[0])
      setLoading(false)
    }
    init()
  }, [router])

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
      <p className="text-white font-bold text-lg">Problème de chargement</p>
      <p className="text-zinc-500 text-sm">Votre profil n'a pas pu être chargé.</p>
      <button onClick={() => window.location.reload()}
        className="bg-yellow-500 text-black font-bold px-6 py-2.5 rounded-xl hover:bg-yellow-400 transition-colors">Réessayer</button>
      <button onClick={async () => { await supabase.auth.signOut(); router.push("/") }}
        className="text-zinc-500 text-sm hover:text-white transition-colors">Se déconnecter</button>
    </div>
  )

  return (
    <UserSettingsProvider userId={profile.id}>
      <InnerDashboard profile={profile} activeSociety={activeSociety} />
    </UserSettingsProvider>
  )
}

/* ══════════════════════════════════════════════
   THEME 2 — NEON
══════════════════════════════════════════════ */
function Theme2Layout({
  activeSociety, profile, activeTab, setActiveTab, visibleNav,
  renderContent, ACCENT, BG, BG_GRADIENT, baseFontSize, cardRadius,
  unreadMessages, sidebarOpen, setSidebarOpen,
  onlineUsers, onlineCount, myStatus, showStatusMenu,
  setShowStatusMenu, statusMenuRef, logout,
  showConvPopup, setShowConvPopup, activeConvention,
}: any) {
  const allTabs = visibleNav.flatMap((s: any) => s.items)
  const NEON = "#a855f7"

  return (
    <div className="h-screen text-white flex flex-col overflow-hidden"
      style={{ background: BG_GRADIENT || BG, fontSize: baseFontSize, ["--card-radius" as any]: cardRadius }}>

      <header className="shrink-0 border-b z-30"
        style={{ backgroundColor: BG === "#0a0a0a" ? "#08080f" : BG + "ee", borderColor: NEON + "30" }}>
        <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: NEON + "20" }}>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Butt Premium" className="h-8 w-auto" />
            {activeSociety && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: NEON + "15", border: `1px solid ${NEON}30` }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: NEON }} />
                <span className="text-xs font-bold" style={{ color: NEON }}>{activeSociety.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onlineCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-semibold">{onlineCount} en ligne</span>
              </div>
            )}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowStatusMenu(!showStatusMenu)}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-black"
                style={{ backgroundColor: NEON }}>
                {profile?.nom?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <span className="text-zinc-300 text-sm font-medium hidden sm:block">{profile?.nom}</span>
            </div>
            {showStatusMenu && (
              <div ref={statusMenuRef} className="absolute top-14 right-4 bg-zinc-900 border rounded-xl shadow-2xl z-50 overflow-hidden w-40"
                style={{ borderColor: NEON + "30" }}>
                <button onClick={() => { logout(); setShowStatusMenu(false) }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-sm">
                  🚪 Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>

        <nav className="flex overflow-x-auto gap-0.5 px-2 py-1.5 scrollbar-hide">
          {allTabs.map((tab: any) => {
            const isActive = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 relative"
                style={isActive
                  ? { backgroundColor: NEON + "20", color: NEON, border: `1px solid ${NEON}50` }
                  : { color: "#52525b", border: "1px solid transparent" }}>
                {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full" style={{ backgroundColor: NEON }} />}
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === "messages" && unreadMessages > 0 && (
                  <span className="text-black text-[9px] font-black min-w-[14px] h-3.5 px-1 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: NEON }}>
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col" style={{ backgroundColor: BG }}>
        {renderContent()}
      </main>

      {showConvPopup && activeConvention && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl w-full max-w-sm shadow-2xl p-6 border"
            style={{ backgroundColor: "#0d0d18", borderColor: NEON + "40", boxShadow: `0 0 40px ${NEON}20` }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎪</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: NEON }}>Convention en cours</p>
                <h2 className="text-white font-bold text-lg">{activeConvention.nom}</h2>
              </div>
            </div>
            {activeConvention.lieu && <p className="text-zinc-400 text-sm mb-4">📍 {activeConvention.lieu}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setShowConvPopup(false); setActiveTab("conventions") }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black" style={{ backgroundColor: NEON }}>
                📋 Aller à la convention
              </button>
              <button onClick={() => setShowConvPopup(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold bg-zinc-800 text-zinc-300">Plus tard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}