"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Search, Filter } from "lucide-react"

interface Historique {
  id: string; type: string; action: string; details: string
  montant: number | null; user_id: string; user_nom: string
  created_at: string
}

const TYPES: Record<string, { icon: string; color: string; label: string }> = {
  vente:    { icon: "🛒", color: "#22c55e", label: "Vente" },
  stock:    { icon: "📦", color: "#3b82f6", label: "Stock" },
  client:   { icon: "👤", color: "#a855f7", label: "Client" },
  depense:  { icon: "💸", color: "#ef4444", label: "Dépense" },
  prospect: { icon: "🎯", color: "#f97316", label: "Prospect" },
  contrat:  { icon: "📑", color: "#eab308", label: "Contrat" },
  autre:    { icon: "📌", color: "#71717a", label: "Autre" },
}

export default function HistoriqueModule({ activeSociety, profile }: { activeSociety: any; profile: any }) {
  const [items, setItems] = useState<Historique[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("tous")
  const [filterUser, setFilterUser] = useState("tous")
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => { load() }, [activeSociety])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from("historique")
      .select("*").eq("society_id", activeSociety.id)
      .order("created_at", { ascending: false }).limit(500)
    setItems(data || [])

    const { data: u } = await supabase.from("profiles").select("id, nom").eq("society_id", activeSociety.id)
    setUsers(u || [])
    setLoading(false)
  }

  const filtered = items.filter(i => {
    const matchSearch = !search || i.action?.toLowerCase().includes(search.toLowerCase()) || i.details?.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === "tous" || i.type === filterType
    const matchUser = filterUser === "tous" || i.user_id === filterUser
    return matchSearch && matchType && matchUser
  })

  const groupByDate = (items: Historique[]) => {
    const groups: Record<string, Historique[]> = {}
    items.forEach(i => {
      const date = new Date(i.created_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
      if (!groups[date]) groups[date] = []
      groups[date].push(i)
    })
    return groups
  }

  const groups = groupByDate(filtered)

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
      <div className="px-6 py-4 border-b border-zinc-900">
        <h1 className="text-white font-bold text-xl">🕓 Historique</h1>
        <p className="text-zinc-500 text-xs mt-0.5">{items.length} événement{items.length > 1 ? "s" : ""}</p>
      </div>

      {/* Filtres */}
      <div className="px-6 py-3 border-b border-zinc-900 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
          <option value="tous">Tous les types</option>
          {Object.entries(TYPES).map(([id, t]) => <option key={id} value={id}>{t.icon} {t.label}</option>)}
        </select>
        <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
          <option value="tous">Tous les utilisateurs</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.nom}</option>)}
        </select>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🕓</p>
            <p className="text-zinc-400 font-semibold">Aucun événement</p>
            <p className="text-zinc-600 text-sm mt-1">L'historique se remplira automatiquement avec vos actions</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groups).map(([date, events]) => (
              <div key={date}>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3 capitalize">{date}</p>
                <div className="space-y-2">
                  {events.map(e => {
                    const t = TYPES[e.type] || TYPES.autre
                    return (
                      <div key={e.id} className="flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 hover:border-zinc-700 transition-colors">
                        <span className="text-xl shrink-0 mt-0.5">{t.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-white text-sm font-semibold">{e.action}</span>
                            <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ backgroundColor: t.color + "20", color: t.color }}>{t.label}</span>
                            {e.montant != null && (
                              <span className={`text-xs font-bold ml-auto ${e.montant >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {e.montant >= 0 ? "+" : ""}{e.montant.toFixed(2)}€
                              </span>
                            )}
                          </div>
                          {e.details && <p className="text-zinc-500 text-xs truncate">{e.details}</p>}
                          <div className="flex items-center gap-2 mt-1">
                            {e.user_nom && <span className="text-zinc-600 text-[10px]">par {e.user_nom}</span>}
                            <span className="text-zinc-700 text-[10px]">{new Date(e.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}