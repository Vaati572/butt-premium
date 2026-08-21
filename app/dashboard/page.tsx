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

const ADMIN_PIN = "18072209"

type PresenceStatus = "online" | "busy" | "away" | "meeting" | "offline"
interface OnlineUser { id: string; nom: string; avatar_url?: string; color?: string; status: PresenceStatus }
interface UnreadNotif { sender_nom: string; content: string; file_name?: string | null; conv_name: string; conv_id: string; count: number }

interface SidebarFolder {
  id: string
  name: string
  collapsed: boolean
  items: string[]
  color?: string
  icon?: string
}

interface SidebarLayout {
  folders: SidebarFolder[]
  unassigned: string[]
  hidden: string[]
}

const PRESENCE: Record<PresenceStatus, { label: string; color: string; dot: string }> = {
  online:  { label: "En ligne",   color: "text-emerald-400", dot: "bg-emerald-400" },
  busy:    { label: "Occupé",     color: "text-rose-400",    dot: "bg-rose-400" },
  away:    { label: "Absent",     color: "text-amber-400",   dot: "bg-amber-400" },
  meeting: { label: "En réunion", color: "text-violet-400",  dot: "bg-violet-400" },
  offline: { label: "Hors ligne", color: "text-zinc-500",    dot: "bg-zinc-600" },
}

const ALL_MODULES = [
  { id: "vente",            label: "Vente",           icon: "🛒" },
  { id: "social_prospects", label: "Instagram",       icon: "📱" },
  { id: "suivi",            label: "Suivi clients",   icon: "📋" },
  { id: "stocks",           label: "Stock",           icon: "📦" },
  { id: "prospection",      label: "Prospection",     icon: "💊" },
  { id: "agenda",           label: "Agenda",          icon: "📅" },
  { id: "taches",           label: "Liste des tâches",icon: "✅" },
  { id: "pharmacies",       label: "Pharmacies",      icon: "🏥" },
  { id: "commandes",        label: "Fournisseurs",    icon: "🏭" },
  { id: "clients",          label: "Clients",         icon: "👤" },
  { id: "conventions",      label: "Conventions",     icon: "🎪" },
  { id: "stats",            label: "Statistiques",    icon: "📊" },
  { id: "historique",       label: "Historique",      icon: "🕓" },
  { id: "depenses",         label: "Dépenses",        icon: "💸" },
  { id: "facturesdevis",    label: "Factures & Devis",icon: "📄" },
  { id: "contrats",         label: "Contrats",        icon: "📑" },
  { id: "messages",         label: "Messages",        icon: "💬" },
  { id: "notes",            label: "Notes",           icon: "📝" },
  { id: "documents",        label: "Documents",       icon: "📁" },
  { id: "prospects",        label: "Prospects",       icon: "🎯" },
  { id: "tournees",         label: "Tournées",        icon: "🛣️" },
  { id: "map",              label: "Carte",           icon: "🗺️" },
  { id: "ia",               label: "IA",              icon: "🤖" },
  { id: "accueil",          label: "Accueil",         icon: "🏠" },
  { id: "admin",            label: "Admin",           icon: "🔒" },
  { id: "parametres",       label: "Paramètres",      icon: "⚙️" },
]

const FOLDER_ICONS = ["📁", "📂", "🗂️", "📋", "📊", "💼", "🎯", "⚡", "🔥", "⭐", "💡", "🛠️"]
const FOLDER_COLORS = ["#eab308", "#f97316", "#ef4444", "#ec4899", "#a855f7", "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#84cc16"]

const DEFAULT_LAYOUT: SidebarLayout = {
  folders: [],
  unassigned: ALL_MODULES.map(m => m.id),
  hidden: [],
}

function moveInArray<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function UserAvatar({ nom, url, color, size = 32 }: { nom: string; url?: string; color?: string; size?: number }) {
  const palette = ["#eab308", "#f59e0b", "#d97706", "#b45309", "#ca8a04"]
  const bg = color || palette[(nom?.charCodeAt(0) || 0) % palette.length]
  const initials = nom?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center font-semibold text-black shrink-0"
      style={{ width: size, height: size, backgroundColor: url ? undefined : bg, fontSize: size * 0.34 }}
    >
      {url ? <img src={url} className="w-full h-full object-cover" alt={nom} /> : initials}
    </div>
  )
}

