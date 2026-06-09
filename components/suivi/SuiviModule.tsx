"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import {
  Plus, X, Search, Check, Trash2,
  ChevronLeft, ChevronRight, Calendar,
  TrendingUp, Pencil, AlertCircle,
} from "lucide-react"

interface Props { activeSociety: any; profile: any }

interface SuiviClient {
  id: string; client_id: string; client_nom: string
  client_prenom?: string; client_nom_shop?: string; client_contrat?: string
}

interface Commande {
  id: string; client_id: string; annee: number; mois: number
  montant: number; detail?: string; date_commande?: string; notes?: string
}

const MOIS_SHORT = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"]
const MOIS_FULL  = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]

const NOW_MONTH = new Date().getMonth() + 1
const NOW_YEAR  = new Date().getFullYear()

const CONTRAT_COLORS: Record<string, string> = {
  "Essentielle": "#f97316",
  "Avantage":    "#94a3b8",
  "Élite":       "#eab308",
  "ProTeam":     "#a855f7",
}

/* ══════════════════════════════════════════════
   SIDE PANEL — remplace les 2 anciens modals
══════════════════════════════════════════════ */
function CommandePanel({ client, mois, annee, commande, societyId, onClose, onDone }: {
  client: SuiviClient; mois: number; annee: number
  commande: Commande | null; societyId: string
  onClose: () => void; onDone: () => void
}) {
  const [mode, setMode]       = useState<"view"|"edit">(commande ? "view" : "edit")
  const [montant, setMontant] = useState(commande?.montant?.toString() || "")
  const [detail, setDetail]   = useState(commande?.detail || "")
  const [date, setDate]       = useState(commande?.date_commande || `${annee}-${String(mois).padStart(2,"0")}-01`)
  const [notes, setNotes]     = useState(commande?.notes || "")
  const [saving, setSaving]   = useState(false)
  const montantRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === "edit") setTimeout(() => montantRef.current?.focus(), 100)
  }, [mode])

  const save = async () => {
    if (!montant || parseFloat(montant) <= 0) return
    setSaving(true)
    const payload = {
      society_id: societyId, client_id: client.client_id,
      annee, mois, montant: parseFloat(montant),
      detail: detail || null, date_commande: date || null, notes: notes || null,
    }
    if (commande?.id) await supabase.from("suivi_commandes").update(payload).eq("id", commande.id)
    else              await supabase.from("suivi_commandes").insert(payload)
    setSaving(false); onDone(); onClose()
  }

  const deleteCmd = async () => {
    if (!commande?.id || !confirm("Supprimer cette commande ?")) return
    await supabase.from("suivi_commandes").delete().eq("id", commande.id)
    onDone(); onClose()
  }

  const contratColor = CONTRAT_COLORS[client.client_contrat || ""] || ""
  const clientName   = client.client_prenom ? `${client.client_prenom} ${client.client_nom}` : client.client_nom

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-sm h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 shrink-0"
          style={contratColor ? { background: `linear-gradient(135deg, ${contratColor}12, transparent)`, borderColor: `${contratColor}30` } : {}}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                {MOIS_FULL[mois - 1]} {annee}
              </p>
              <h2 className="text-white font-bold text-base leading-tight">{clientName}</h2>
              {client.client_nom_shop && (
                <p className="text-zinc-400 text-xs mt-0.5">🏪 {client.client_nom_shop}</p>
              )}
              {client.client_contrat && client.client_contrat !== "Aucun" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block"
                  style={contratColor ? { backgroundColor: contratColor + "20", color: contratColor, border: `1px solid ${contratColor}40` } : { backgroundColor: "#27272a", color: "#a1a1aa" }}>
                  {client.client_contrat}
                </span>
              )}
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white shrink-0"><X size={16}/></button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto">

          {/* MODE VUE */}
          {mode === "view" && commande && (
            <div className="p-5 space-y-4">
              {/* Montant */}
              <div className="bg-green-500/10 border border-green-500/25 rounded-2xl px-5 py-4 text-center">
                <p className="text-zinc-500 text-xs mb-1">Montant de la commande</p>
                <p className="text-green-400 text-3xl font-black">{Number(commande.montant).toFixed(2)}€</p>
              </div>

              {/* Infos */}
              <div className="space-y-2">
                {commande.date_commande && (
                  <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                    <Calendar size={14} className="text-zinc-500 shrink-0"/>
                    <div>
                      <p className="text-zinc-500 text-[10px]">Date de commande</p>
                      <p className="text-white text-sm font-semibold">
                        {new Date(commande.date_commande + "T00:00:00").toLocaleDateString("fr-FR", { weekday:"short", day:"numeric", month:"long" })}
                      </p>
                    </div>
                  </div>
                )}

                {commande.detail && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                    <p className="text-zinc-500 text-[10px] mb-1">📦 Détail</p>
                    <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">{commande.detail}</p>
                  </div>
                )}

                {commande.notes && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                    <p className="text-zinc-500 text-[10px] mb-1">📝 Notes</p>
                    <p className="text-zinc-400 text-sm">{commande.notes}</p>
                  </div>
                )}

                {!commande.date_commande && !commande.detail && !commande.notes && (
                  <p className="text-zinc-700 text-xs italic text-center py-2">Aucun détail enregistré</p>
                )}
              </div>
            </div>
          )}

          {/* MODE ÉDITION / AJOUT */}
          {mode === "edit" && (
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">💰 Montant *</label>
                <div className="relative">
                  <input ref={montantRef} type="number" step="0.01" min="0" value={montant}
                    onChange={e => setMontant(e.target.value)} placeholder="0.00"
                    onKeyDown={e => e.key === "Enter" && save()}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-lg text-white font-bold focus:outline-none focus:border-green-500/60 pr-10"/>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">€</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">📅 Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"/>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">📦 Détail</label>
                <textarea value={detail} onChange={e => setDetail(e.target.value)} rows={3}
                  placeholder="3× Baume 50ml, 2× Huile sèche..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"/>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">📝 Notes</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Paiement, livraison..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-zinc-800 shrink-0 space-y-2">
          {mode === "view" && commande && (
            <>
              <button onClick={() => setMode("edit")}
                className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm flex items-center justify-center gap-2">
                <Pencil size={14}/> Modifier la commande
              </button>
              <button onClick={deleteCmd}
                className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-semibold text-sm flex items-center justify-center gap-2">
                <Trash2 size={13}/> Supprimer
              </button>
            </>
          )}
          {mode === "edit" && (
            <div className="flex gap-2">
              <button onClick={save} disabled={saving || !montant || parseFloat(montant) <= 0}
                className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black font-bold text-sm flex items-center justify-center gap-2">
                {saving
                  ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/>
                  : <><Check size={14}/> {commande ? "Mettre à jour" : "Valider"}</>
                }
              </button>
              {commande && (
                <button onClick={() => setMode("view")}
                  className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm">
                  Annuler
                </button>
              )}
              {!commande && (
                <button onClick={onClose}
                  className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm">
                  Fermer
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MODAL AJOUT CLIENT
══════════════════════════════════════════════ */
function AddClientModal({ societyId, existingClientIds, onClose, onDone }: {
  societyId: string; existingClientIds: string[]; onClose: () => void; onDone: () => void
}) {
  const [clients, setClients]   = useState<any[]>([])
  const [search, setSearch]     = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    supabase.from("clients").select("id, nom, prenom, nom_shop, contrat")
      .eq("society_id", societyId).order("nom")
      .then(({ data }) => setClients(data || []))
  }, [societyId])

  const filtered = clients
    .filter(c => !existingClientIds.includes(c.id))
    .filter(c => {
      const s = search.toLowerCase()
      return !s || c.nom?.toLowerCase().includes(s) || c.prenom?.toLowerCase().includes(s) || c.nom_shop?.toLowerCase().includes(s)
    })

  const toggle = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const save = async () => {
    if (selected.size === 0) return
    setSaving(true)
    await supabase.from("suivi_clients").insert(
      Array.from(selected).map(client_id => ({ society_id: societyId, client_id }))
    )
    setSaving(false); onDone(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
          <div>
            <p className="text-white font-bold">Ajouter au suivi</p>
            <p className="text-zinc-500 text-xs mt-0.5">{selected.size} sélectionné{selected.size > 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16}/></button>
        </div>
        <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input type="text" placeholder="Nom, prénom, shop..." value={search}
              onChange={e => setSearch(e.target.value)} autoFocus
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none"/>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-8">
              {clients.filter(c => !existingClientIds.includes(c.id)).length === 0
                ? "Tous les clients sont dans le suivi"
                : "Aucun résultat"}
            </p>
          ) : filtered.map(c => {
            const isSelected = selected.has(c.id)
            const cc = CONTRAT_COLORS[c.contrat || ""]
            return (
              <button key={c.id} onClick={() => toggle(c.id)}
                className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/50 transition-colors text-left ${isSelected ? "bg-green-500/5" : ""}`}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-green-500 border-green-500" : "border-zinc-600"}`}>
                  {isSelected && <Check size={12} className="text-black"/>}
                </div>
                {cc && <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: cc }}/>}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">
                    {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
                  </p>
                  {c.nom_shop
                    ? <p className="text-zinc-500 text-[11px]">🏪 {c.nom_shop}</p>
                    : c.contrat && c.contrat !== "Aucun" && <p className="text-zinc-600 text-[11px]">{c.contrat}</p>
                  }
                </div>
              </button>
            )
          })}
        </div>
        <div className="px-5 py-4 border-t border-zinc-800 flex gap-2 shrink-0">
          <button onClick={save} disabled={saving || selected.size === 0}
            className="flex-1 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold text-sm flex items-center justify-center gap-2">
            {saving
              ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/>
              : <><Plus size={14}/> Ajouter {selected.size > 0 ? `(${selected.size})` : ""}</>
            }
          </button>
          <button onClick={onClose} className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN MODULE
══════════════════════════════════════════════ */
export default function SuiviModule({ activeSociety, profile }: Props) {
  const [suiviClients, setSuiviClients] = useState<SuiviClient[]>([])
  const [commandes, setCommandes]       = useState<Commande[]>([])
  const [loading, setLoading]           = useState(true)
  const [year, setYear]                 = useState(NOW_YEAR)
  const [search, setSearch]             = useState("")
  const [showAddClient, setShowAddClient] = useState(false)
  const [panel, setPanel] = useState<{ client: SuiviClient; mois: number; commande: Commande | null } | null>(null)

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const [{ data: sc }, { data: cmd }] = await Promise.all([
      supabase.from("suivi_clients")
        .select("id, client_id, clients(nom, prenom, nom_shop, contrat)")
        .eq("society_id", activeSociety.id).order("created_at"),
      supabase.from("suivi_commandes")
        .select("*").eq("society_id", activeSociety.id).eq("annee", year),
    ])
    setSuiviClients((sc || []).map((s: any) => ({
      id: s.id, client_id: s.client_id,
      client_nom: s.clients?.nom || "?",
      client_prenom: s.clients?.prenom || "",
      client_nom_shop: s.clients?.nom_shop || "",
      client_contrat: s.clients?.contrat || "",
    })))
    setCommandes(cmd || [])
    setLoading(false)
  }, [activeSociety?.id, year])

  useEffect(() => { load() }, [load])

  // Refresh panel après save
  const handleDone = async () => {
    await load()
    if (panel) {
      const { data: cmd } = await supabase.from("suivi_commandes").select("*")
        .eq("society_id", activeSociety.id).eq("client_id", panel.client.client_id)
        .eq("annee", year).eq("mois", panel.mois).single()
      setPanel(p => p ? { ...p, commande: cmd || null } : null)
    }
  }

  const removeClient = async (suiviId: string) => {
    if (!confirm("Retirer ce client du suivi ?")) return
    await supabase.from("suivi_clients").delete().eq("id", suiviId)
    setSuiviClients(prev => prev.filter(c => c.id !== suiviId))
  }

  const getCmd = (clientId: string, mois: number) =>
    commandes.find(c => c.client_id === clientId && c.mois === mois) || null

  const openPanel = (client: SuiviClient, mois: number) => {
    setPanel({ client, mois, commande: getCmd(client.client_id, mois) })
  }

  // Filtrage
  const filteredClients = suiviClients.filter(sc => {
    if (!search) return true
    const s = search.toLowerCase()
    return sc.client_nom?.toLowerCase().includes(s)
      || sc.client_prenom?.toLowerCase().includes(s)
      || sc.client_nom_shop?.toLowerCase().includes(s)
  })

  // Stats
  const totalAnnee     = commandes.reduce((s, c) => s + Number(c.montant || 0), 0)
  const cellsVertes    = commandes.length
  const cellsTotal     = suiviClients.length * 12
  const tauxCouverture = cellsTotal > 0 ? Math.round((cellsVertes / cellsTotal) * 100) : 0
  const moisActifCount = new Set(commandes.map(c => c.mois)).size

  const totalParMois = MOIS_SHORT.map((_, i) =>
    commandes.filter(c => c.mois === i + 1).reduce((s, c) => s + Number(c.montant || 0), 0)
  )
  const meilleurMois = totalParMois.reduce((best, t, i) => t > totalParMois[best] ? i : best, 0)

  return (
    <div className="flex-1 overflow-hidden bg-[#0a0a0a] flex flex-col">

      {/* ── HEADER ── */}
      <div className="border-b border-zinc-900 px-4 pt-4 pb-3 shrink-0 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-white font-bold text-xl">📋 Suivi clients</h1>
            <p className="text-zinc-500 text-xs mt-0.5">
              {suiviClients.length} client{suiviClients.length > 1 ? "s" : ""} · {moisActifCount} mois actifs
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Sélecteur d'année */}
            <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1.5">
              <button onClick={() => setYear(y => y - 1)}
                className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800">
                <ChevronLeft size={14}/>
              </button>
              <span className="text-white font-bold text-sm px-2 min-w-[3rem] text-center">{year}</span>
              <button onClick={() => setYear(y => y + 1)} disabled={year >= NOW_YEAR}
                className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 disabled:opacity-30">
                <ChevronRight size={14}/>
              </button>
            </div>
            <button onClick={() => setShowAddClient(true)}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-yellow-500/20">
              <Plus size={15}/> Ajouter
            </button>
          </div>
        </div>

        {/* Stats chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { label: "CA annuel",   value: totalAnnee.toFixed(0)+"€",    color: "text-yellow-400" },
            { label: "Couverture",  value: tauxCouverture+"%",           color: tauxCouverture > 60 ? "text-green-400" : tauxCouverture > 30 ? "text-yellow-400" : "text-red-400" },
            { label: "Commandes",   value: String(cellsVertes),          color: "text-white"       },
            { label: "Meilleur mois",value: totalParMois[meilleurMois] > 0 ? MOIS_FULL[meilleurMois] : "—", color: "text-purple-400" },
            { label: "Moy/mois",    value: moisActifCount > 0 ? (totalAnnee/moisActifCount).toFixed(0)+"€" : "—", color: "text-zinc-300" },
          ].map(({ label, value, color }) => (
            <div key={label} className="shrink-0 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 flex items-center gap-2">
              <p className={`text-sm font-black ${color}`}>{value}</p>
              <p className="text-zinc-600 text-[10px]">{label}</p>
            </div>
          ))}
        </div>

        {/* Barre progression globale */}
        {suiviClients.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 text-[10px]">Couverture globale {year}</span>
              <span className="text-zinc-500 text-[10px] font-bold">{cellsVertes}/{cellsTotal}</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-700"
                style={{ width: `${tauxCouverture}%` }}/>
            </div>
          </div>
        )}

        {/* Recherche */}
        {suiviClients.length > 3 && (
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input type="text" placeholder="Filtrer les clients..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/40"/>
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"><X size={12}/></button>
            )}
          </div>
        )}
      </div>

      {/* ── TABLEAU ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
        </div>

      ) : suiviClients.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-white text-lg font-bold mb-2">Aucun client dans le suivi</p>
          <p className="text-zinc-500 text-sm mb-6">Ajoutez vos clients pour suivre leurs commandes mois par mois</p>
          <button onClick={() => setShowAddClient(true)}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl text-sm">
            <Plus size={15}/> Ajouter un client
          </button>
        </div>

      ) : filteredClients.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-600 text-sm">Aucun client ne correspond à la recherche</p>
        </div>

      ) : (
        <div className="flex-1 overflow-auto">
          <table className="border-collapse" style={{ minWidth: `${180 + 12 * 88 + 72}px` }}>
            <thead className="sticky top-0 z-20">
              <tr>
                {/* Coin */}
                <th className="sticky left-0 z-30 bg-[#0d0d0d] border-b border-r border-zinc-800 px-3 py-2.5 w-[180px] min-w-[180px]">
                  <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-wider">Client</span>
                </th>

                {/* Colonnes mois */}
                {MOIS_SHORT.map((m, i) => {
                  const moisNum    = i + 1
                  const isCurrent  = year === NOW_YEAR && moisNum === NOW_MONTH
                  const isPast     = year < NOW_YEAR || (year === NOW_YEAR && moisNum < NOW_MONTH)
                  const total      = totalParMois[i]
                  const isBest     = total > 0 && i === meilleurMois
                  return (
                    <th key={m} className="border-b border-r border-zinc-800 py-2 px-1 min-w-[88px] text-center"
                      style={{
                        backgroundColor: isCurrent ? "#eab30812" : "#0d0d0d",
                        borderBottomColor: isCurrent ? "#eab30860" : undefined,
                      }}>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`text-[10px] font-bold ${isCurrent ? "text-yellow-400" : isPast ? "text-zinc-600" : "text-zinc-300"}`}>
                          {m}
                          {isCurrent && <span className="ml-1 text-[8px] text-yellow-500 font-black">●</span>}
                        </span>
                        {total > 0 ? (
                          <span className={`text-[9px] font-semibold ${isBest ? "text-yellow-400" : "text-zinc-500"}`}>
                            {total.toFixed(0)}€
                          </span>
                        ) : (
                          <span className="text-[9px] text-zinc-800">—</span>
                        )}
                      </div>
                    </th>
                  )
                })}

                {/* Total */}
                <th className="bg-[#0d0d0d] border-b border-zinc-800 px-3 py-2.5 w-[72px] min-w-[72px] text-center">
                  <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-wider">Total</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredClients.map((sc) => {
                const clientCommandes = commandes.filter(c => c.client_id === sc.client_id)
                const clientTotal     = clientCommandes.reduce((s, c) => s + Number(c.montant || 0), 0)
                const clientCoverage  = clientCommandes.length
                const contratColor    = CONTRAT_COLORS[sc.client_contrat || ""] || ""

                return (
                  <tr key={sc.id} className="group">
                    {/* Client — sticky */}
                    <td className="sticky left-0 z-10 bg-[#0a0a0a] group-hover:bg-zinc-900/50 border-b border-r border-zinc-800/60 transition-colors"
                      style={contratColor ? { borderLeft: `2px solid ${contratColor}60` } : {}}>
                      <div className="flex items-center justify-between gap-1 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          {/* Nom */}
                          <p className="text-white text-[12px] font-semibold truncate leading-tight">
                            {sc.client_prenom ? `${sc.client_prenom} ${sc.client_nom}` : sc.client_nom}
                          </p>
                          {/* Shop ou contrat */}
                          {sc.client_nom_shop ? (
                            <p className="text-zinc-500 text-[10px] truncate">🏪 {sc.client_nom_shop}</p>
                          ) : sc.client_contrat && sc.client_contrat !== "Aucun" ? (
                            <p className="text-[10px] font-semibold" style={{ color: contratColor || "#71717a" }}>
                              {sc.client_contrat}
                            </p>
                          ) : null}
                          {/* Mini barre progression */}
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 12 }).map((_, i) => {
                                const hasCmd = !!getCmd(sc.client_id, i + 1)
                                const isCurr = year === NOW_YEAR && i + 1 === NOW_MONTH
                                return (
                                  <div key={i} className="w-2 h-1 rounded-full"
                                    style={{
                                      backgroundColor: hasCmd
                                        ? (contratColor || "#22c55e")
                                        : isCurr ? "#eab30840" : "#27272a",
                                    }}/>
                                )
                              })}
                            </div>
                            <span className="text-zinc-700 text-[9px] shrink-0">{clientCoverage}/12</span>
                          </div>
                        </div>
                        <button onClick={() => removeClient(sc.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-400 transition-all shrink-0 p-1 rounded">
                          <Trash2 size={10}/>
                        </button>
                      </div>
                    </td>

                    {/* Cellules mois */}
                    {MOIS_SHORT.map((_, i) => {
                      const moisNum   = i + 1
                      const cmd       = getCmd(sc.client_id, moisNum)
                      const hasCmd    = !!cmd
                      const isCurrent = year === NOW_YEAR && moisNum === NOW_MONTH
                      const isPast    = year < NOW_YEAR || (year === NOW_YEAR && moisNum < NOW_MONTH)
                      const isActive  = panel?.client.client_id === sc.client_id && panel?.mois === moisNum

                      return (
                        <td key={moisNum} className="border-b border-r border-zinc-800/50 p-0.5"
                          style={isCurrent ? { backgroundColor: "#eab3080a" } : {}}>
                          <button
                            onClick={() => openPanel(sc, moisNum)}
                            className={`w-full h-[60px] rounded-lg text-center transition-all duration-150 flex flex-col items-center justify-center gap-0.5 border group/cell ${
                              isActive
                                ? "ring-1 ring-yellow-400/50"
                                : ""
                            } ${
                              hasCmd
                                ? "bg-green-500/12 border-green-500/35 hover:bg-green-500/22 hover:border-green-500/55"
                                : isPast
                                ? "bg-red-500/5 border-red-500/10 hover:bg-red-500/10 hover:border-red-500/25"
                                : "bg-zinc-900/30 border-zinc-800/50 hover:bg-zinc-800/60 hover:border-zinc-600"
                            }`}>
                            {hasCmd ? (
                              <>
                                <p className="text-green-400 text-[12px] font-black leading-none">
                                  {Number(cmd.montant).toFixed(0)}€
                                </p>
                                {cmd.date_commande && (
                                  <p className="text-green-600/80 text-[9px] leading-none">
                                    {new Date(cmd.date_commande + "T00:00:00").toLocaleDateString("fr-FR", { day:"numeric", month:"short" })}
                                  </p>
                                )}
                                <div className="w-1 h-1 rounded-full bg-green-500 mt-0.5"/>
                              </>
                            ) : (
                              <>
                                {isPast
                                  ? <AlertCircle size={13} className="text-red-500/20 group-hover/cell:text-red-500/40 transition-colors"/>
                                  : <Plus size={12} className="text-zinc-700 group-hover/cell:text-zinc-400 transition-colors"/>
                                }
                              </>
                            )}
                          </button>
                        </td>
                      )
                    })}

                    {/* Total client */}
                    <td className="border-b border-zinc-800/50 px-2 py-2 text-center">
                      {clientTotal > 0 ? (
                        <div>
                          <p className="text-yellow-400 text-xs font-black leading-tight">{clientTotal.toFixed(0)}€</p>
                          {clientCoverage > 0 && (
                            <p className="text-zinc-700 text-[9px]">{clientCoverage}×</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-zinc-800 text-xs">—</p>
                      )}
                    </td>
                  </tr>
                )
              })}

              {/* Ligne totaux */}
              <tr>
                <td className="sticky left-0 z-10 bg-zinc-900/60 border-t-2 border-r border-zinc-700 px-3 py-2.5">
                  <p className="text-zinc-400 text-[10px] font-black uppercase tracking-wider">Total</p>
                </td>
                {MOIS_SHORT.map((_, i) => {
                  const t = totalParMois[i]
                  return (
                    <td key={i} className="border-t-2 border-r border-zinc-700 px-1 py-2 text-center bg-zinc-900/30">
                      {t > 0
                        ? <p className="text-yellow-400 text-[11px] font-black">{t.toFixed(0)}€</p>
                        : <p className="text-zinc-800 text-[10px]">—</p>
                      }
                    </td>
                  )
                })}
                <td className="border-t-2 border-zinc-700 px-2 py-2 text-center bg-zinc-900/30">
                  <p className="text-yellow-500 text-xs font-black">{totalAnnee.toFixed(0)}€</p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Légende */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-zinc-900/60 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-500/15 border border-green-500/40"/>
              <span className="text-zinc-600 text-[10px]">Commande enregistrée</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertCircle size={11} className="text-red-500/25"/>
              <span className="text-zinc-600 text-[10px]">Mois passé sans commande</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Plus size={11} className="text-zinc-700"/>
              <span className="text-zinc-600 text-[10px]">Mois à venir — cliquer pour ajouter</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-yellow-500 text-[9px] font-black">●</span>
              <span className="text-zinc-600 text-[10px]">Mois en cours</span>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showAddClient && (
        <AddClientModal
          societyId={activeSociety.id}
          existingClientIds={suiviClients.map(c => c.client_id)}
          onClose={() => setShowAddClient(false)}
          onDone={load}
        />
      )}

      {panel && (
        <CommandePanel
          client={panel.client}
          mois={panel.mois}
          annee={year}
          commande={panel.commande}
          societyId={activeSociety.id}
          onClose={() => setPanel(null)}
          onDone={handleDone}
        />
      )}
    </div>
  )
}