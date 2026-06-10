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

const ADMIN_PIN = "18072209"
type PresenceStatus = "online" | "busy" | "away" | "meeting" | "offline"
interface OnlineUser { id: string; nom: string; avatar_url?: string; color?: string; status: PresenceStatus }
interface UnreadNotif { sender_nom: string; content: string; file_name?: string | null; conv_name: string; conv_id: string; count: number }

const PRESENCE: Record<PresenceStatus, { label: string; color: string; dot: string }> = {
  online:  { label: "En ligne",   color: "text-green-400",  dot: "bg-green-400"  },
  busy:    { label: "Occupé",     color: "text-red-400",    dot: "bg-red-400"    },
  away:    { label: "Absent",     color: "text-yellow-400", dot: "bg-yellow-400" },
  meeting: { label: "En réunion", color: "text-purple-400", dot: "bg-purple-400" },
  offline: { label: "Hors ligne", color: "text-zinc-500",   dot: "bg-zinc-600"   },
}

const ALL_NAV = [
  { section: "Activité", items: [
    { id: "vente",            label: "Vente",              icon: "🛒" },
    { id: "clients",          label: "Clients",            icon: "👤" },
    { id: "social_prospects", label: "Instagram & Autres", icon: "📱" },
    { id: "suivi",            label: "Suivi clients",      icon: "📋" },
    { id: "conventions",      label: "Conventions",        icon: "🎪" },
    { id: "stocks",           label: "Stock",              icon: "📦" },
  ]},
  { section: "Finances", items: [
    { id: "stats",         label: "Statistiques",    icon: "📊" },
    { id: "historique",    label: "Historique",      icon: "🕓" },
    { id: "depenses",      label: "Dépenses",        icon: "💸" },
    { id: "facturesdevis", label: "Factures & Devis",icon: "📄" },
    { id: "contrats",      label: "Contrats",        icon: "📑" },
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
  { section: "Gestion", items: [
    { id: "commandes",  label: "Fournisseurs",      icon: "🏭" },
    { id: "pharmacies", label: "Pharmacies",        icon: "🏥" },
    { id: "playlists",  label: "Playlists clients", icon: "🎵" },
  ]},
  { section: "Système", items: [
    { id: "accueil",    label: "Accueil",    icon: "🏠" },
    { id: "agenda",     label: "Agenda",     icon: "📅" },
    { id: "admin",      label: "Admin",      icon: "🔒" },
    { id: "parametres", label: "Paramètres", icon: "⚙️" },
  ]},
]
const ALL_TABS_FLAT = ALL_NAV.flatMap(s => s.items)

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
        <p className="text-zinc-500 text-xs mb-6">Code PIN administrateur</p>
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

function UnreadMessagesPopup({ notifs, onGoToMessages, onClose, ACCENT }: {
  notifs: UnreadNotif[]; onGoToMessages: () => void; onClose: () => void; ACCENT: string
}) {
  const total = notifs.reduce((sum, n) => sum + n.count, 0)
  const [progress, setProgress] = useState(100)
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => { if (p <= 0) { clearInterval(timer); onClose(); return 0 } return p - (50/8000)*100 })
    }, 50)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="fixed bottom-6 right-6 z-[100] w-80">
      <div className="bg-[#18181b] border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden" style={{ boxShadow: `0 8px 40px ${ACCENT}20` }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80" style={{ background: `linear-gradient(135deg, ${ACCENT}15, transparent)` }}>
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: ACCENT+"20", border: `1px solid ${ACCENT}30` }}>💬</div>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-black text-[9px] font-black flex items-center justify-center" style={{ backgroundColor: ACCENT }}>{total > 9 ? "9+" : total}</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">Messages non lus</p>
              <p className="text-zinc-400 text-[11px]">{total} message{total > 1 ? "s" : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-white shrink-0">✕</button>
        </div>
        <div className="max-h-48 overflow-y-auto divide-y divide-zinc-800/50">
          {notifs.slice(0, 4).map((n, i) => (
            <div key={i} className="px-4 py-2.5">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-black font-bold text-[11px] shrink-0" style={{ backgroundColor: ACCENT }}>{n.sender_nom?.charAt(0)?.toUpperCase() || "?"}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{n.sender_nom}</p>
                  <p className="text-zinc-400 text-[11px] truncate">{n.content ? `"${n.content.slice(0,45)}…"` : "Nouveau message"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-zinc-800/80 flex gap-2">
          <button onClick={onGoToMessages} className="flex-1 py-2 rounded-xl text-black font-bold text-xs" style={{ backgroundColor: ACCENT }}>Voir les messages →</button>
          <button onClick={onClose} className="px-3 py-2 rounded-xl text-zinc-400 font-medium text-xs bg-zinc-800 hover:bg-zinc-700">Plus tard</button>
        </div>
        <div className="h-0.5 bg-zinc-800"><div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: ACCENT }} /></div>
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
  return (
    <div className="fixed bottom-6 left-6 z-[100] w-72">
      <div className="bg-[#18181b] border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80" style={{ background: "linear-gradient(135deg, #ef444415, transparent)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-lg">⚠️</div>
            <p className="text-white font-bold text-sm">Stocks critiques</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-white text-sm">✕</button>
        </div>
        <div className="px-4 py-2.5 max-h-32 overflow-y-auto space-y-1">
          {alerts.slice(0,4).map((a:any,i:number) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-zinc-300 text-xs truncate">{a.produit_nom}</span>
              <span className={`text-xs font-bold ml-2 shrink-0 ${a.quantite < 0 ? "text-red-500" : "text-orange-400"}`}>{a.quantite}</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-zinc-800/80 flex gap-2">
          <button onClick={onGoToStock} className="flex-1 py-2 rounded-xl text-black font-bold text-xs bg-red-500 hover:bg-red-400">Voir le stock →</button>
          <button onClick={onClose} className="px-3 py-2 rounded-xl text-zinc-400 text-xs bg-zinc-800 hover:bg-zinc-700">Plus tard</button>
        </div>
        <div className="h-0.5 bg-zinc-800"><div className="h-full rounded-full bg-red-500" style={{ width: `${progress}%` }} /></div>
      </div>
    </div>
  )
}

function AccessDeniedPanel({ tabLabel }: { tabLabel: string }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center p-8">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-5"><span className="text-4xl">🚫</span></div>
        <h2 className="text-white text-xl font-bold mb-2">Accès non autorisé</h2>
        <p className="text-zinc-500 text-sm">Tu n&apos;as pas accès à <span className="text-red-400 font-semibold">&quot;{tabLabel}&quot;</span>.</p>
      </div>
    </div>
  )
}

function InnerDashboard({ profile, activeSociety }: { profile: any; activeSociety: any }) {
  const { settings } = useUserSettings()
  const defaultTab = ALL_TABS_FLAT.find(t => t.id === (settings.start_page || "vente")) || ALL_TABS_FLAT[0]
  const [openTabs, setOpenTabs]   = useState<{ id: string; label: string; icon: string }[]>([defaultTab])
  const [activeTab, setActiveTab] = useState(defaultTab.id)

  const openTab = (id: string) => {
    const tab = ALL_TABS_FLAT.find(t => t.id === id); if (!tab) return
    setOpenTabs(prev => prev.find(t => t.id === id) ? prev : [...prev, tab])
    setActiveTab(id)
  }
  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const idx = openTabs.findIndex(t => t.id === id)
    const newTabs = openTabs.filter(t => t.id !== id)
    setOpenTabs(newTabs.length === 0 ? [defaultTab] : newTabs)
    if (activeTab === id) setActiveTab(newTabs.length > 0 ? newTabs[Math.max(0, idx-1)].id : defaultTab.id)
  }

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
  const [stockAlerts, setStockAlerts]       = useState<any[]>([])
  const [showStockAlert, setShowStockAlert] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(ALL_NAV.map(s => s.section)))

  const heartbeatRef  = useRef<NodeJS.Timeout | null>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)
  const router        = useRouter()

  const ACCENT      = settings.accent_color || "#eab308"
  const BG          = settings.background   || "#0a0a0a"
  const SIDEBAR_BG  = settings.sidebar_accent ? ACCENT + "12" : "#0d0d0d"
  const APP_THEME   = (settings as any).app_theme  || "1"
  const BG_GRADIENT = (settings as any).bg_gradient || ""

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => { const n = new Set(prev); n.has(section) ? n.delete(section) : n.add(section); return n })
  }
  useEffect(() => {
    const sec = ALL_NAV.find(s => s.items.some(t => t.id === activeTab))?.section
    if (sec) setCollapsedSections(prev => { const n = new Set(prev); n.delete(sec); return n })
  }, [activeTab])

  useEffect(() => {
    if (!activeSociety) return
    const today = new Date().toISOString().split("T")[0]
    supabase.from("conventions").select("*").eq("society_id", activeSociety.id)
      .lte("date_debut", today).gte("date_fin", today).order("date_debut", { ascending: false }).limit(1).single()
      .then(({ data }) => { if (data) { setActiveConvention(data); setShowConvPopup(true) } })
    supabase.from("stock").select("produit_nom,quantite,seuil_alerte,unite").eq("society_id", activeSociety.id)
      .then(({ data }) => {
        const alerts = (data||[]).filter((s:any) => s.quantite < 0 || (s.seuil_alerte > 0 && s.quantite <= s.seuil_alerte))
        if (alerts.length > 0) { setStockAlerts(alerts); setTimeout(() => setShowStockAlert(true), 3000) }
      })
  }, [activeSociety])

  useEffect(() => {
    if (!profile || !activeSociety) return
    const check = async () => {
      const { data: convs } = await supabase.from("conversations").select("id, name, type, member_ids")
        .eq("society_id", activeSociety.id).contains("member_ids", [profile.id])
      if (!convs?.length) return
      const allIds = [...new Set(convs.flatMap((c:any) => c.member_ids||[]))]
      const { data: mp } = await supabase.from("profiles").select("id, nom").in("id", allIds)
      const pMap: Record<string,string> = {}; (mp||[]).forEach((p:any)=>{ pMap[p.id]=p.nom })
      const notifs: UnreadNotif[] = []
      await Promise.all(convs.map(async (conv:any) => {
        const { data: msgs } = await supabase.from("messages").select("id, sender_nom, sender_id, content, file_name")
          .eq("conversation_id", conv.id).not("read_by","cs",`{${profile.id}}`).neq("sender_id",profile.id)
          .order("created_at",{ascending:false}).limit(20)
        if (!msgs?.length) return
        let convName = conv.name
        if (conv.type==="direct"&&!conv.name) {
          const otherId=(conv.member_ids||[]).find((id:string)=>id!==profile.id)
          convName=otherId?pMap[otherId]||"Conversation":"Conversation"
        }
        const bySender: Record<string,{nom:string;msgs:typeof msgs}> = {}
        msgs.forEach((m:any)=>{ if(!bySender[m.sender_id])bySender[m.sender_id]={nom:m.sender_nom,msgs:[]}; bySender[m.sender_id].msgs.push(m) })
        Object.values(bySender).forEach(({nom,msgs:ms})=>{
          notifs.push({sender_nom:nom,content:ms[0].content||"",file_name:ms[0].file_name,conv_name:convName,conv_id:conv.id,count:ms.length})
        })
      }))
      if (notifs.length>0) setTimeout(()=>{ setUnreadNotifs(notifs); setShowUnreadPopup(true) },1200)
    }
    check()
  }, [profile, activeSociety])

  useEffect(() => {
    if (!profile||!activeSociety) return
    supabase.from("user_presence").upsert({user_id:profile.id,society_id:activeSociety.id,status:"online",last_seen:new Date().toISOString()},{onConflict:"user_id"})
      .then(()=>{ setMyStatus("online"); loadUsers() })
    heartbeatRef.current=setInterval(()=>{ supabase.from("user_presence").update({last_seen:new Date().toISOString()}).eq("user_id",profile.id) },30000)
    const ch=supabase.channel(`presence_${activeSociety.id}`).on("postgres_changes",{event:"*",schema:"public",table:"user_presence"},loadUsers).subscribe()
    const bye=()=>supabase.from("user_presence").update({status:"offline"}).eq("user_id",profile.id)
    window.addEventListener("beforeunload",bye)
    return ()=>{ supabase.removeChannel(ch); window.removeEventListener("beforeunload",bye); if(heartbeatRef.current)clearInterval(heartbeatRef.current) }
  }, [profile, activeSociety])

  useEffect(() => {
    if (!profile||!activeSociety) return
    const countUnread=()=>{ supabase.from("messages").select("*",{count:"exact",head:true}).eq("society_id",activeSociety.id).not("read_by","cs",`{${profile.id}}`).neq("sender_id",profile.id).then(({count:c})=>setUnreadMessages(c||0)) }
    countUnread()
    const ch=supabase.channel(`unread_${profile.id}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages"},countUnread).subscribe()
    return ()=>{ supabase.removeChannel(ch) }
  }, [profile, activeSociety])

  useEffect(() => {
    const h=(e:MouseEvent)=>{ if(statusMenuRef.current&&!statusMenuRef.current.contains(e.target as Node))setShowStatusMenu(false) }
    document.addEventListener("mousedown",h); return ()=>document.removeEventListener("mousedown",h)
  }, [])

  const loadUsers = async () => {
    const [{data:members},{data:presences}]=await Promise.all([
      supabase.from("profiles").select("id,nom,avatar_url,color").eq("society_id",activeSociety.id),
      supabase.from("user_presence").select("*").eq("society_id",activeSociety.id),
    ])
    const ORDER:Record<PresenceStatus,number>={online:0,meeting:1,busy:2,away:3,offline:4}
    setOnlineUsers((members||[]).filter(m=>m.id!==profile.id).map(m=>{
      const p=presences?.find(x=>x.user_id===m.id)
      const minsAgo=p?(Date.now()-new Date(p.last_seen).getTime())/60000:999
      return{id:m.id,nom:m.nom,avatar_url:m.avatar_url,color:m.color,status:(!p||minsAgo>2?"offline":p.status) as PresenceStatus}
    }).sort((a,b)=>(ORDER[a.status]??5)-(ORDER[b.status]??5)))
  }

  const updateStatus=async(s:PresenceStatus)=>{ setMyStatus(s);setShowStatusMenu(false); await supabase.from("user_presence").update({status:s,last_seen:new Date().toISOString()}).eq("user_id",profile.id) }
  const logout=async()=>{ if(profile)await supabase.from("user_presence").update({status:"offline"}).eq("user_id",profile.id); if(heartbeatRef.current)clearInterval(heartbeatRef.current); await supabase.auth.signOut();router.push("/") }

  const visibleNav=ALL_NAV.map(section=>({...section,items:section.items.map(tab=>({...tab,restricted:(settings as any).hidden_tabs?.includes(tab.id)||false}))}))
  const myCfg=PRESENCE[myStatus]
  const onlineCount=onlineUsers.filter(u=>u.status!=="offline").length
  const activeTabMeta=ALL_TABS_FLAT.find(t=>t.id===activeTab)
  const isRestricted=(settings as any).hidden_tabs?.includes(activeTab)||false

  const renderContent=()=>{
    if(isRestricted) return <AccessDeniedPanel tabLabel={activeTabMeta?.label||activeTab}/>
    switch(activeTab){
      case "accueil":           return <AccueilModule         activeSociety={activeSociety} profile={profile}/>
      case "clients":           return <ClientsModule         activeSociety={activeSociety} profile={profile}/>
      case "suivi":             return <SuiviModule           activeSociety={activeSociety} profile={profile}/>
      case "social_prospects":  return <SocialProspectsModule activeSociety={activeSociety} profile={profile}/>
      case "conventions":       return <ConventionModule      activeSociety={activeSociety} profile={profile}/>
      case "stocks":            return <StocksModule          activeSociety={activeSociety} profile={profile}/>
      case "vente":             return <VenteModule           activeSociety={activeSociety} profile={profile}/>
      case "depenses":          return <DepensesOffertsModule activeSociety={activeSociety} profile={profile}/>
      case "stats":             return <StatsModule           activeSociety={activeSociety} profile={profile}/>
      case "notes":             return <NotesModule           activeSociety={activeSociety} profile={profile}/>
      case "documents":         return <DocumentsModule       activeSociety={activeSociety} profile={profile}/>
      case "historique":        return <HistoriqueModule      activeSociety={activeSociety} profile={profile}/>
      case "contrats":          return <ContratsModule        activeSociety={activeSociety} profile={profile}/>
      case "facturesdevis":     return <FacturesDevisModule   activeSociety={activeSociety} profile={profile}/>
      case "pharmacies":        return <PharmaciesModule      activeSociety={activeSociety} profile={profile}/>
      case "commandes":         return <CommandesModule       activeSociety={activeSociety} profile={profile}/>
      case "playlists":         return <PlaylistsModule       activeSociety={activeSociety} profile={profile}/>
      case "tournees":          return <TourneesModule        activeSociety={activeSociety} profile={profile} onLaunchOnMap={(t:any)=>setActiveTournee(t)} onSwitchToMap={()=>openTab("map")}/>
      case "prospects":         return <ProspectsModule       activeSociety={activeSociety} profile={profile} onShowOnMap={(p:any)=>setFocusProspect(p)} onSwitchToMap={()=>openTab("map")} onSwitchToTournees={()=>openTab("tournees")}/>
      case "map":               return <MapModule             activeSociety={activeSociety} profile={profile} focusProspect={focusProspect} activeTournee={activeTournee} onClearFocus={()=>{setFocusProspect(null);setActiveTournee(null)}} onSwitchToProspects={()=>openTab("prospects")}/>
      case "messages":          return <MessagesModule        activeSociety={activeSociety} profile={profile}/>
      case "parametres":        return <ParametresModule      activeSociety={activeSociety} profile={profile}/>
      case "agenda":            return <AgendaModule          activeSociety={activeSociety} profile={profile}/>
      case "admin":             return <AdminGate             activeSociety={activeSociety} profile={profile}/>
      case "ia":                return <IAModule              activeSociety={activeSociety} profile={profile}/>
      default: return <div className="flex-1 flex items-center justify-center"><div className="text-center"><p className="text-5xl mb-4">🚧</p><p className="text-white font-bold">{activeTabMeta?.label}</p></div></div>
    }
  }

  const baseFontSize=({small:"13px",normal:"14px",large:"16px"} as any)[settings.font_size]||"14px"
  const cardRadius=({rounded:"12px",sharp:"4px",pill:"20px"} as any)[settings.card_style]||"12px"

  const renderNavItem=(tab:any)=>{
    const isActive=activeTab===tab.id; const isOpen=openTabs.some(t=>t.id===tab.id)
    return(
      <button key={tab.id} onClick={()=>openTab(tab.id)}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 relative"
        style={{backgroundColor:isActive?(tab.restricted?"#ef444420":ACCENT+"18"):"rgba(39,39,42,0.55)",color:tab.restricted?(isActive?"#ef4444":"#7f3333"):(isActive?ACCENT:"#a1a1aa"),border:isActive?`1px solid ${tab.restricted?"#ef444455":ACCENT+"60"}`:"1px solid rgba(63,63,70,0.5)",boxShadow:isActive?`0 0 16px ${ACCENT}15`:"none"}}
        onMouseEnter={e=>{if(!isActive){const el=e.currentTarget as HTMLElement;el.style.backgroundColor=ACCENT+"12";el.style.color=tab.restricted?"#ef4444":ACCENT;el.style.borderColor=ACCENT+"35"}}}
        onMouseLeave={e=>{if(!isActive){const el=e.currentTarget as HTMLElement;el.style.backgroundColor="rgba(39,39,42,0.55)";el.style.color=tab.restricted?"#7f3333":"#a1a1aa";el.style.borderColor="rgba(63,63,70,0.5)"}}}>
        {isActive&&<span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{backgroundColor:tab.restricted?"#ef4444":ACCENT}}/>}
        <span className="text-sm shrink-0">{tab.icon}</span>
        <span className="flex-1 truncate text-left">{tab.label}</span>
        {isOpen&&!isActive&&<span className="w-1.5 h-1.5 rounded-full shrink-0" style={{backgroundColor:ACCENT+"80"}}/>}
        {tab.restricted&&<span className="text-[9px] text-red-500/70 shrink-0">🔒</span>}
        {tab.id==="messages"&&unreadMessages>0&&<span className="text-black text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shrink-0" style={{backgroundColor:ACCENT}}>{unreadMessages>9?"9+":unreadMessages}</span>}
      </button>
    )
  }

  const SidebarInner=()=>(
    <>
      <div className="px-3 pt-3 pb-3 border-b border-zinc-800/60 shrink-0">
        <div className="flex items-center gap-2 mb-2.5">
          <img src="/logo.png" alt="Butt Premium" className="h-8 w-auto"/>
          {activeSociety&&<div className="flex items-center gap-1 min-w-0"><div className="w-1.5 h-1.5 rounded-full shrink-0" style={{backgroundColor:activeSociety.color||ACCENT}}/><p className="text-zinc-500 text-[10px] truncate">{activeSociety.name}</p></div>}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {visibleNav.map(({section,items})=>{
          const isCollapsed=collapsedSections.has(section)
          const hasActive=items.some(t=>t.id===activeTab)
          const hasOpen=items.some(t=>openTabs.some(ot=>ot.id===t.id))
          return(
            <div key={section} className="mb-0.5">
              <button onClick={()=>toggleSection(section)} className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors group mb-0.5">
                <div className="flex items-center gap-1.5">
                  <p className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${hasActive?"text-zinc-300":"text-zinc-600 group-hover:text-zinc-400"}`}>{section}</p>
                  {isCollapsed&&(hasActive||hasOpen)&&<span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:ACCENT}}/>}
                </div>
                <span className={`text-zinc-600 group-hover:text-zinc-400 text-[8px] transition-all duration-200 ${isCollapsed?"":"rotate-90"}`} style={{display:"inline-block"}}>▶</span>
              </button>
              {!isCollapsed&&<div className="space-y-0.5 px-0.5">{items.map(tab=>renderNavItem(tab))}</div>}
            </div>
          )
        })}
      </nav>
      {onlineUsers.length>0&&(
        <div className="border-t border-zinc-800/60 px-2 pt-2 pb-1 shrink-0">
          <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest px-1 mb-1">Équipe · <span className={onlineCount>0?"text-green-500":"text-zinc-600"}>{onlineCount>0?`${onlineCount} en ligne`:"hors ligne"}</span></p>
          <div className="space-y-0.5 max-h-16 overflow-y-auto">
            {onlineUsers.slice(0,4).map(u=>(
              <button key={u.id} onClick={()=>openTab("messages")} className="w-full flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-zinc-800/50 transition-colors">
                <div className="relative shrink-0"><UserAvatar nom={u.nom} url={u.avatar_url} color={u.color} size={20}/><span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${PRESENCE[u.status].dot} ring-1 ring-[#0d0d0d]`}/></div>
                <p className="text-zinc-500 text-[10px] truncate">{u.nom}</p>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="border-t border-zinc-800/60 p-2 shrink-0">
        <div className="relative" ref={statusMenuRef}>
          <button onClick={()=>setShowStatusMenu(p=>!p)} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-zinc-800/60 transition-colors" style={{backgroundColor:"rgba(39,39,42,0.5)",border:"1px solid rgba(63,63,70,0.5)"}}>
            <div className="relative shrink-0"><UserAvatar nom={profile?.nom||"?"} url={profile?.avatar_url} color={profile?.color} size={26}/><span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${myCfg.dot} ring-1 ring-[#0d0d0d]`}/></div>
            <div className="flex-1 min-w-0 text-left"><p className="text-white text-[11px] font-semibold truncate">{profile?.nom}</p><p className={`text-[9px] font-medium ${myCfg.color}`}>{myCfg.label}</p></div>
            <span className="text-zinc-600 text-[10px]">▾</span>
          </button>
          {showStatusMenu&&(
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1a1a1a] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider px-3 pt-2 pb-1">Statut</p>
              {(Object.entries(PRESENCE) as [PresenceStatus,typeof PRESENCE[PresenceStatus]][]).map(([s,cfg])=>(
                <button key={s} onClick={()=>updateStatus(s)} className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-800 transition-colors ${myStatus===s?"bg-zinc-800/60":""}`}>
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`}/><span className={`text-[13px] ${myStatus===s?"text-white font-semibold":"text-zinc-400"}`}>{cfg.label}</span>
                  {myStatus===s&&<span className="ml-auto text-[11px] font-bold" style={{color:ACCENT}}>✓</span>}
                </button>
              ))}
              <div className="border-t border-zinc-800 mt-1">
                <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors text-[13px]"><span>→</span> Déconnexion</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )

  if(APP_THEME==="2") return(
    <Theme2Layout activeSociety={activeSociety} profile={profile} activeTab={activeTab} openTab={openTab} openTabs={openTabs} closeTab={closeTab} visibleNav={visibleNav} renderContent={renderContent} ACCENT={ACCENT} BG={BG} BG_GRADIENT={BG_GRADIENT} baseFontSize={baseFontSize} cardRadius={cardRadius} unreadMessages={unreadMessages} onlineCount={onlineCount} myStatus={myStatus} showStatusMenu={showStatusMenu} setShowStatusMenu={setShowStatusMenu} statusMenuRef={statusMenuRef} logout={logout} showConvPopup={showConvPopup} setShowConvPopup={setShowConvPopup} activeConvention={activeConvention}/>
  )

  return(
    <div className="h-screen text-white flex overflow-hidden" style={{background:BG_GRADIENT||BG,fontSize:baseFontSize,["--card-radius" as any]:cardRadius}}>
      {sidebarOpen&&<div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={()=>setSidebarOpen(false)}/>}
      <aside className="hidden md:flex w-56 border-r border-zinc-900 flex-col shrink-0 h-screen overflow-hidden" style={{backgroundColor:SIDEBAR_BG}}><SidebarInner/></aside>
      {sidebarOpen&&(
        <aside className="fixed top-0 left-0 h-full w-64 z-50 flex flex-col border-r border-zinc-800/60 md:hidden overflow-y-auto" style={{backgroundColor:"#0d0d0d"}}>
          <button onClick={()=>setSidebarOpen(false)} className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white">✕</button>
          <SidebarInner/>
        </aside>
      )}
      <div className="flex-1 overflow-hidden flex flex-col">
        <button onClick={()=>setSidebarOpen(true)} className="md:hidden fixed top-3 left-3 z-30 w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl shadow-xl border border-zinc-700 bg-zinc-900">
          <span className="w-5 h-0.5 rounded-full" style={{backgroundColor:ACCENT}}/><span className="w-5 h-0.5 rounded-full" style={{backgroundColor:ACCENT}}/><span className="w-3.5 h-0.5 rounded-full" style={{backgroundColor:ACCENT}}/>
        </button>
        {/* Barre onglets */}
        <div className="shrink-0 border-b border-zinc-800/60 flex items-center overflow-x-auto" style={{backgroundColor:SIDEBAR_BG,minHeight:"40px"}}>
          <div className="flex items-center px-2 gap-1">
            {openTabs.map(tab=>{
              const meta=ALL_TABS_FLAT.find(t=>t.id===tab.id); const isActive=activeTab===tab.id; if(!meta)return null
              return(
                <div key={tab.id} onClick={()=>setActiveTab(tab.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer shrink-0 transition-all duration-150 group/tab"
                  style={{backgroundColor:isActive?ACCENT+"18":"rgba(39,39,42,0.4)",border:isActive?`1px solid ${ACCENT}50`:"1px solid rgba(63,63,70,0.4)",color:isActive?ACCENT:"#71717a"}}>
                  <span className="text-xs">{meta.icon}</span>
                  <span className="text-[12px] font-medium whitespace-nowrap">{meta.label}</span>
                  <button onClick={e=>closeTab(tab.id,e)} className="ml-0.5 w-4 h-4 rounded flex items-center justify-center text-[10px] opacity-40 hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all">✕</button>
                </div>
              )
            })}
          </div>
        </div>
        <main className="flex-1 overflow-hidden flex flex-col" style={{backgroundColor:BG}}>
          {renderContent()}
          {showConvPopup&&activeConvention&&(
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#111111] border border-zinc-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
                <div className="px-6 pt-6 pb-4 text-center" style={{background:"linear-gradient(135deg, #eab30815, transparent)"}}>
                  <div className="text-5xl mb-3">🎪</div>
                  <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1 mb-3"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/><span className="text-green-400 text-xs font-bold">Convention en cours</span></div>
                  <h2 className="text-white font-bold text-xl">{activeConvention.nom}</h2>
                  {activeConvention.lieu&&<p className="text-zinc-500 text-sm mt-1">📍 {activeConvention.lieu}</p>}
                </div>
                <div className="px-6 pb-6 pt-4 space-y-2 border-t border-zinc-800">
                  <button onClick={()=>{setShowConvPopup(false);openTab("conventions")}} className="w-full py-3 rounded-xl text-black font-bold text-sm" style={{backgroundColor:ACCENT}}>📋 Aller à la convention</button>
                  <button onClick={()=>setShowConvPopup(false)} className="w-full py-3 rounded-xl text-zinc-400 font-medium text-sm bg-zinc-900 hover:bg-zinc-800">Continuer</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      {showUnreadPopup&&unreadNotifs.length>0&&<UnreadMessagesPopup notifs={unreadNotifs} ACCENT={ACCENT} onGoToMessages={()=>{openTab("messages");setShowUnreadPopup(false)}} onClose={()=>setShowUnreadPopup(false)}/>}
      {stockAlerts.length>0&&showStockAlert&&<StockAlertPopup alerts={stockAlerts} onGoToStock={()=>{openTab("stocks");setShowStockAlert(false)}} onClose={()=>setShowStockAlert(false)}/>}
    </div>
  )
}

export default function DashboardPage() {
  const router=useRouter()
  const [loading,setLoading]=useState(true)
  const [activeSociety,setActiveSociety]=useState<any>(null)
  const [profile,setProfile]=useState<any>(null)
  useEffect(()=>{
    const init=async()=>{
      try{
        const{data:{session}}=await supabase.auth.getSession()
        if(!session){router.push("/");return}
        let{data:prof}=await supabase.from("profiles").select("*").eq("id",session.user.id).single()
        if(!prof){
          const nom=session.user.user_metadata?.full_name||session.user.email?.split("@")[0]||"Utilisateur"
          const{data:soc}=await supabase.from("societies").select("id").limit(1).single()
          await supabase.from("profiles").insert({id:session.user.id,nom,email:session.user.email,society_id:soc?.id,role:"vendeur",is_active:true})
          const{data:newProf}=await supabase.from("profiles").select("*").eq("id",session.user.id).single()
          prof=newProf
        }
        if(prof)setProfile({...prof,email:session.user.email})
        const{data:socs}=await supabase.from("societies").select("*").eq("active",true)
        if(socs?.length)setActiveSociety(socs[0])
      }catch(err){console.error("init error:",err)}
      finally{setLoading(false)}
    }
    init()
  },[router])
  if(loading)return(<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/></div>)
  if(!profile)return(<div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4"><p className="text-white font-bold">Problème de chargement</p><button onClick={()=>window.location.reload()} className="bg-yellow-500 text-black font-bold px-6 py-2.5 rounded-xl hover:bg-yellow-400">Réessayer</button><button onClick={async()=>{await supabase.auth.signOut();router.push("/")}} className="text-zinc-500 text-sm hover:text-white">Se déconnecter</button></div>)
  return(<UserSettingsProvider userId={profile.id}><InnerDashboard profile={profile} activeSociety={activeSociety}/></UserSettingsProvider>)
}

function Theme2Layout({activeSociety,profile,activeTab,openTab,openTabs,closeTab,visibleNav,renderContent,ACCENT,BG,BG_GRADIENT,baseFontSize,cardRadius,unreadMessages,onlineCount,myStatus,showStatusMenu,setShowStatusMenu,statusMenuRef,logout,showConvPopup,setShowConvPopup,activeConvention}:any){
  const allTabs=visibleNav.flatMap((s:any)=>s.items); const NEON="#a855f7"
  return(
    <div className="h-screen text-white flex flex-col overflow-hidden" style={{background:BG_GRADIENT||BG,fontSize:baseFontSize,["--card-radius" as any]:cardRadius}}>
      <header className="shrink-0 border-b z-30" style={{backgroundColor:BG==="#0a0a0a"?"#08080f":BG+"ee",borderColor:NEON+"30"}}>
        <div className="flex items-center justify-between px-4 py-2 border-b" style={{borderColor:NEON+"20"}}>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Butt Premium" className="h-8 w-auto"/>
            {activeSociety&&<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{backgroundColor:NEON+"15",border:`1px solid ${NEON}30`}}><div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor:NEON}}/><span className="text-xs font-bold" style={{color:NEON}}>{activeSociety.name}</span></div>}
          </div>
          <div className="flex items-center gap-2">
            {onlineCount>0&&<div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/><span className="text-green-400 text-xs font-semibold">{onlineCount} en ligne</span></div>}
            <div className="flex items-center gap-2 cursor-pointer" onClick={()=>setShowStatusMenu(!showStatusMenu)}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-black" style={{backgroundColor:NEON}}>{profile?.nom?.charAt(0)?.toUpperCase()||"?"}</div>
            </div>
            {showStatusMenu&&<div ref={statusMenuRef} className="absolute top-14 right-4 bg-zinc-900 border rounded-xl shadow-2xl z-50 overflow-hidden w-40" style={{borderColor:NEON+"30"}}><button onClick={()=>{logout();setShowStatusMenu(false)}} className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 text-sm">🚪 Déconnexion</button></div>}
          </div>
        </div>
        <nav className="flex overflow-x-auto gap-0.5 px-2 py-1.5 scrollbar-hide">
          {allTabs.map((tab:any)=>{const isActive=activeTab===tab.id;return(<button key={tab.id} onClick={()=>openTab(tab.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 relative" style={isActive?{backgroundColor:NEON+"20",color:NEON,border:`1px solid ${NEON}50`}:{color:"#52525b",border:"1px solid transparent"}}>{isActive&&<span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full" style={{backgroundColor:NEON}}/>}<span>{tab.icon}</span><span>{tab.label}</span>{tab.id==="messages"&&unreadMessages>0&&<span className="text-black text-[9px] font-black min-w-[14px] h-3.5 px-1 rounded-full flex items-center justify-center" style={{backgroundColor:NEON}}>{unreadMessages>9?"9+":unreadMessages}</span>}</button>)})}
        </nav>
      </header>
      <main className="flex-1 overflow-hidden flex flex-col" style={{backgroundColor:BG}}>{renderContent()}</main>
      {showConvPopup&&activeConvention&&(<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="rounded-2xl w-full max-w-sm shadow-2xl p-6 border" style={{backgroundColor:"#0d0d18",borderColor:NEON+"40"}}><div className="flex items-center gap-2 mb-4"><span className="text-2xl">🎪</span><h2 className="text-white font-bold">{activeConvention.nom}</h2></div><div className="flex gap-2"><button onClick={()=>{setShowConvPopup(false);openTab("conventions")}} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black" style={{backgroundColor:NEON}}>📋 Convention</button><button onClick={()=>setShowConvPopup(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-zinc-800 text-zinc-300">Plus tard</button></div></div></div>)}
    </div>
  )
}