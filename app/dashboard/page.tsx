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
import AgendaModule from "@/components/agenda/AgendaModule"
import CommandesModule from "@/components/commandes/CommandesModule"
import TourneesModule from "@/components/tournees/TourneesModule"
import ConventionModule from "@/components/conventions/ConventionModule"
import PlaylistsModule from "@/components/playlists/PlaylistsModule"
import MapModule from "@/components/map/MapModule"
import ParametresModule from "@/components/parametres/ParametresModule"
import IAModule from "@/components/IAModule"
import FacturesDevisModule from "@/components/facturesdevis/FacturesDevisModule"
import SuiviModule from "@/components/suivi/SuiviModule"
import SocialProspectsModule from "@/components/social/SocialProspectsModule"
import TachesModule from "@/components/taches/TachesModule"
import ProspectionModule from "@/components/prospection/ProspectionModule"
import ProspectionModal from "@/components/formation/ProspectionModal"

const ADMIN_PIN = "18072209"

type PresenceStatus = "online" | "busy" | "away" | "meeting" | "offline"
interface OnlineUser { id: string; nom: string; avatar_url?: string; color?: string; status: PresenceStatus }
interface UnreadNotif { sender_nom: string; content: string; file_name?: string | null; conv_name: string; conv_id: string; count: number }

const PRESENCE: Record<PresenceStatus, { label: string; color: string; dot: string }> = {
  online:  { label: "En ligne",   color: "text-emerald-400", dot: "bg-emerald-400" },
  busy:    { label: "Occupé",     color: "text-red-400",     dot: "bg-red-400" },
  away:    { label: "Absent",     color: "text-amber-400",   dot: "bg-amber-400" },
  meeting: { label: "En réunion", color: "text-violet-400",  dot: "bg-violet-400" },
  offline: { label: "Hors ligne", color: "text-zinc-500",    dot: "bg-zinc-600" },
}

const PINNED_TABS = [
  { id: "vente",            label: "Vente",          icon: "🛒" },
  { id: "social_prospects", label: "Instagram",      icon: "📱" },
  { id: "suivi",            label: "Suivi clients",  icon: "📋" },
  { id: "stocks",           label: "Stock",          icon: "📦" },
  { id: "prospection",      label: "Prospection",    icon: "💊" },
]

const ALL_NAV = [
  { section: "Activité", items: [
    { id: "agenda",     label: "Agenda",           icon: "📅" },
    { id: "taches",     label: "Liste des tâches", icon: "✅" },
    { id: "pharmacies", label: "Pharmacies",       icon: "🏥" },
    { id: "commandes",  label: "Fournisseurs",     icon: "🏭" },
  ]},
  { section: "Clientèle", items: [
    { id: "clients",     label: "Clients",     icon: "👤" },
    { id: "conventions", label: "Conventions", icon: "🎪" },
  ]},
  { section: "Finances", items: [
    { id: "stats",         label: "Statistiques",     icon: "📊" },
    { id: "historique",    label: "Historique",       icon: "🕓" },
    { id: "depenses",      label: "Dépenses",         icon: "💸" },
    { id: "facturesdevis", label: "Factures & Devis", icon: "📄" },
    { id: "contrats",      label: "Contrats",         icon: "📑" },
  ]},
  { section: "Communication", items: [
    { id: "messages",  label: "Messages",  icon: "💬" },
    { id: "notes",     label: "Notes",     icon: "📝" },
    { id: "documents", label: "Documents", icon: "📁" },
  ]},
  { section: "Démarchage", items: [
    { id: "prospects", label: "Prospects", icon: "🎯" },
    { id: "tournees",  label: "Tournées",  icon: "🛣️" },
    { id: "map",       label: "Map",       icon: "🗺️" },
    { id: "ia",        label: "IA",        icon: "🤖" },
  ]},
  { section: "Système", items: [
    { id: "accueil",    label: "Accueil",    icon: "🏠" },
    { id: "admin",      label: "Admin",      icon: "🔒" },
    { id: "parametres", label: "Paramètres", icon: "⚙️" },
  ]},
]

const ALL_TABS_FLAT = [...PINNED_TABS, ...ALL_NAV.flatMap(s => s.items)]

/* ─────────────────────────── Helpers UI ─────────────────────────── */

function UserAvatar({ nom, url, color, size = 32 }: { nom: string; url?: string; color?: string; size?: number }) {
  const colors = ["#eab308", "#f59e0b", "#d97706", "#b45309"]
  const bg = color || colors[(nom?.charCodeAt(0) || 0) % colors.length]
  const initials = nom?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center text-black font-bold shrink-0 ring-2 ring-black/20"
      style={{ width: size, height: size, backgroundColor: url ? undefined : bg, fontSize: size * 0.36 }}
    >
      {url ? <img src={url} className="w-full h-full object-cover" alt={nom} /> : initials}
    </div>
  )
}

/* ─────────────────────────── Popups ─────────────────────────── */

function UnreadMessagesPopup({ notifs, onGoToMessages, onClose, ACCENT }: { notifs: UnreadNotif[]; onGoToMessages: () => void; onClose: () => void; ACCENT: string }) {
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
    <div className="fixed bottom-6 right-6 z-[100] w-80 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800" style={{ background: `linear-gradient(135deg, ${ACCENT}18, transparent)` }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: ACCENT + "25" }}>💬</div>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-black text-[10px] font-black flex items-center justify-center" style={{ backgroundColor: ACCENT }}>{total > 9 ? "9+" : total}</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Messages non lus</p>
              <p className="text-zinc-400 text-xs">{total} message{total > 1 ? "s" : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">✕</button>
        </div>
        <div className="max-h-48 overflow-y-auto divide-y divide-zinc-800/60">
          {notifs.slice(0, 4).map((n, i) => (
            <div key={i} className="px-4 py-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-black font-bold text-xs shrink-0" style={{ backgroundColor: ACCENT }}>{n.sender_nom?.charAt(0)?.toUpperCase() || "?"}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{n.sender_nom}</p>
                <p className="text-zinc-400 text-xs truncate mt-0.5">{n.content ? `"${n.content.slice(0, 42)}…"` : `📎 ${n.file_name}`}</p>
              </div>
              {n.count > 1 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: ACCENT + "20", color: ACCENT }}>{n.count}</span>}
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-zinc-800 flex gap-2">
          <button onClick={onGoToMessages} className="flex-1 py-2.5 rounded-xl text-black font-semibold text-sm transition-transform active:scale-[0.98]" style={{ backgroundColor: ACCENT }}>Voir les messages →</button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-zinc-400 font-medium text-sm bg-zinc-800 hover:bg-zinc-700 transition-colors">Plus tard</button>
        </div>
        <div className="h-0.5 bg-zinc-800"><div className="h-full rounded-full transition-all duration-75" style={{ width: `${progress}%`, backgroundColor: ACCENT }} /></div>
      </div>
    </div>
  )
}

