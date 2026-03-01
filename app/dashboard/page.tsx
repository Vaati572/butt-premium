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
import ParametresModule from "@/components/parametres/ParametresModule"

const ADMIN_PIN = "18072209"

type PresenceStatus = "online" | "busy" | "away" | "meeting" | "offline"

interface OnlineUser {
  id: string; nom: string; avatar_url?: string; color?: string
  status: PresenceStatus
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
    { id: "accueil",    label: "Accueil",           icon: "🏠" },
    { id: "vente",      label: "Vente",             icon: "🛒" },
    { id: "clients",    label: "Clients",           icon: "👤" },
    { id: "stocks",     label: "Stock",             icon: "📦" },
  ]},
  { section: "Gestion", items: [
    { id: "commandes",  label: "Commandes",         icon: "📋" },
    { id: "depenses",   label: "Dépenses & Offerts",icon: "💸" },
    { id: "contrats",   label: "Contrats",          icon: "📑" },
    { id: "pharmacies", label: "Pharmacies",        icon: "🏥" },
  ]},
  { section: "Analyse", items: [
    { id: "stats",      label: "Statistiques",      icon: "📊" },
    { id: "historique", label: "Historique",        icon: "🕓" },
  ]},
  { section: "Outils", items: [
    { id: "messages",   label: "Messages",          icon: "💬" },
    { id: "notes",      label: "Notes",             icon: "📝" },
    { id: "documents",  label: "Documents",         icon: "📁" },
  ]},
  { section: "Système", items: [
    { id: "admin",      label: "Admin",             icon: "🔒" },
    { id: "parametres", label: "Paramètres",        icon: "⚙️" },
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
   INNER DASHBOARD — uses UserSettingsContext
══════════════════════════════════════════════ */
function InnerDashboard({ profile, activeSociety }: { profile: any; activeSociety: any }) {
  const { settings, updateSetting } = useUserSettings()
  const [activeTab, setActiveTab] = useState(settings.start_page || "vente")
  const [myStatus, setMyStatus] = useState<PresenceStatus>("online")
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const ACCENT = settings.accent_color || "#eab308"
  const BG = settings.background || "#0a0a0a"
  const SIDEBAR_BG = settings.sidebar_accent ? ACCENT + "15" : "#0d0d0d"

  // Apply start_page when settings load
  useEffect(() => {
    if (settings.start_page) setActiveTab(settings.start_page)
  }, [settings.start_page])

  // Presence setup
  useEffect(() => {
    if (!profile || !activeSociety) return
    const setup = async () => {
      await supabase.from("user_presence").upsert({
        user_id: profile.id, society_id: activeSociety.id,
        status: "online", last_seen: new Date().toISOString(),
      }, { onConflict: "user_id" })
      setMyStatus("online")
      heartbeatRef.current = setInterval(() => {
        supabase.from("user_presence").update({ last_seen: new Date().toISOString() }).eq("user_id", profile.id)
      }, 30000)
      loadUsers()
      const ch = supabase.channel(`presence_${activeSociety.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, loadUsers)
        .subscribe()
      return () => supabase.removeChannel(ch)
    }
    const cleanup = setup()
    const bye = () => supabase.from("user_presence").update({ status: "offline" }).eq("user_id", profile.id)
    window.addEventListener("beforeunload", bye)
    return () => {
      cleanup.then(fn => fn?.())
      window.removeEventListener("beforeunload", bye)
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    }
  }, [profile, activeSociety])

  // Unread messages
  useEffect(() => {
    if (!profile || !activeSociety) return
    const count = async () => {
      const { count: c } = await supabase.from("messages").select("*", { count: "exact", head: true })
        .eq("society_id", activeSociety.id).not("read_by", "cs", `{${profile.id}}`).neq("sender_id", profile.id)
      setUnreadMessages(c || 0)
    }
    count()
    const ch = supabase.channel(`unread_${profile.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, count).subscribe()
    return () => supabase.removeChannel(ch)
  }, [profile, activeSociety])

  // Close status menu on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) setShowStatusMenu(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  // Keyboard shortcuts
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

  // Filter out hidden tabs
  const visibleNav = ALL_NAV.map(section => ({
    ...section,
    items: section.items.filter(tab => !settings.hidden_tabs.includes(tab.id))
  })).filter(section => section.items.length > 0)

  const myCfg = PRESENCE[myStatus]
  const onlineCount = onlineUsers.filter(u => u.status !== "offline").length

  const renderContent = () => {
    switch (activeTab) {
      case "accueil":   return <AccueilModule         activeSociety={activeSociety} profile={profile} />
      case "clients":   return <ClientsModule         activeSociety={activeSociety} profile={profile} />
      case "stocks":    return <StocksModule          activeSociety={activeSociety} profile={profile} />
      case "vente":     return <VenteModule           activeSociety={activeSociety} profile={profile} />
      case "depenses":  return <DepensesOffertsModule activeSociety={activeSociety} profile={profile} />
      case "stats":     return <StatsModule           activeSociety={activeSociety} profile={profile} />
      case "messages":  return <MessagesModule        activeSociety={activeSociety} profile={profile} />
      case "parametres":return <ParametresModule      activeSociety={activeSociety} profile={profile} />
      case "admin":     return <AdminGate             activeSociety={activeSociety} profile={profile} />
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

  // Font size applied inline
  const fontSizeMap = { small: "13px", normal: "14px", large: "16px" }
  const baseFontSize = fontSizeMap[settings.font_size as keyof typeof fontSizeMap] || "14px"

  // Card radius
  const radiusMap = { rounded: "12px", sharp: "4px", pill: "20px" }
  const cardRadius = radiusMap[settings.card_style as keyof typeof radiusMap] || "12px"

  return (
    <div className="min-h-screen text-white flex" style={{ backgroundColor: BG, fontSize: baseFontSize, ["--card-radius" as any]: cardRadius }}>

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside className="w-56 border-r border-zinc-900 flex flex-col shrink-0 transition-colors duration-300" style={{ backgroundColor: SIDEBAR_BG }}>

        {/* Logo */}
        <div className="px-4 pt-4 pb-3.5 border-b border-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
              style={{ backgroundColor: ACCENT, boxShadow: `0 4px 12px ${ACCENT}40` }}>
              <span className="text-black font-black text-sm">B</span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight">Butt Premium</p>
              {activeSociety && (
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: activeSociety.color || ACCENT }} />
                  <p className="text-zinc-500 text-[10px] truncate">{activeSociety.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-3">
          {visibleNav.map(({ section, items }) => (
            <div key={section}>
              <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest px-2 mb-1">{section}</p>
              {items.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 group relative mb-0.5`}
                    style={{
                      backgroundColor: isActive ? ACCENT + "18" : undefined,
                      color: isActive ? ACCENT : "#71717a",
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#e4e4e7" }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#71717a" }}>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3.5 rounded-full" style={{ backgroundColor: ACCENT }} />
                    )}
                    <span className="text-sm">{tab.icon}</span>
                    <span className="flex-1 truncate">{tab.label}</span>
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

        {/* Équipe en ligne */}
        {onlineUsers.length > 0 && (
          <div className="border-t border-zinc-900 px-2 pt-2 pb-1">
            <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest px-2 mb-1.5">
              Équipe · <span className={onlineCount > 0 ? "text-green-500" : "text-zinc-600"}>
                {onlineCount > 0 ? `${onlineCount} en ligne` : "hors ligne"}
              </span>
            </p>
            <div className="space-y-0.5 max-h-32 overflow-y-auto">
              {onlineUsers.map(u => (
                <button key={u.id} onClick={() => setActiveTab("messages")}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800/50 transition-colors group text-left">
                  <div className="relative shrink-0">
                    <UserAvatar nom={u.nom} url={u.avatar_url} color={u.color} size={24} />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${PRESENCE[u.status].dot} ring-1 ring-[#0d0d0d]`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-400 text-[11px] font-medium truncate group-hover:text-zinc-200 transition-colors">{u.nom}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mon profil + statut */}
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

      {/* ── MAIN ─────────────────────────────── */}
      <main className="flex-1 overflow-hidden flex flex-col" style={{ backgroundColor: BG }}>
        {renderContent()}
      </main>
    </div>
  )
}

/* ══════════════════════════════════════════════
   ROOT — charge session puis wrap avec provider
══════════════════════════════════════════════ */
export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeSociety, setActiveSociety] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/"); return }
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
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

  if (!profile) return null

  return (
    <UserSettingsProvider userId={profile.id}>
      <InnerDashboard profile={profile} activeSociety={activeSociety} />
    </UserSettingsProvider>
  )
}