function UnreadMessagesPopup({ notifs, onGoToMessages, onClose, ACCENT }: any) {
  const total = notifs.reduce((s: number, n: any) => s + n.count, 0)
  const [progress, setProgress] = useState(100)
  useEffect(() => {
    const t = setInterval(() => setProgress(p => p <= 0 ? (clearInterval(t), onClose(), 0) : p - 1.25), 100)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="fixed bottom-5 right-5 z-[100] w-[340px]">
      <div className="bg-[#141416] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: ACCENT + "22" }}>💬</div>
            <div>
              <p className="text-sm font-semibold text-white">Messages non lus</p>
              <p className="text-xs text-zinc-400">{total} message{total > 1 ? "s" : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-sm">✕</button>
        </div>
        <div className="px-4 pb-3 space-y-2 max-h-40 overflow-y-auto">
          {notifs.slice(0, 3).map((n: any, i: number) => (
            <div key={i} className="flex items-center gap-2.5 text-sm">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black shrink-0" style={{ background: ACCENT }}>
                {n.sender_nom?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white truncate font-medium">{n.sender_nom}</p>
                <p className="text-zinc-400 text-xs truncate">{n.content || `📎 ${n.file_name}`}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 pb-4 flex gap-2">
          <button onClick={onGoToMessages} className="flex-1 py-2 rounded-xl text-sm font-semibold text-black" style={{ background: ACCENT }}>Ouvrir</button>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-zinc-400 bg-white/5 hover:bg-white/10">Plus tard</button>
        </div>
        <div className="h-0.5 bg-white/5"><div className="h-full transition-all" style={{ width: `${progress}%`, background: ACCENT }} /></div>
      </div>
    </div>
  )
}

function StockAlertPopup({ alerts, onGoToStock, onClose }: any) {
  const [progress, setProgress] = useState(100)
  useEffect(() => {
    const t = setInterval(() => setProgress(p => p <= 0 ? (clearInterval(t), onClose(), 0) : p - 0.8), 80)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="fixed bottom-5 left-5 z-[100] w-[300px]">
      <div className="bg-[#141416] border border-rose-500/25 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center">⚠️</div>
            <div>
              <p className="text-sm font-semibold text-white">Stocks critiques</p>
              <p className="text-xs text-zinc-400">{alerts.length} produit{alerts.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>
        <div className="px-4 pb-3 space-y-1.5 max-h-28 overflow-y-auto">
          {alerts.slice(0, 4).map((a: any, i: number) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-zinc-300 truncate">{a.produit_nom}</span>
              <span className={a.quantite < 0 ? "text-rose-400 font-medium" : "text-amber-400 font-medium"}>{a.quantite}</span>
            </div>
          ))}
        </div>
        <div className="px-4 pb-4 flex gap-2">
          <button onClick={onGoToStock} className="flex-1 py-2 rounded-xl text-sm font-semibold text-black bg-rose-500 hover:bg-rose-400">Voir le stock</button>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-zinc-400 bg-white/5">Plus tard</button>
        </div>
        <div className="h-0.5 bg-white/5"><div className="h-full bg-rose-500 transition-all" style={{ width: `${progress}%` }} /></div>
      </div>
    </div>
  )
}

function TachesAlertPopup({ taches, onGoToTaches, onClose }: any) {
  const [progress, setProgress] = useState(100)
  useEffect(() => {
    const t = setInterval(() => setProgress(p => p <= 0 ? (clearInterval(t), onClose(), 0) : p - 0.7), 80)
    return () => clearInterval(t)
  }, [])
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div className="fixed top-5 right-5 z-[100] w-[320px]">
      <div className="bg-[#141416] border border-amber-500/25 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">✅</div>
            <div>
              <p className="text-sm font-semibold text-white">Tâches à traiter</p>
              <p className="text-xs text-zinc-400">{taches.length} tâche{taches.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>
        <div className="px-4 pb-3 space-y-2 max-h-32 overflow-y-auto">
          {taches.slice(0, 4).map((t: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-zinc-300 truncate">{t.titre}</span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                t.echeance === today ? "bg-amber-500/20 text-amber-400" :
                t.priorite === "urgente" ? "bg-rose-500/20 text-rose-400" : "bg-zinc-700 text-zinc-400"
              }`}>
                {t.echeance === today ? "Aujourd'hui" : t.priorite === "urgente" ? "Urgent" : "Retard"}
              </span>
            </div>
          ))}
        </div>
        <div className="px-4 pb-4 flex gap-2">
          <button onClick={onGoToTaches} className="flex-1 py-2 rounded-xl text-sm font-semibold text-black bg-amber-500 hover:bg-amber-400">Voir les tâches</button>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-zinc-400 bg-white/5">Plus tard</button>
        </div>
        <div className="h-0.5 bg-white/5"><div className="h-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} /></div>
      </div>
    </div>
  )
}

function AccessDeniedPanel({ tabLabel }: { tabLabel: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4 text-2xl">🚫</div>
        <h2 className="text-base font-semibold text-white mb-1">Accès non autorisé</h2>
        <p className="text-sm text-zinc-500">Tu n’as pas accès au module « {tabLabel} »</p>
      </div>
    </div>
  )
}

function AdminGate({ activeSociety, profile }: any) {
  const [pin, setPin] = useState("")
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState(false)

  const handle = (d: string) => {
    if (pin.length >= 8) return
    const next = pin + d
    setPin(next)
    setError(false)
    if (next.length === 8) {
      if (next === ADMIN_PIN) setUnlocked(true)
      else { setError(true); setTimeout(() => setPin(""), 500) }
    }
  }

  if (unlocked) return <AdminModule activeSociety={activeSociety} profile={profile} />

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-80 bg-[#141416] border border-white/10 rounded-2xl p-8 text-center">
        <div className="text-3xl mb-3">🔒</div>
        <h2 className="text-lg font-semibold text-white mb-1">Panneau Admin</h2>
        <p className="text-xs text-zinc-500 mb-6">Code PIN administrateur</p>
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < pin.length ? (error ? "bg-rose-500" : "bg-yellow-500") : "bg-zinc-700"}`} />
          ))}
        </div>
        {error && <p className="text-rose-400 text-xs mb-4">Code incorrect</p>}
        <div className="grid grid-cols-3 gap-2">
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
            <button
              key={i}
              onClick={() => d === "⌫" ? setPin(p => p.slice(0,-1)) : d ? handle(d) : null}
              className={`h-12 rounded-xl text-base font-medium transition-colors ${
                d === "⌫" ? "bg-white/5 text-zinc-400 hover:bg-white/10" :
                d === "" ? "invisible" : "bg-white/5 text-white hover:bg-yellow-500 hover:text-black"
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

function OnboardingPopup({ onDismiss, ACCENT }: { onDismiss: () => void; ACCENT: string }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4">
      <div className="bg-[#141416] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-4 text-2xl">✨</div>
          <h2 className="text-lg font-semibold text-white mb-2">Personnalisez vos onglets</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Créez des dossiers, rangez les modules et réorganisez la barre latérale comme vous voulez.
          </p>
        </div>
        <div className="px-6 pb-6">
          <button onClick={onDismiss} className="w-full py-2.5 rounded-xl text-sm font-semibold text-black" style={{ background: ACCENT }}>
            Compris
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   ORGANIZER MODAL
═══════════════════════════════════════════ */
function OrganizerModal({ layout, setLayout, onClose, ACCENT }: {
  layout: SidebarLayout
  setLayout: (l: SidebarLayout) => void
  onClose: () => void
  ACCENT: string
}) {
  const [newFolderName, setNewFolderName] = useState("")
  const [newFolderIcon, setNewFolderIcon] = useState("📁")
  const [newFolderColor, setNewFolderColor] = useState("#eab308")
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editIcon, setEditIcon] = useState("📁")
  const [editColor, setEditColor] = useState("#eab308")
  const [search, setSearch] = useState("")
  const [dragItem, setDragItem] = useState<{ type: "module" | "folder"; id: string; fromFolder?: string; index: number } | null>(null)
  const [dropIndicator, setDropIndicator] = useState<{ folderId: string | null; index: number } | null>(null)

  const save = (next: SidebarLayout) => setLayout(next)
  const getMeta = (id: string) => ALL_MODULES.find(m => m.id === id)
  const matchesSearch = (label: string) => !search.trim() || label.toLowerCase().includes(search.toLowerCase())

  const createFolder = () => {
    const name = newFolderName.trim()
    if (!name) return
    save({
      ...layout,
      folders: [...layout.folders, { id: `folder_${Date.now()}`, name, collapsed: false, items: [], icon: newFolderIcon, color: newFolderColor }],
    })
    setNewFolderName("")
    setNewFolderIcon("📁")
    setNewFolderColor("#eab308")
  }

  const saveEditFolder = (id: string) => {
    if (!editName.trim()) return
    save({
      ...layout,
      folders: layout.folders.map(f => f.id === id ? { ...f, name: editName.trim(), icon: editIcon, color: editColor } : f),
    })
    setEditingFolder(null)
  }

  const deleteFolder = (id: string) => {
    const folder = layout.folders.find(f => f.id === id)
    if (!folder) return
    save({ ...layout, folders: layout.folders.filter(f => f.id !== id), unassigned: [...layout.unassigned, ...folder.items] })
  }

  const hideModule = (id: string) => {
    save({
      folders: layout.folders.map(f => ({ ...f, items: f.items.filter(i => i !== id) })),
      unassigned: layout.unassigned.filter(i => i !== id),
      hidden: [...layout.hidden, id],
    })
  }

  const unhideModule = (id: string) => {
    save({ ...layout, hidden: layout.hidden.filter(i => i !== id), unassigned: [...layout.unassigned, id] })
  }

  const onDragStart = (e: React.DragEvent, type: "module" | "folder", id: string, index: number, fromFolder?: string) => {
    setDragItem({ type, id, index, fromFolder })
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", id)
    requestAnimationFrame(() => { (e.target as HTMLElement).style.opacity = "0.4" })
  }

  const onDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1"
    setDragItem(null)
    setDropIndicator(null)
  }

  const onDragOverItem = (e: React.DragEvent, folderId: string | null, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "move"
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const insertIndex = e.clientY < rect.top + rect.height / 2 ? index : index + 1
    setDropIndicator({ folderId, index: insertIndex })
  }

  const onDropModule = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!dragItem || dragItem.type !== "module" || !dropIndicator) return
    const { folderId: targetFolderId, index: targetIndex } = dropIndicator
    const nextFolders = layout.folders.map(f => ({ ...f, items: [...f.items] }))
    let nextUnassigned = [...layout.unassigned]

    if (dragItem.fromFolder) {
      const folder = nextFolders.find(f => f.id === dragItem.fromFolder)
      if (folder) folder.items = folder.items.filter(id => id !== dragItem.id)
    } else {
      nextUnassigned = nextUnassigned.filter(id => id !== dragItem.id)
    }

    let finalIndex = targetIndex
    if (dragItem.fromFolder === targetFolderId && dragItem.index < targetIndex) finalIndex = targetIndex - 1

    if (targetFolderId === null) nextUnassigned.splice(finalIndex, 0, dragItem.id)
    else {
      const folder = nextFolders.find(f => f.id === targetFolderId)
      if (folder) folder.items.splice(finalIndex, 0, dragItem.id)
    }

    save({ ...layout, folders: nextFolders, unassigned: nextUnassigned })
    setDragItem(null)
    setDropIndicator(null)
  }

  const onDropFolder = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (!dragItem || dragItem.type !== "folder") return
    let finalIndex = targetIndex
    if (dragItem.index < targetIndex) finalIndex = targetIndex - 1
    save({ ...layout, folders: moveInArray([...layout.folders], dragItem.index, finalIndex) })
    setDragItem(null)
    setDropIndicator(null)
  }

  const onDropOnZone = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault()
    e.stopPropagation()
    if (!dragItem || dragItem.type !== "module") return
    if (dropIndicator && dropIndicator.folderId === targetFolderId) { onDropModule(e); return }

    const nextFolders = layout.folders.map(f => ({ ...f, items: [...f.items] }))
    let nextUnassigned = [...layout.unassigned]
    if (dragItem.fromFolder) {
      const folder = nextFolders.find(f => f.id === dragItem.fromFolder)
      if (folder) folder.items = folder.items.filter(id => id !== dragItem.id)
    } else nextUnassigned = nextUnassigned.filter(id => id !== dragItem.id)

    if (targetFolderId === null) nextUnassigned.push(dragItem.id)
    else {
      const folder = nextFolders.find(f => f.id === targetFolderId)
      if (folder) folder.items.push(dragItem.id)
    }
    save({ ...layout, folders: nextFolders, unassigned: nextUnassigned })
    setDragItem(null)
    setDropIndicator(null)
  }

  const DropBar = () => <div className="h-0.5 my-0.5 rounded-full mx-2" style={{ backgroundColor: ACCENT }} />

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4">
      <div className="bg-[#141416] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <h2 className="text-base font-semibold text-white">Organiser la barre latérale</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Glisse · Personnalise · Masque</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-lg">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un module…"
              className="w-full h-9 bg-white/[0.03] border border-white/10 rounded-lg pl-9 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20" />
          </div>

          <div className="space-y-2 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-xs font-medium text-zinc-400">Nouveau dossier</p>
            <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === "Enter" && createFolder()}
              placeholder="Nom du dossier…" className="w-full h-9 bg-white/[0.03] border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none" />
            <div className="flex flex-wrap gap-1">
              {FOLDER_ICONS.map(ic => (
                <button key={ic} onClick={() => setNewFolderIcon(ic)} className={`w-7 h-7 rounded-md text-sm ${newFolderIcon === ic ? "bg-white/15" : "hover:bg-white/5"}`}>{ic}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FOLDER_COLORS.map(c => (
                <button key={c} onClick={() => setNewFolderColor(c)} className={`w-5 h-5 rounded-full ${newFolderColor === c ? "ring-2 ring-white ring-offset-1 ring-offset-[#141416]" : ""}`} style={{ background: c }} />
              ))}
            </div>
            <button onClick={createFolder} disabled={!newFolderName.trim()} className="w-full h-9 rounded-lg text-sm font-semibold text-black disabled:opacity-40" style={{ background: ACCENT }}>Créer</button>
          </div>

          {layout.folders.map((folder, folderIndex) => (
            <div key={folder.id} className="border border-white/5 rounded-xl overflow-hidden" onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move" }} onDrop={e => onDropOnZone(e, folder.id)}>
              <div
                draggable
                onDragStart={e => onDragStart(e, "folder", folder.id, folderIndex)}
                onDragEnd={onDragEnd}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move" }}
                onDrop={e => onDropFolder(e, folderIndex)}
                className="flex items-center gap-2 px-3 py-2.5 bg-white/[0.03] cursor-grab active:cursor-grabbing"
              >
                <span className="text-zinc-600 text-xs select-none">⠿</span>
                {editingFolder === folder.id ? (
                  <div className="flex-1 space-y-2">
                    <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveEditFolder(folder.id)}
                      className="w-full h-7 bg-zinc-800 border border-zinc-600 rounded px-2 text-sm text-white focus:outline-none" />
                    <div className="flex gap-1 flex-wrap">
                      {FOLDER_ICONS.map(ic => <button key={ic} onClick={() => setEditIcon(ic)} className={`w-6 h-6 rounded text-xs ${editIcon === ic ? "bg-white/15" : ""}`}>{ic}</button>)}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {FOLDER_COLORS.map(c => <button key={c} onClick={() => setEditColor(c)} className={`w-4 h-4 rounded-full ${editColor === c ? "ring-1 ring-white" : ""}`} style={{ background: c }} />)}
                    </div>
                    <button onClick={() => saveEditFolder(folder.id)} className="text-xs text-emerald-400">Sauver</button>
                  </div>
                ) : (
                  <>
                    <span>{folder.icon || "📁"}</span>
                    <span className="flex-1 text-sm font-medium text-white select-none" style={{ color: folder.color }}>{folder.name}</span>
                    <button onClick={() => { setEditingFolder(folder.id); setEditName(folder.name); setEditIcon(folder.icon || "📁"); setEditColor(folder.color || "#eab308") }} className="text-xs text-zinc-500 hover:text-white px-1">✎</button>
                    <button onClick={() => deleteFolder(folder.id)} className="text-xs text-rose-400 hover:text-rose-300 px-1">✕</button>
                  </>
                )}
              </div>
              <div className="px-2 py-2 min-h-[40px]">
                {folder.items.length === 0 && <p className="text-xs text-zinc-600 py-2 text-center">Glisse un module ici</p>}
                {folder.items.map((tabId, itemIndex) => {
                  const meta = getMeta(tabId)
                  if (!meta || !matchesSearch(meta.label)) return null
                  return (
                    <div key={tabId}>
                      {dropIndicator?.folderId === folder.id && dropIndicator.index === itemIndex && <DropBar />}
                      <div
                        draggable
                        onDragStart={e => onDragStart(e, "module", tabId, itemIndex, folder.id)}
                        onDragEnd={onDragEnd}
                        onDragOver={e => onDragOverItem(e, folder.id, itemIndex)}
                        onDrop={onDropModule}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing hover:bg-white/[0.04]"
                      >
                        <span className="text-zinc-600 text-xs select-none">⠿</span>
                        <span className="text-sm">{meta.icon}</span>
                        <span className="flex-1 text-sm text-zinc-300 select-none">{meta.label}</span>
                        <button onClick={() => hideModule(tabId)} className="text-[10px] text-zinc-600 hover:text-rose-400">👁</button>
                      </div>
                    </div>
                  )
                })}
                {dropIndicator?.folderId === folder.id && dropIndicator.index === folder.items.length && <DropBar />}
              </div>
            </div>
          ))}

          <div className="rounded-xl" onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move" }} onDrop={e => onDropOnZone(e, null)}>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">Modules non rangés</p>
            <div className="space-y-0.5 min-h-[40px]">
              {layout.unassigned.map((tabId, index) => {
                const meta = getMeta(tabId)
                if (!meta || !matchesSearch(meta.label)) return null
                return (
                  <div key={tabId}>
                    {dropIndicator?.folderId === null && dropIndicator.index === index && <DropBar />}
                    <div
                      draggable
                      onDragStart={e => onDragStart(e, "module", tabId, index)}
                      onDragEnd={onDragEnd}
                      onDragOver={e => onDragOverItem(e, null, index)}
                      onDrop={onDropModule}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing hover:bg-white/[0.04]"
                    >
                      <span className="text-zinc-600 text-xs select-none">⠿</span>
                      <span className="text-sm">{meta.icon}</span>
                      <span className="flex-1 text-sm text-zinc-300 select-none">{meta.label}</span>
                      <button onClick={() => hideModule(tabId)} className="text-[10px] text-zinc-600 hover:text-rose-400">👁</button>
                    </div>
                  </div>
                )
              })}
              {dropIndicator?.folderId === null && dropIndicator.index === layout.unassigned.length && <DropBar />}
            </div>
          </div>

          {layout.hidden.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">Masqués</p>
              {layout.hidden.map(id => {
                const meta = getMeta(id)
                if (!meta || !matchesSearch(meta.label)) return null
                return (
                  <div key={id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg opacity-50">
                    <span className="text-sm">{meta.icon}</span>
                    <span className="flex-1 text-sm text-zinc-400">{meta.label}</span>
                    <button onClick={() => unhideModule(id)} className="text-[10px] text-zinc-500 hover:text-white">Restaurer</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/5 flex items-center justify-between">
          <button onClick={() => confirm("Réinitialiser toute l’organisation ?") && save(DEFAULT_LAYOUT)} className="text-xs text-zinc-500 hover:text-rose-400">Réinitialiser</button>
          <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-semibold text-black" style={{ background: ACCENT }}>Terminé</button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   INNER DASHBOARD
═══════════════════════════════════════════ */
function InnerDashboard({ profile, activeSociety }: any) {
  const { settings } = useUserSettings()
  const router = useRouter()
  const ACCENT = settings.accent_color || "#eab308"
  const BG = "#09090b"

  const [openTabs, setOpenTabs] = useState<string[]>(["accueil"])
  const [activeTab, setActiveTab] = useState("accueil")
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
  const [layout, setLayout] = useState<SidebarLayout>(DEFAULT_LAYOUT)
  const [showOrganizer, setShowOrganizer] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const heartbeatRef = useRef<any>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)
  const LAYOUT_KEY = `sidebar_layout_${profile?.id || "default"}`
  const ONBOARDING_KEY = `sidebar_onboarding_${profile?.id || "default"}`

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as SidebarLayout
        const allIds = ALL_MODULES.map(m => m.id)
        const used = new Set([...(parsed.folders || []).flatMap(f => f.items), ...(parsed.unassigned || []), ...(parsed.hidden || [])])
        const missing = allIds.filter(id => !used.has(id))
        setLayout({ folders: parsed.folders || [], unassigned: [...(parsed.unassigned || []), ...missing], hidden: parsed.hidden || [] })
      }
    } catch {}
  }, [profile?.id])

  useEffect(() => {
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)) } catch {}
  }, [layout])

  useEffect(() => {
    if (activeTab === "accueil") {
      const dismissed = localStorage.getItem(ONBOARDING_KEY)
      if (!dismissed) setShowOnboarding(true)
    }
  }, [activeTab])

  const dismissOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, "1")
    setShowOnboarding(false)
  }

  const openTab = (id: string) => {
    setOpenTabs(prev => prev.includes(id) ? prev : [...prev, id])
    setActiveTab(id)
  }

  const closeTab = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setOpenTabs(prev => {
      const next = prev.filter(t => t !== id)
      if (next.length === 0) return ["accueil"]
      if (activeTab === id) setActiveTab(next[next.length - 1])
      return next
    })
  }

  const toggleFolder = (folderId: string) => {
    setLayout(prev => ({ ...prev, folders: prev.folders.map(f => f.id === folderId ? { ...f, collapsed: !f.collapsed } : f) }))
  }

  // Presence
  useEffect(() => {
    if (!profile?.id || !activeSociety?.id) return
    const beat = async () => {
      await supabase.from("user_presence").upsert({
        user_id: profile.id, society_id: activeSociety.id, status: myStatus,
        last_seen: new Date().toISOString(), nom: profile.nom, avatar_url: profile.avatar_url, color: profile.color,
      }, { onConflict: "user_id" })
    }
    beat()
    heartbeatRef.current = setInterval(beat, 30000)
    loadUsers()
    const ch = supabase.channel("presence-dash").on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, () => loadUsers()).subscribe()
    return () => { clearInterval(heartbeatRef.current); supabase.removeChannel(ch) }
  }, [profile?.id, activeSociety?.id, myStatus])

  // Messages unread
  useEffect(() => {
    if (!profile?.id || !activeSociety?.id) return
    const count = async () => {
      const { count: c } = await supabase.from("messages").select("*", { count: "exact", head: true })
        .eq("society_id", activeSociety.id).not("read_by", "cs", `{${profile.id}}`).neq("sender_id", profile.id)
      setUnreadMessages(c || 0)
    }
    count()
    const ch = supabase.channel("msg-dash").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, count).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [profile, activeSociety])

  // Stock + taches alerts
  useEffect(() => {
    if (!activeSociety?.id) return
    supabase.from("stock").select("*").eq("society_id", activeSociety.id).then(({ data }) => {
      const a = (data || []).filter((s: any) => s.quantite < 0 || (s.seuil_alerte > 0 && s.quantite <= s.seuil_alerte))
      if (a.length) { setStockAlerts(a); setShowStockAlert(true) }
    })
    const today = new Date().toISOString().slice(0, 10)
    supabase.from("liste_taches").select("*").eq("society_id", activeSociety.id).not("statut", "in", "(termine,annulee)").then(({ data }) => {
      const a = (data || []).filter((t: any) => t.priorite === "urgente" || (t.echeance && t.echeance <= today))
      if (a.length) { setTachesAlerts(a); setShowTachesAlert(true) }
    })
  }, [activeSociety?.id])

  // Convention active
  useEffect(() => {
    if (!activeSociety?.id) return
    const t = new Date().toISOString().slice(0, 10)
    supabase.from("conventions").select("*").eq("society_id", activeSociety.id).lte("date_debut", t).gte("date_fin", t).then(({ data }) => {
      if (data?.[0]) { setActiveConvention(data[0]); setShowConvPopup(true) }
    })
  }, [activeSociety?.id])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) setShowStatusMenu(false)
      if (!(e.target as HTMLElement).closest("[data-search]")) setShowGlobalSearch(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const loadUsers = async () => {
    if (!activeSociety?.id) return
    const [{ data: members }, { data: presences }] = await Promise.all([
      supabase.from("profiles").select("id,nom,avatar_url,color").eq("society_id", activeSociety.id),
      supabase.from("user_presence").select("*").eq("society_id", activeSociety.id),
    ])
    const order: any = { online: 0, meeting: 1, busy: 2, away: 3, offline: 4 }
    const users = (members || []).filter((m: any) => m.id !== profile.id).map((m: any) => {
      const p = presences?.find((x: any) => x.user_id === m.id)
      const mins = p ? (Date.now() - new Date(p.last_seen).getTime()) / 60000 : 999
      const status: PresenceStatus = !p || mins > 2 ? "offline" : p.status
      return { id: m.id, nom: m.nom, avatar_url: m.avatar_url, color: m.color, status }
    }).sort((a: any, b: any) => order[a.status] - order[b.status])
    setOnlineUsers(users)
  }

  const updateStatus = async (s: PresenceStatus) => {
    setMyStatus(s)
    setShowStatusMenu(false)
    await supabase.from("user_presence").update({ status: s, last_seen: new Date().toISOString() }).eq("user_id", profile.id)
  }

  const runGlobalSearch = async (q: string) => {
    if (q.length < 2) { setGlobalResults([]); return }
    setSearchLoading(true)
    const [{ data: clients }, { data: prospects }, { data: ventes }] = await Promise.all([
      supabase.from("clients").select("id,nom,telephone,email").eq("society_id", activeSociety.id).ilike("nom", `%${q}%`).limit(5),
      supabase.from("prospects").select("id,nom,entreprise,ville").eq("society_id", activeSociety.id).ilike("nom", `%${q}%`).limit(5),
      supabase.from("ventes").select("id,client_nom,total_ttc").eq("society_id", activeSociety.id).ilike("client_nom", `%${q}%`).order("created_at", { ascending: false }).limit(5),
    ])
    setGlobalResults([
      ...(clients || []).map((c: any) => ({ type: "client", icon: "👤", label: c.nom, sub: c.telephone || c.email, tab: "clients" })),
      ...(prospects || []).map((p: any) => ({ type: "prospect", icon: "🎯", label: p.entreprise || p.nom, sub: p.ville, tab: "prospects" })),
      ...(ventes || []).map((v: any) => ({ type: "vente", icon: "🛒", label: v.client_nom, sub: Number(v.total_ttc).toFixed(2) + " €", tab: "historique" })),
    ])
    setSearchLoading(false)
  }

  const logout = async () => {
    await supabase.from("user_presence").update({ status: "offline" }).eq("user_id", profile.id)
    clearInterval(heartbeatRef.current)
    await supabase.auth.signOut()
    router.push("/")
  }

  const isRestricted = (settings as any).hidden_tabs?.includes(activeTab)
  const activeMeta = ALL_MODULES.find(t => t.id === activeTab)
  const onlineCount = onlineUsers.filter(u => u.status !== "offline").length
  const myCfg = PRESENCE[myStatus]

  const renderTabButton = (tabId: string) => {
    const meta = ALL_MODULES.find(m => m.id === tabId)
    if (!meta || layout.hidden.includes(tabId)) return null
    const active = activeTab === tabId
    const restricted = (settings as any).hidden_tabs?.includes(tabId)
    return (
      <button
        key={tabId}
        onClick={() => openTab(tabId)}
        className={`w-full flex items-center gap-2.5 px-2.5 h-[34px] rounded-lg text-[13px] transition-all ${
          active
            ? "text-white font-medium"
            : restricted
              ? "text-zinc-600"
              : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
        }`}
        style={active ? { background: ACCENT + "18", color: ACCENT } : {}}
      >
        <span className="text-[15px] w-5 text-center opacity-90">{meta.icon}</span>
        <span className="truncate flex-1 text-left">{meta.label}</span>
        {tabId === "messages" && unreadMessages > 0 && (
          <span className="text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-black" style={{ background: ACCENT }}>
            {unreadMessages > 9 ? "9+" : unreadMessages}
          </span>
        )}
        {restricted && <span className="text-[10px]">🔒</span>}
      </button>
    )
  }

  const renderContent = () => {
    if (isRestricted) return <AccessDeniedPanel tabLabel={activeMeta?.label || activeTab} />
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
      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3 opacity-40">🚧</div>
              <p className="text-lg font-semibold text-white">{activeMeta?.label}</p>
              <p className="text-sm text-zinc-500 mt-1">Module en construction</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="h-screen flex bg-[#09090b] text-white overflow-hidden" style={{ fontSize: settings.font_size === "small" ? 13 : settings.font_size === "large" ? 15 : 14 }}>

      {/* ─── SIDEBAR ─── */}
      <aside className="hidden md:flex w-[220px] flex-col border-r border-white/[0.06] bg-[#0a0a0b]">
        {/* Logo */}
        <div className="h-13 flex items-center px-4 gap-2.5 border-b border-white/[0.06] min-h-[52px]">
          <img src="/logo.png" alt="Butt Premium" className="h-6 w-auto" />
          {activeSociety && (
            <span className="text-[11px] text-zinc-600 truncate font-medium">{activeSociety.name}</span>
          )}
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-2" data-search>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">⌕</span>
            <input
              value={globalSearch}
              onChange={e => { setGlobalSearch(e.target.value); runGlobalSearch(e.target.value); setShowGlobalSearch(true) }}
              onFocus={() => setShowGlobalSearch(true)}
              placeholder="Rechercher…"
              className="w-full h-8 bg-white/[0.03] border border-white/[0.06] rounded-lg pl-8 pr-3 text-[13px] text-white placeholder-zinc-600 focus:outline-none focus:border-white/15 transition"
            />
            {showGlobalSearch && globalSearch.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#141416] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                {searchLoading ? <p className="text-center text-xs text-zinc-500 py-4">Recherche…</p> :
                 globalResults.length === 0 ? <p className="text-center text-xs text-zinc-600 py-4">Aucun résultat</p> :
                 globalResults.map((r, i) => (
                   <button key={i} onClick={() => { openTab(r.tab); setShowGlobalSearch(false); setGlobalSearch("") }}
                     className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.04] text-left">
                     <span>{r.icon}</span>
                     <div className="min-w-0 flex-1">
                       <p className="text-sm text-white truncate">{r.label}</p>
                       {r.sub && <p className="text-xs text-zinc-500 truncate">{r.sub}</p>}
                     </div>
                   </button>
                 ))}
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-3">
          {layout.folders.map(folder => (
            <div key={folder.id}>
              <button onClick={() => toggleFolder(folder.id)} className="w-full flex items-center justify-between px-2.5 mb-0.5 group">
                <span className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 transition"
                  style={{ color: folder.collapsed ? "#52525b" : (folder.color || "#71717a") }}>
                  <span className="text-xs">{folder.icon || "📁"}</span>
                  {folder.name}
                  <span className="text-[9px] font-normal opacity-50">({folder.items.length})</span>
                </span>
                <span className={`text-[9px] text-zinc-700 transition-transform ${folder.collapsed ? "" : "rotate-90"}`}>›</span>
              </button>
              {!folder.collapsed && (
                <div className="space-y-px">
                  {folder.items.map(id => renderTabButton(id))}
                </div>
              )}
            </div>
          ))}

          {layout.unassigned.filter(id => !layout.hidden.includes(id)).length > 0 && (
            <div className="space-y-px">
              {layout.folders.length > 0 && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-700 px-2.5 mb-0.5">Autres</p>
              )}
              {layout.unassigned.map(id => renderTabButton(id))}
            </div>
          )}
        </nav>

        {/* Footer sidebar */}
        <div className="border-t border-white/[0.06] p-2.5 space-y-2">
          <button
            onClick={() => setShowOrganizer(true)}
            className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-[12px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition"
          >
            ⚙️ Organiser
          </button>

          <div className="relative" ref={statusMenuRef}>
            <button onClick={() => setShowStatusMenu(p => !p)}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition">
              <div className="relative">
                <UserAvatar nom={profile?.nom || "?"} url={profile?.avatar_url} color={profile?.color} size={28} />
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#0a0a0b] ${myCfg.dot}`} />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-[13px] font-medium text-white truncate">{profile?.nom}</p>
                <p className={`text-[11px] ${myCfg.color}`}>{myCfg.label}</p>
              </div>
            </button>

            {showStatusMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-[#141416] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                {(Object.entries(PRESENCE) as any[]).map(([s, cfg]) => (
                  <button key={s} onClick={() => updateStatus(s)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-white/[0.04] transition">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={myStatus === s ? "text-white font-medium" : "text-zinc-400"}>{cfg.label}</span>
                  </button>
                ))}
                <div className="border-t border-white/5">
                  <button onClick={logout} className="w-full px-3 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 text-left">
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>

          {onlineUsers.length > 0 && (
            <div className="px-1 pt-0.5">
              <p className="text-[10px] text-zinc-600 font-medium mb-1.5">
                Équipe · {onlineCount > 0 ? `${onlineCount} en ligne` : "hors ligne"}
              </p>
              <div className="flex -space-x-1.5">
                {onlineUsers.slice(0, 6).map(u => (
                  <div key={u.id} className="relative" title={u.nom}>
                    <UserAvatar nom={u.nom} url={u.avatar_url} color={u.color} size={22} />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-1 ring-[#0a0a0b] ${PRESENCE[u.status].dot}`} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-[#0a0a0b] z-50 flex flex-col md:hidden border-r border-white/[0.06]">
            <div className="h-13 min-h-[52px] flex items-center justify-between px-4 border-b border-white/[0.06]">
              <img src="/logo.png" alt="" className="h-6" />
              <button onClick={() => setSidebarOpen(false)} className="text-zinc-400">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-px">
              {[...layout.folders.flatMap(f => f.items), ...layout.unassigned].filter(id => !layout.hidden.includes(id)).map(id => {
                const meta = ALL_MODULES.find(m => m.id === id)
                if (!meta) return null
                return (
                  <button key={id} onClick={() => { openTab(id); setSidebarOpen(false) }}
                    className={`w-full flex items-center gap-2.5 px-2.5 h-9 rounded-lg text-sm ${activeTab === id ? "text-white" : "text-zinc-400"}`}
                    style={activeTab === id ? { background: ACCENT + "18", color: ACCENT } : {}}>
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </button>
                )
              })}
            </div>
            <div className="p-3 border-t border-white/[0.06]">
              <button onClick={() => { setShowOrganizer(true); setSidebarOpen(false) }}
                className="w-full h-9 rounded-lg text-sm text-zinc-400 hover:bg-white/[0.04]">
                ⚙️ Organiser
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ─── MAIN ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-11 flex items-center gap-2 px-3 md:px-4 border-b border-white/[0.06] bg-[#0a0a0b]/90 backdrop-blur-sm shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.04]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>

          <div className="flex-1 flex items-center gap-0.5 overflow-x-auto scrollbar-none">
            {openTabs.map(id => {
              const meta = ALL_MODULES.find(t => t.id === id)
              if (!meta) return null
              const active = activeTab === id
              return (
                <div
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`group flex items-center gap-1.5 h-7 px-2.5 rounded-md cursor-pointer text-[12px] transition-all shrink-0 ${
                    active
                      ? "bg-white/[0.08] text-white font-medium"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="text-[12px] opacity-80">{meta.icon}</span>
                  <span>{meta.label}</span>
                  {openTabs.length > 1 && (
                    <button
                      onClick={e => closeTab(id, e)}
                      className="ml-0.5 opacity-0 group-hover:opacity-50 hover:!opacity-100 text-[10px] w-3.5 h-3.5 flex items-center justify-center rounded hover:bg-white/10"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative" style={{ background: BG }}>
          {renderContent()}

          {showConvPopup && activeConvention && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <div className="bg-[#141416] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                <div className="p-6 text-center">
                  <div className="text-4xl mb-3">🎪</div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En cours
                  </div>
                  <h2 className="text-lg font-semibold text-white">{activeConvention.nom}</h2>
                  {activeConvention.lieu && <p className="text-sm text-zinc-500 mt-1">📍 {activeConvention.lieu}</p>}
                </div>
                <div className="px-6 pb-6 flex gap-2">
                  <button onClick={() => { setShowConvPopup(false); openTab("conventions") }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-black" style={{ background: ACCENT }}>
                    Voir la convention
                  </button>
                  <button onClick={() => setShowConvPopup(false)} className="px-4 py-2.5 rounded-xl text-sm text-zinc-400 bg-white/5">
                    Continuer
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showOrganizer && (
        <OrganizerModal layout={layout} setLayout={setLayout} onClose={() => setShowOrganizer(false)} ACCENT={ACCENT} />
      )}
      {showOnboarding && activeTab === "accueil" && (
        <OnboardingPopup onDismiss={dismissOnboarding} ACCENT={ACCENT} />
      )}
      {showUnreadPopup && unreadNotifs.length > 0 && (
        <UnreadMessagesPopup notifs={unreadNotifs} ACCENT={ACCENT}
          onGoToMessages={() => { openTab("messages"); setShowUnreadPopup(false) }}
          onClose={() => setShowUnreadPopup(false)} />
      )}
      {showStockAlert && stockAlerts.length > 0 && (
        <StockAlertPopup alerts={stockAlerts}
          onGoToStock={() => { openTab("stocks"); setShowStockAlert(false) }}
          onClose={() => setShowStockAlert(false)} />
      )}
      {showTachesAlert && tachesAlerts.length > 0 && (
        <TachesAlertPopup taches={tachesAlerts}
          onGoToTaches={() => { openTab("taches"); setShowTachesAlert(false) }}
          onClose={() => setShowTachesAlert(false)} />
      )}
    </div>
  )
}

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
          const { data: np } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
          prof = np
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
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  if (loading) {
    return (
      <div className="h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4">
        <p className="text-white font-medium">Problème de chargement</p>
        <button onClick={() => location.reload()} className="px-5 py-2 rounded-lg bg-yellow-500 text-black font-medium text-sm">
          Réessayer
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