function StockAlertPopup({ alerts, onGoToStock, onClose }: { alerts: any[]; onGoToStock: () => void; onClose: () => void }) {
  const [progress, setProgress] = useState(100)
  useEffect(() => {
    const timer = setInterval(() => setProgress(p => { if (p <= 0) { clearInterval(timer); onClose(); return 0 } return p - 0.5 }), 50)
    return () => clearInterval(timer)
  }, [])
  const neg = alerts.filter((a: any) => a.quantite < 0).length
  const low = alerts.filter((a: any) => a.quantite >= 0).length
  return (
    <div className="fixed bottom-6 left-6 z-[100] w-72 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800" style={{ background: "linear-gradient(135deg, #ef444420, transparent)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-lg">⚠️</div>
            <div>
              <p className="text-white font-semibold text-sm">Stocks critiques</p>
              <p className="text-zinc-400 text-xs">{neg > 0 && `${neg} négatif${neg > 1 ? "s" : ""}`}{neg > 0 && low > 0 && " · "}{low > 0 && `${low} en alerte`}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white">✕</button>
        </div>
        <div className="px-4 py-3 max-h-32 overflow-y-auto space-y-1.5">
          {alerts.slice(0, 5).map((a: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span className="text-zinc-300 text-sm truncate">{a.produit_nom}</span>
              <span className={`text-sm font-bold shrink-0 ${a.quantite < 0 ? "text-red-400" : "text-orange-400"}`}>{a.quantite} {a.unite || "u."}</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-zinc-800 flex gap-2">
          <button onClick={onGoToStock} className="flex-1 py-2.5 rounded-xl text-black font-semibold text-sm bg-red-500 hover:bg-red-400 transition-colors">Voir le stock →</button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-zinc-400 font-medium text-sm bg-zinc-800 hover:bg-zinc-700">Plus tard</button>
        </div>
        <div className="h-0.5 bg-zinc-800"><div className="h-full rounded-full bg-red-500 transition-all duration-75" style={{ width: `${progress}%` }} /></div>
      </div>
    </div>
  )
}

function TachesAlertPopup({ taches, onGoToTaches, onClose }: { taches: any[]; onGoToTaches: () => void; onClose: () => void }) {
  const [progress, setProgress] = useState(100)
  useEffect(() => {
    const timer = setInterval(() => setProgress(p => { if (p <= 0) { clearInterval(timer); onClose(); return 0 } return p - 0.4 }), 50)
    return () => clearInterval(timer)
  }, [])
  const todayStr = new Date().toISOString().slice(0, 10)
  const urgentes = taches.filter((t: any) => t.priorite === "urgente" && t.echeance !== todayStr).length
  const aujourdhui = taches.filter((t: any) => t.echeance === todayStr).length
  const enRetard = taches.filter((t: any) => t.echeance && t.echeance < todayStr).length
  const isCritical = urgentes > 0 || aujourdhui > 0
  const badge = (t: any) => t.echeance === todayStr ? "Aujourd'hui" : t.priorite === "urgente" ? "Urgent" : "Retard"
  const badgeColor = (t: any) => t.echeance === todayStr ? "bg-orange-500/20 text-orange-400" : t.priorite === "urgente" ? "bg-red-500/20 text-red-400" : "bg-zinc-700/50 text-zinc-400"
  return (
    <div className="fixed top-6 right-6 z-[100] w-80 animate-in slide-in-from-top-4 fade-in duration-300">
      <div className={`bg-zinc-900/95 backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden ${isCritical ? "border-red-500/30" : "border-orange-500/30"}`}>
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800" style={{ background: isCritical ? "linear-gradient(135deg, #ef444420, transparent)" : "linear-gradient(135deg, #f9731620, transparent)" }}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isCritical ? "bg-red-500/20" : "bg-orange-500/20"}`}>✅</div>
            <div>
              <p className="text-white font-semibold text-sm">Tâches à traiter</p>
              <p className="text-zinc-400 text-xs">
                {aujourdhui > 0 && `${aujourdhui} aujourd'hui`}
                {aujourdhui > 0 && (urgentes > 0 || enRetard > 0) && " · "}
                {urgentes > 0 && `${urgentes} urgente${urgentes > 1 ? "s" : ""}`}
                {urgentes > 0 && enRetard > 0 && " · "}
                {enRetard > 0 && `${enRetard} en retard`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white">✕</button>
        </div>
        <div className="px-4 py-3 max-h-36 overflow-y-auto space-y-2">
          {taches.slice(0, 5).map((t: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span className="text-zinc-300 text-sm truncate flex-1">{t.titre}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badgeColor(t)}`}>{badge(t)}</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-zinc-800 flex gap-2">
          <button onClick={onGoToTaches} className={`flex-1 py-2.5 rounded-xl text-black font-semibold text-sm transition-colors ${isCritical ? "bg-red-500 hover:bg-red-400" : "bg-orange-500 hover:bg-orange-400"}`}>Voir les tâches →</button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-zinc-400 font-medium text-sm bg-zinc-800 hover:bg-zinc-700">Plus tard</button>
        </div>
        <div className="h-0.5 bg-zinc-800"><div className={`h-full rounded-full transition-all duration-75 ${isCritical ? "bg-red-500" : "bg-orange-500"}`} style={{ width: `${progress}%` }} /></div>
      </div>
    </div>
  )
}

function AccessDeniedPanel({ tabLabel }: { tabLabel: string }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center p-10 max-w-sm">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🚫</span>
        </div>
        <h2 className="text-white text-xl font-bold mb-2">Accès non autorisé</h2>
        <p className="text-zinc-500 text-sm leading-relaxed">Tu n&apos;as pas accès au module <span className="text-red-400 font-medium">&quot;{tabLabel}&quot;</span>.</p>
      </div>
    </div>
  )
}

/* ─────────────────────────── Admin Gate ─────────────────────────── */

function AdminGate({ activeSociety, profile }: { activeSociety: any; profile: any }) {
  const [pin, setPin] = useState("")
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  const handle = (d: string) => {
    if (pin.length >= 8) return
    const next = pin + d
    setPin(next)
    setError(false)
    if (next.length === 8) {
      if (next === ADMIN_PIN) setUnlocked(true)
      else {
        setShake(true)
        setError(true)
        setTimeout(() => { setPin(""); setShake(false) }, 600)
      }
    }
  }

  if (unlocked) return <AdminModule activeSociety={activeSociety} profile={profile} />

  return (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
      <div className={`bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-80 text-center shadow-2xl ${shake ? "animate-bounce" : ""}`}>
        <div className="text-3xl mb-2">🔒</div>
        <p className="text-white font-bold text-lg mb-1">Panneau Admin</p>
        <p className="text-zinc-500 text-xs mb-7">Entrez le code PIN administrateur</p>
        <div className="flex justify-center gap-2.5 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i < pin.length ? (error ? "bg-red-500" : "bg-yellow-500") : "bg-zinc-700"}`} />
          ))}
        </div>
        {error && <p className="text-red-400 text-xs mb-4 font-medium">Code incorrect</p>}
        <div className="grid grid-cols-3 gap-2.5">
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
            <button
              key={i}
              onClick={() => d === "⌫" ? setPin(p => p.slice(0, -1)) : d ? handle(d) : null}
              className={`h-14 rounded-2xl text-lg font-bold transition-all active:scale-95 ${
                d === "⌫" ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-400" :
                d === "" ? "invisible" :
                "bg-zinc-800 hover:bg-yellow-500 hover:text-black text-white"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── Inner Dashboard ─────────────────────────── */

function InnerDashboard({ profile, activeSociety }: { profile: any; activeSociety: any }) {
  const { settings } = useUserSettings()
  const [openTabs, setOpenTabs] = useState<string[]>(["accueil"])
  const [activeTab, setActiveTab] = useState<string>("accueil")
  const FREQ_KEY = `tab_freq_${profile?.id || "default"}`

  const openTab = (id: string) => {
    setOpenTabs(prev => prev.includes(id) ? prev : [...prev, id])
    setActiveTab(id)
    try {
      const freq: Record<string, number> = JSON.parse(localStorage.getItem(FREQ_KEY) || "{}")
      freq[id] = (freq[id] || 0) + 1
      localStorage.setItem(FREQ_KEY, JSON.stringify(freq))
    } catch {}
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get("tab")
    if (tab) openTab(tab)
  }, [])

  const closeTab = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setOpenTabs(prev => {
      const next = prev.filter(t => t !== id)
      if (next.length === 0) { setActiveTab("vente"); return ["vente"] }
      if (activeTab === id) setActiveTab(next[next.length - 1])
      return next
    })
  }

  const [myStatus, setMyStatus] = useState<PresenceStatus>("online")
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [focusProspect, setFocusProspect] = useState<any>(null)
  const [activeConvention, setActiveConvention] = useState<any>(null)
  const [showConvPopup, setShowConvPopup] = useState(false)
  const [activeTournee, setActiveTournee] = useState<any>(null)
  const [unreadNotifs, setUnreadNotifs] = useState<UnreadNotif[]>([])
  const [showUnreadPopup, setShowUnreadPopup] = useState(false)
  const [stockAlerts, setStockAlerts] = useState<any[]>([])
  const [showStockAlert, setShowStockAlert] = useState(false)
  const [tachesAlerts, setTachesAlerts] = useState<any[]>([])
  const [showTachesAlert, setShowTachesAlert] = useState(false)
  const [globalSearch, setGlobalSearch] = useState("")
  const [showGlobalSearch, setShowGlobalSearch] = useState(false)
  const [globalResults, setGlobalResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`nav_collapsed_${profile?.id || "default"}`)
      if (saved) return new Set(JSON.parse(saved))
    } catch {}
    return new Set(ALL_NAV.map(s => s.section))
  })

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      next.has(section) ? next.delete(section) : next.add(section)
      try { localStorage.setItem(`nav_collapsed_${profile?.id || "default"}`, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const ACCENT = settings.accent_color || "#eab308"
  const BG = settings.background || "#0a0a0a"
  const SIDEBAR_BG = settings.sidebar_accent ? ACCENT + "0c" : "#0c0c0c"
  const APP_THEME = (settings as any).app_theme || "1"
  const BG_GRADIENT = (settings as any).bg_gradient || ""

  useEffect(() => {
    const found = ALL_NAV.find(s => s.items.some(t => t.id === activeTab))?.section
    if (found) setCollapsedSections(prev => { const n = new Set(prev); n.delete(found); return n })
  }, [activeTab])

  useEffect(() => {
    if (!activeSociety) return
    const todayStr = new Date().toISOString().split("T")[0]
    supabase.from("conventions").select("*").eq("society_id", activeSociety.id).lte("date_debut", todayStr).gte("date_fin", todayStr).order("date_debut", { ascending: false }).limit(1).single()
      .then(({ data }) => { if (data) { setActiveConvention(data); setShowConvPopup(true) } })
    supabase.from("stock").select("produit_nom,quantite,seuil_alerte,unite").eq("society_id", activeSociety.id)
      .then(({ data }) => {
        const alerts = (data || []).filter((s: any) => s.quantite < 0 || (s.seuil_alerte > 0 && s.quantite <= s.seuil_alerte))
        if (alerts.length > 0) { setStockAlerts(alerts); setTimeout(() => setShowStockAlert(true), 3000) }
      })
    supabase.from("liste_taches").select("id,titre,priorite,statut,echeance,assigne_id").eq("society_id", activeSociety.id).not("statut", "in", "(termine,annulee)")
      .then(({ data }) => {
        const todayS = new Date().toISOString().slice(0, 10)
        const relevant = (data || []).filter((t: any) => (t.priorite === "urgente" || t.echeance === todayS || (t.echeance && t.echeance < todayS)) && (!t.assigne_id || t.assigne_id === profile?.id))
        if (relevant.length > 0) { setTachesAlerts(relevant); setTimeout(() => setShowTachesAlert(true), 4500) }
      })
  }, [activeSociety])

  useEffect(() => {
    if (!profile || !activeSociety) return
    const check = async () => {
      const { data: convs } = await supabase.from("conversations").select("id, name, type, member_ids").eq("society_id", activeSociety.id).contains("member_ids", [profile.id])
      if (!convs || convs.length === 0) return
      const allMemberIds = [...new Set(convs.flatMap((c: any) => c.member_ids || []))]
      const { data: memberProfiles } = await supabase.from("profiles").select("id, nom").in("id", allMemberIds)
      const profileMap: Record<string, string> = {}
      ;(memberProfiles || []).forEach((p: any) => { profileMap[p.id] = p.nom })
      const notifs: UnreadNotif[] = []
      await Promise.all(convs.map(async (conv: any) => {
        const { data: unreadMsgs } = await supabase.from("messages").select("id, sender_nom, sender_id, content, file_name").eq("conversation_id", conv.id).not("read_by", "cs", `{${profile.id}}`).neq("sender_id", profile.id).order("created_at", { ascending: false }).limit(20)
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
          notifs.push({ sender_nom: nom, content: msgs[0].content || "", file_name: msgs[0].file_name, conv_name: convName, conv_id: conv.id, count: msgs.length })
        })
      }))
      if (notifs.length > 0) setTimeout(() => { setUnreadNotifs(notifs); setShowUnreadPopup(true) }, 1200)
    }
    check()
  }, [profile, activeSociety])

  useEffect(() => {
    if (!profile || !activeSociety) return
    let channel: ReturnType<typeof supabase.channel> | null = null
    supabase.from("user_presence").upsert({ user_id: profile.id, society_id: activeSociety.id, status: "online", last_seen: new Date().toISOString() }, { onConflict: "user_id" }).then(() => { setMyStatus("online"); loadUsers() })
    heartbeatRef.current = setInterval(() => { supabase.from("user_presence").update({ last_seen: new Date().toISOString() }).eq("user_id", profile.id) }, 30000)
    channel = supabase.channel(`presence_${activeSociety.id}`).on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, loadUsers).subscribe()
    const bye = () => supabase.from("user_presence").update({ status: "offline" }).eq("user_id", profile.id)
    window.addEventListener("beforeunload", bye)
    return () => { if (channel) supabase.removeChannel(channel); window.removeEventListener("beforeunload", bye); if (heartbeatRef.current) clearInterval(heartbeatRef.current) }
  }, [profile, activeSociety])

  useEffect(() => {
    if (!profile || !activeSociety) return
    const countUnread = () => {
      supabase.from("messages").select("*", { count: "exact", head: true }).eq("society_id", activeSociety.id).not("read_by", "cs", `{${profile.id}}`).neq("sender_id", profile.id)
        .then(({ count: c }) => setUnreadMessages(c || 0))
    }
    countUnread()
    const ch = supabase.channel(`unread_${profile.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, countUnread).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [profile, activeSociety])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) setShowStatusMenu(false)
      const target = e.target as HTMLElement
      if (!target.closest("[data-global-search]")) setShowGlobalSearch(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const map: Record<string, string> = {
        [settings.shortcut_vente]: "vente",
        [settings.shortcut_clients]: "clients",
        [settings.shortcut_stocks]: "stocks",
        [settings.shortcut_stats]: "stats",
        [settings.shortcut_messages]: "messages",
        [settings.shortcut_notes]: "notes",
        [settings.shortcut_parametres]: "parametres",
      }
      const target = map[e.key]
      if (target) { e.preventDefault(); openTab(target) }
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
    const users: OnlineUser[] = (members || []).filter(m => m.id !== profile.id).map(m => {
      const p = presences?.find(x => x.user_id === m.id)
      const minsAgo = p ? (Date.now() - new Date(p.last_seen).getTime()) / 60000 : 999
      const status: PresenceStatus = !p ? "offline" : minsAgo > 2 ? "offline" : p.status
      return { id: m.id, nom: m.nom, avatar_url: m.avatar_url, color: m.color, status }
    }).sort((a, b) => (ORDER[a.status] ?? 5) - (ORDER[b.status] ?? 5))
    setOnlineUsers(users)
  }

  const updateStatus = async (s: PresenceStatus) => {
    setMyStatus(s)
    setShowStatusMenu(false)
    await supabase.from("user_presence").update({ status: s, last_seen: new Date().toISOString() }).eq("user_id", profile.id)
  }

  const runGlobalSearch = async (q: string) => {
    if (!q.trim() || q.length < 2) { setGlobalResults([]); return }
    setSearchLoading(true)
    const [{ data: clients }, { data: prospects }, { data: ventes }] = await Promise.all([
      supabase.from("clients").select("id,nom,telephone,email").eq("society_id", activeSociety.id).ilike("nom", `%${q}%`).limit(5),
      supabase.from("prospects").select("id,nom,entreprise,ville").eq("society_id", activeSociety.id).ilike("nom", `%${q}%`).limit(5),
      supabase.from("ventes").select("id,client_nom,total_ttc,created_at").eq("society_id", activeSociety.id).ilike("client_nom", `%${q}%`).order("created_at", { ascending: false }).limit(5),
    ])
    const results: any[] = [
      ...(clients || []).map((c: any) => ({ type: "client", icon: "👤", label: c.nom, sub: c.telephone || c.email || "", tab: "clients" })),
      ...(prospects || []).map((p: any) => ({ type: "prospect", icon: "🎯", label: p.entreprise || p.nom, sub: p.ville || "", tab: "prospects" })),
      ...(ventes || []).map((v: any) => ({ type: "vente", icon: "🛒", label: v.client_nom || "Vente", sub: Number(v.total_ttc).toFixed(2) + "€", tab: "historique" })),
    ]
    setGlobalResults(results)
    setSearchLoading(false)
  }

  const logout = async () => {
    if (profile) await supabase.from("user_presence").update({ status: "offline" }).eq("user_id", profile.id)
    if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    await supabase.auth.signOut()
    router.push("/")
  }

  const visibleNav = ALL_NAV.map(section => ({
    ...section,
    items: section.items.map(tab => ({ ...tab, restricted: (settings as any).hidden_tabs?.includes(tab.id) || false }))
  }))

  const myCfg = PRESENCE[myStatus]
  const onlineCount = onlineUsers.filter(u => u.status !== "offline").length
  const activeTabMeta = ALL_TABS_FLAT.find(t => t.id === activeTab)
  const isRestricted = (settings as any).hidden_tabs?.includes(activeTab) || false

  const renderContent = () => {
    if (isRestricted) return <AccessDeniedPanel tabLabel={activeTabMeta?.label || activeTab} />
    switch (activeTab) {
      case "accueil":          return <AccueilModule activeSociety={activeSociety} profile={profile} />
      case "clients":          return <ClientsModule activeSociety={activeSociety} profile={profile} />
      case "suivi":            return <SuiviModule activeSociety={activeSociety} profile={profile} />
      case "social_prospects": return <SocialProspectsModule activeSociety={activeSociety} profile={profile} />
      case "conventions":      return <ConventionModule activeSociety={activeSociety} profile={profile} />
      case "stocks":           return <StocksModule activeSociety={activeSociety} profile={profile} />
      case "vente":            return <VenteModule activeSociety={activeSociety} profile={profile} />
      case "depenses":         return <DepensesOffertsModule activeSociety={activeSociety} profile={profile} />
      case "stats":            return <StatsModule activeSociety={activeSociety} profile={profile} />
      case "notes":            return <NotesModule activeSociety={activeSociety} profile={profile} />
      case "documents":        return <DocumentsModule activeSociety={activeSociety} profile={profile} />
      case "historique":       return <HistoriqueModule activeSociety={activeSociety} profile={profile} />
      case "contrats":         return <ContratsModule activeSociety={activeSociety} profile={profile} />
      case "facturesdevis":    return <FacturesDevisModule activeSociety={activeSociety} profile={profile} />
      case "pharmacies":       return <PharmaciesModule activeSociety={activeSociety} profile={profile} />
      case "prospection":      return <ProspectionModule activeSociety={activeSociety} profile={profile} />
      case "commandes":        return <CommandesModule activeSociety={activeSociety} profile={profile} />
      case "playlists":        return <PlaylistsModule activeSociety={activeSociety} profile={profile} />
      case "tournees":         return <TourneesModule activeSociety={activeSociety} profile={profile} onLaunchOnMap={(t: any) => setActiveTournee(t)} onSwitchToMap={() => openTab("map")} />
      case "prospects":        return <ProspectsModule activeSociety={activeSociety} profile={profile} onShowOnMap={(p: any) => setFocusProspect(p)} onSwitchToMap={() => openTab("map")} onSwitchToTournees={() => openTab("tournees")} />
      case "map":              return <MapModule activeSociety={activeSociety} profile={profile} focusProspect={focusProspect} activeTournee={activeTournee} onClearFocus={() => { setFocusProspect(null); setActiveTournee(null) }} onSwitchToProspects={() => openTab("prospects")} />
      case "messages":         return <MessagesModule activeSociety={activeSociety} profile={profile} />
      case "parametres":       return <ParametresModule activeSociety={activeSociety} profile={profile} />
      case "agenda":           return <AgendaModule activeSociety={activeSociety} profile={profile} />
      case "taches":           return <TachesModule activeSociety={activeSociety} profile={profile} />
      case "admin":            return <AdminGate activeSociety={activeSociety} profile={profile} />
      case "ia":               return <IAModule activeSociety={activeSociety} profile={profile} />
      default: return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-5xl mb-4">🚧</p>
            <p className="text-white text-xl font-bold">{activeTabMeta?.label}</p>
            <p className="text-zinc-500 text-sm mt-2">Module en cours de construction</p>
          </div>
        </div>
      )
    }
  }

  const fontSizeMap = { small: "13px", normal: "14px", large: "16px" }
  const baseFontSize = fontSizeMap[settings.font_size as keyof typeof fontSizeMap] || "14px"
  const radiusMap = { rounded: "12px", sharp: "4px", pill: "20px" }
  const cardRadius = radiusMap[settings.card_style as keyof typeof radiusMap] || "12px"

  const stockAlertPopup = stockAlerts.length > 0 && showStockAlert && <StockAlertPopup alerts={stockAlerts} onGoToStock={() => { openTab("stocks"); setShowStockAlert(false) }} onClose={() => setShowStockAlert(false)} />
  const tachesAlertPopup = tachesAlerts.length > 0 && showTachesAlert && <TachesAlertPopup taches={tachesAlerts} onGoToTaches={() => { openTab("taches"); setShowTachesAlert(false) }} onClose={() => setShowTachesAlert(false)} />
  const unreadPopup = showUnreadPopup && unreadNotifs.length > 0 && <UnreadMessagesPopup notifs={unreadNotifs} ACCENT={ACCENT} onGoToMessages={() => { openTab("messages"); setShowUnreadPopup(false) }} onClose={() => setShowUnreadPopup(false)} />

  /* ── Nav item renderers ── */
  const renderNavItem = (tab: any) => {
    const isActive = activeTab === tab.id
    const isOpen = openTabs.includes(tab.id)
    return (
      <button
        key={tab.id}
        onClick={() => openTab(tab.id)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 relative group"
        style={{
          backgroundColor: isActive ? (tab.restricted ? "#ef444415" : ACCENT + "15") : "transparent",
          color: tab.restricted ? (isActive ? "#ef4444" : "#7f3333") : (isActive ? ACCENT : "#a1a1aa"),
        }}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{ backgroundColor: tab.restricted ? "#ef4444" : ACCENT }} />
        )}
        <span className="text-base shrink-0 opacity-90">{tab.icon}</span>
        <span className="flex-1 truncate text-left">{tab.label}</span>
        {isOpen && !isActive && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ACCENT + "70" }} />}
        {tab.restricted && <span className="text-[10px] opacity-70">🔒</span>}
        {tab.id === "messages" && unreadMessages > 0 && (
          <span className="text-black text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
            {unreadMessages > 9 ? "9+" : unreadMessages}
          </span>
        )}
      </button>
    )
  }

  const renderPrimaryNavItem = (tab: any) => {
    const isActive = activeTab === tab.id
    const isOpen = openTabs.includes(tab.id)
    return (
      <button
        key={tab.id}
        onClick={() => openTab(tab.id)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-150 relative"
        style={{
          backgroundColor: isActive ? ACCENT + "18" : "rgba(255,255,255,0.03)",
          border: isActive ? `1px solid ${ACCENT}50` : "1px solid transparent",
          boxShadow: isActive ? `0 0 20px ${ACCENT}12` : "none",
        }}
      >
        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full" style={{ backgroundColor: ACCENT }} />}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: isActive ? ACCENT + "25" : "rgba(255,255,255,0.05)" }}
        >
          {tab.icon}
        </div>
        <span className="flex-1 text-left text-[13.5px] font-semibold truncate" style={{ color: isActive ? "#fff" : "#d4d4d8" }}>
          {tab.label}
        </span>
        {isOpen && !isActive && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ACCENT + "70" }} />}
        {tab.id === "messages" && unreadMessages > 0 && (
          <span className="text-black text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
            {unreadMessages > 9 ? "9+" : unreadMessages}
          </span>
        )}
      </button>
    )
  }

  /* ── Theme 2 ── */
  if (APP_THEME === "2") {
    return (
      <>
        <Theme2Layout
          activeSociety={activeSociety}
          profile={profile}
          activeTab={activeTab}
          openTab={openTab}
          openTabs={openTabs}
          closeTab={closeTab}
          visibleNav={visibleNav}
          renderContent={renderContent}
          ACCENT={ACCENT}
          BG={BG}
          BG_GRADIENT={BG_GRADIENT}
          baseFontSize={baseFontSize}
          cardRadius={cardRadius}
          unreadMessages={unreadMessages}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onlineUsers={onlineUsers}
          onlineCount={onlineCount}
          myStatus={myStatus}
          showStatusMenu={showStatusMenu}
          setShowStatusMenu={setShowStatusMenu}
          statusMenuRef={statusMenuRef}
          logout={logout}
          showConvPopup={showConvPopup}
          setShowConvPopup={setShowConvPopup}
          activeConvention={activeConvention}
        />
        {unreadPopup}{stockAlertPopup}{tachesAlertPopup}
      </>
    )
  }

  /* ── Main Theme ── */
  return (
    <div
      className="h-screen text-white flex overflow-hidden"
      style={{ background: BG_GRADIENT || BG, fontSize: baseFontSize, ["--card-radius" as any]: cardRadius }}
    >
      {/* Overlay mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      {/* ═══════════════ SIDEBAR DESKTOP ═══════════════ */}
      <aside
        className="hidden md:flex w-[260px] border-r border-zinc-800/80 flex-col shrink-0 h-screen overflow-hidden"
        style={{ backgroundColor: SIDEBAR_BG }}
      >
        {/* Header + Search */}
        <div className="px-4 pt-4 pb-3 border-b border-zinc-800/60 shrink-0">
          <div className="flex items-center gap-2.5 mb-3">
            <img src="/logo.png" alt="Butt Premium" className="h-8 w-auto" />
            {activeSociety && (
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: activeSociety.color || ACCENT }} />
                <p className="text-zinc-500 text-[11px] truncate font-medium">{activeSociety.name}</p>
              </div>
            )}
          </div>
          <div className="relative" data-global-search>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Rechercher..."
              value={globalSearch}
              onChange={e => { setGlobalSearch(e.target.value); runGlobalSearch(e.target.value); setShowGlobalSearch(true) }}
              onFocus={() => setShowGlobalSearch(true)}
              className="w-full bg-zinc-900/80 border border-zinc-700/60 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/40 transition-colors"
            />
            {showGlobalSearch && globalSearch.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                {searchLoading ? (
                  <p className="text-zinc-500 text-xs px-4 py-4 text-center">Recherche...</p>
                ) : globalResults.length === 0 ? (
                  <p className="text-zinc-600 text-xs px-4 py-4 text-center">Aucun résultat</p>
                ) : (
                  globalResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => { openTab(r.tab); setShowGlobalSearch(false); setGlobalSearch("") }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/80 transition-colors text-left"
                    >
                      <span className="text-base shrink-0">{r.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{r.label}</p>
                        {r.sub && <p className="text-zinc-500 text-xs truncate">{r.sub}</p>}
                      </div>
                      <span className="text-zinc-600 text-[10px] uppercase tracking-wider shrink-0">{r.type}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pinned tabs */}
        <div className="px-3 pt-3 pb-2 border-b border-zinc-800/50 shrink-0 space-y-1">
          {PINNED_TABS.map(tab => renderPrimaryNavItem({ ...tab, restricted: false }))}
        </div>

        {/* Navigation sections */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1 scrollbar-thin">
          {visibleNav.map(({ section, items }) => {
            const isActivite = section === "Activité"
            const isCollapsed = collapsedSections.has(section)
            const hasActive = items.some(t => t.id === activeTab)
            const hasOpen = items.some(t => openTabs.includes(t.id))
            return (
              <div key={section} className="mb-1">
                <button
                  onClick={() => toggleSection(section)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-zinc-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    {isActivite && <span className="text-[11px]">⚡</span>}
                    <p
                      className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${hasActive ? "text-zinc-300" : "text-zinc-600 group-hover:text-zinc-400"}`}
                      style={isActivite && hasActive ? { color: ACCENT } : {}}
                    >
                      {section}
                    </p>
                    {isCollapsed && (hasActive || hasOpen) && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />
                    )}
                  </div>
                  <span className={`text-zinc-600 text-[9px] transition-transform duration-200 ${isCollapsed ? "" : "rotate-90"}`}>▶</span>
                </button>
                {!isCollapsed && (
                  <div className={isActivite ? "space-y-1 mt-1" : "space-y-0.5 mt-0.5"}>
                    {items.map(tab => isActivite ? renderPrimaryNavItem(tab) : renderNavItem(tab))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Prospection + Team */}
        <div className="px-3 py-2 border-t border-zinc-800/50 shrink-0">
          <ProspectionModal />
        </div>

        {onlineUsers.length > 0 && (
          <div className="border-t border-zinc-800/50 px-3 pt-2.5 pb-1.5 shrink-0">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1 mb-1.5">
              Équipe · <span className={onlineCount > 0 ? "text-emerald-500" : "text-zinc-600"}>{onlineCount > 0 ? `${onlineCount} en ligne` : "hors ligne"}</span>
            </p>
            <div className="space-y-0.5 max-h-20 overflow-y-auto">
              {onlineUsers.slice(0, 4).map(u => (
                <button
                  key={u.id}
                  onClick={() => openTab("messages")}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="relative shrink-0">
                    <UserAvatar nom={u.nom} url={u.avatar_url} color={u.color} size={22} />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${PRESENCE[u.status].dot} ring-1 ring-[#0c0c0c]`} />
                  </div>
                  <p className="text-zinc-400 text-xs truncate">{u.nom}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User status */}
        <div className="border-t border-zinc-800/50 p-3 shrink-0">
          <div className="relative" ref={statusMenuRef}>
            <button
              onClick={() => setShowStatusMenu(p => !p)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-zinc-800/50 transition-colors"
              style={{ backgroundColor: "rgba(39,39,42,0.4)", border: "1px solid rgba(63,63,70,0.4)" }}
            >
              <div className="relative shrink-0">
                <UserAvatar nom={profile?.nom || "?"} url={profile?.avatar_url} color={profile?.color} size={28} />
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${myCfg.dot} ring-1 ring-[#0c0c0c]`} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-white text-[12px] font-semibold truncate">{profile?.nom || profile?.username}</p>
                <p className={`text-[11px] font-medium ${myCfg.color}`}>{myCfg.label}</p>
              </div>
              <span className="text-zinc-600 text-xs">▾</span>
            </button>

            {showStatusMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider px-3.5 pt-3 pb-1.5">Statut</p>
                {(Object.entries(PRESENCE) as [PresenceStatus, typeof PRESENCE[PresenceStatus]][]).map(([s, cfg]) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-zinc-800 transition-colors ${myStatus === s ? "bg-zinc-800/70" : ""}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-sm ${myStatus === s ? "text-white font-medium" : "text-zinc-400"}`}>{cfg.label}</span>
                    {myStatus === s && <span className="ml-auto text-xs font-bold" style={{ color: ACCENT }}>✓</span>}
                  </button>
                ))}
                <div className="border-t border-zinc-800 mt-1">
                  <button onClick={logout} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-sm">
                    <span>→</span> Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ═══════════════ SIDEBAR MOBILE ═══════════════ */}
      {sidebarOpen && (
        <aside className="fixed top-0 left-0 h-full w-72 z-50 flex flex-col border-r border-zinc-800 md:hidden overflow-y-auto bg-[#0c0c0c]">
          <button onClick={() => setSidebarOpen(false)} className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white">✕</button>
          <div className="px-4 pt-5 pb-3 border-b border-zinc-800">
            <img src="/logo.png" alt="Butt Premium" className="h-8 w-auto" />
          </div>
          <div className="px-3 pt-3 pb-2 border-b border-zinc-800 space-y-1">
            {PINNED_TABS.map(tab => renderPrimaryNavItem({ ...tab, restricted: false }))}
          </div>
          <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
            {visibleNav.map(({ section, items }) => {
              const isActivite = section === "Activité"
              const isCollapsed = collapsedSections.has(section)
              const hasActive = items.some(t => t.id === activeTab)
              const hasOpen = items.some(t => openTabs.includes(t.id))
              return (
                <div key={section}>
                  <button onClick={() => toggleSection(section)} className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-zinc-800/40">
                    <div className="flex items-center gap-1.5">
                      {isActivite && <span className="text-[11px]">⚡</span>}
                      <p className={`text-[11px] font-bold uppercase tracking-widest ${hasActive ? "text-zinc-300" : "text-zinc-600"}`} style={isActivite && hasActive ? { color: ACCENT } : {}}>{section}</p>
                      {isCollapsed && (hasActive || hasOpen) && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />}
                    </div>
                    <span className={`text-zinc-600 text-[9px] transition-transform ${isCollapsed ? "" : "rotate-90"}`}>▶</span>
                  </button>
                  {!isCollapsed && (
                    <div className={isActivite ? "space-y-1 mt-1" : "space-y-0.5 mt-0.5"}>
                      {items.map(tab => isActivite ? renderPrimaryNavItem(tab) : renderNavItem(tab))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
          <div className="border-t border-zinc-800 px-3 pt-3 pb-2"><ProspectionModal /></div>
          <div className="border-t border-zinc-800 p-3">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl" style={{ backgroundColor: "rgba(39,39,42,0.4)", border: "1px solid rgba(63,63,70,0.4)" }}>
              <UserAvatar nom={profile?.nom || "?"} url={profile?.avatar_url} color={profile?.color} size={28} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{profile?.nom}</p>
                <p className="text-zinc-500 text-xs">En ligne</p>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* ═══════════════ MAIN AREA ═══════════════ */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-3.5 left-3.5 z-30 w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl shadow-xl border border-zinc-700/80 bg-zinc-900/90 backdrop-blur"
        >
          <span className="w-5 h-0.5 rounded-full" style={{ backgroundColor: ACCENT }} />
          <span className="w-5 h-0.5 rounded-full" style={{ backgroundColor: ACCENT }} />
          <span className="w-3.5 h-0.5 rounded-full" style={{ backgroundColor: ACCENT }} />
        </button>

        {/* Tabs bar */}
        {openTabs.length > 0 && (
          <div className="shrink-0 border-b border-zinc-800/60 flex items-center overflow-x-auto" style={{ backgroundColor: SIDEBAR_BG, minHeight: "42px" }}>
            <div className="flex items-center px-2 gap-1">
              {openTabs.map(tabId => {
                const meta = ALL_TABS_FLAT.find(t => t.id === tabId)
                const isActive = activeTab === tabId
                if (!meta) return null
                return (
                  <div
                    key={tabId}
                    onClick={() => setActiveTab(tabId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer shrink-0 transition-all group"
                    style={{
                      backgroundColor: isActive ? ACCENT + "15" : "transparent",
                      border: isActive ? `1px solid ${ACCENT}40` : "1px solid transparent",
                      color: isActive ? ACCENT : "#71717a",
                    }}
                  >
                    <span className="text-xs">{meta.icon}</span>
                    <span className="text-[12.5px] font-medium whitespace-nowrap">{meta.label}</span>
                    <button
                      onClick={(e) => closeTab(tabId, e)}
                      className="ml-0.5 w-4 h-4 rounded flex items-center justify-center text-[10px] opacity-40 hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-hidden flex flex-col" style={{ backgroundColor: BG }}>
          {renderContent()}

          {/* Convention popup */}
          {showConvPopup && activeConvention && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
                <div className="px-6 pt-7 pb-5 text-center" style={{ background: "linear-gradient(135deg, #eab30818, transparent)" }}>
                  <div className="text-5xl mb-3">🎪</div>
                  <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/25 rounded-full px-3 py-1 mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 text-xs font-bold">Convention en cours</span>
                  </div>
                  <h2 className="text-white font-bold text-xl">{activeConvention.nom}</h2>
                  {activeConvention.lieu && <p className="text-zinc-500 text-sm mt-1">📍 {activeConvention.lieu}</p>}
                </div>
                <div className="px-6 py-4 space-y-2.5 border-t border-zinc-800">
                  <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl px-4 py-3">
                    <span className="text-zinc-500 text-sm">Début</span>
                    <span className="text-white text-sm font-medium">
                      {new Date(activeConvention.date_debut + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl px-4 py-3">
                    <span className="text-zinc-500 text-sm">Fin</span>
                    <span className="text-white text-sm font-medium">
                      {new Date(activeConvention.date_fin + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                    </span>
                  </div>
                </div>
                <div className="px-6 pb-6 space-y-2">
                  <button onClick={() => { setShowConvPopup(false); openTab("conventions") }} className="w-full py-3 rounded-xl text-black font-bold text-sm" style={{ backgroundColor: ACCENT }}>
                    📋 Aller à la convention
                  </button>
                  <button onClick={() => setShowConvPopup(false)} className="w-full py-3 rounded-xl text-zinc-400 font-medium text-sm bg-zinc-800 hover:bg-zinc-700 transition-colors">
                    Continuer
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {unreadPopup}
      {stockAlertPopup}
      {tachesAlertPopup}
    </div>
  )
}

/* ─────────────────────────── Root ─────────────────────────── */

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeSociety, setActiveSociety] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push("/"); return }
        let { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
        if (!prof) {
          const nom = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Utilisateur"
          const { data: soc } = await supabase.from("societies").select("id").limit(1).single()
          await supabase.from("profiles").insert({ id: session.user.id, nom, email: session.user.email, society_id: soc?.id, role: "vendeur", is_active: true })
          const { data: newProf } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
          prof = newProf
        }
        if (prof) setProfile({ ...prof, email: session.user.email })
        try {
          localStorage.setItem("bp_access_token", session.access_token)
          localStorage.setItem("bp_supabase_url", process.env.NEXT_PUBLIC_SUPABASE_URL || "")
          localStorage.setItem("bp_anon_key", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "")
          localStorage.setItem("bp_society_id", prof?.society_id || "")
          localStorage.setItem("bp_profile_name", [prof?.prenom, prof?.nom].filter(Boolean).join(" ") || "")
        } catch {}
        const { data: socs } = await supabase.from("societies").select("*").eq("active", true)
        if (socs?.length) setActiveSociety(socs[0])
      } catch (err) {
        console.error("init error:", err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-9 h-9 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <p className="text-white font-bold text-lg">Problème de chargement</p>
        <button onClick={() => window.location.reload()} className="bg-yellow-500 text-black font-bold px-6 py-2.5 rounded-xl hover:bg-yellow-400 transition-colors">
          Réessayer
        </button>
        <button onClick={async () => { await supabase.auth.signOut(); router.push("/") }} className="text-zinc-500 text-sm hover:text-white transition-colors">
          Se déconnecter
        </button>
      </div>
    )
  }

  return (
    <UserSettingsProvider userId={profile.id}>
      <InnerDashboard profile={profile} activeSociety={activeSociety} />
    </UserSettingsProvider>
  )
}

/* ─────────────────────────── Theme 2 ─────────────────────────── */

function Theme2Layout({
  activeSociety, profile, activeTab, openTab, openTabs, closeTab, visibleNav, renderContent,
  ACCENT, BG, BG_GRADIENT, baseFontSize, cardRadius, unreadMessages, sidebarOpen, setSidebarOpen,
  onlineUsers, onlineCount, myStatus, showStatusMenu, setShowStatusMenu, statusMenuRef, logout,
  showConvPopup, setShowConvPopup, activeConvention
}: any) {
  const allTabs = visibleNav.flatMap((s: any) => s.items)
  const NEON = "#a855f7"

  return (
    <div className="h-screen text-white flex flex-col overflow-hidden" style={{ background: BG_GRADIENT || BG, fontSize: baseFontSize, ["--card-radius" as any]: cardRadius }}>
      <header className="shrink-0 border-b z-30" style={{ backgroundColor: BG === "#0a0a0a" ? "#08080f" : BG + "ee", borderColor: NEON + "25" }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: NEON + "15" }}>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Butt Premium" className="h-8 w-auto" />
            {activeSociety && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ backgroundColor: NEON + "12", border: `1px solid ${NEON}25` }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: NEON }} />
                <span className="text-xs font-bold" style={{ color: NEON }}>{activeSociety.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onlineCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs font-semibold">{onlineCount} en ligne</span>
              </div>
            )}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowStatusMenu(!showStatusMenu)}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-black" style={{ backgroundColor: NEON }}>
                {profile?.nom?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <span className="text-zinc-300 text-sm font-medium hidden sm:block">{profile?.nom}</span>
            </div>
            {showStatusMenu && (
              <div ref={statusMenuRef} className="absolute top-14 right-4 bg-zinc-900 border rounded-xl shadow-2xl z-50 overflow-hidden w-44" style={{ borderColor: NEON + "25" }}>
                <button onClick={() => { logout(); setShowStatusMenu(false) }} className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 text-sm">
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
              <button
                key={tab.id}
                onClick={() => openTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 relative"
                style={isActive ? { backgroundColor: NEON + "18", color: NEON, border: `1px solid ${NEON}40` } : { color: "#52525b", border: "1px solid transparent" }}
              >
                {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full" style={{ backgroundColor: NEON }} />}
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === "messages" && unreadMessages > 0 && (
                  <span className="text-black text-[9px] font-black min-w-[14px] h-3.5 px-1 rounded-full flex items-center justify-center" style={{ backgroundColor: NEON }}>
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
        <div className="flex items-center gap-2 px-2 pb-2">
          <ProspectionModal />
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col" style={{ backgroundColor: BG }}>
        {renderContent()}
      </main>

      {showConvPopup && activeConvention && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl w-full max-w-sm shadow-2xl p-6 border" style={{ backgroundColor: "#0d0d18", borderColor: NEON + "35" }}>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-2xl">🎪</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: NEON }}>Convention en cours</p>
                <h2 className="text-white font-bold text-lg">{activeConvention.nom}</h2>
              </div>
            </div>
            {activeConvention.lieu && <p className="text-zinc-400 text-sm mb-4">📍 {activeConvention.lieu}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setShowConvPopup(false); openTab("conventions") }} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black" style={{ backgroundColor: NEON }}>
                📋 Aller à la convention
              </button>
              <button onClick={() => setShowConvPopup(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}