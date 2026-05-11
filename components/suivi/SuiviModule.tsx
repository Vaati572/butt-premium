"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Plus, X, Search, Check, Trash2, ChevronLeft, ChevronRight, Calendar } from "lucide-react"

interface Props { activeSociety: any; profile: any }

interface SuiviClient {
  id: string
  client_id: string
  client_nom: string
  client_prenom?: string
  client_nom_shop?: string
  client_contrat?: string
}

interface Commande {
  id: string
  client_id: string
  annee: number
  mois: number
  montant: number
  detail?: string
  date_commande?: string
  notes?: string
}

const MOIS      = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"]
const MOIS_FULL = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]

/* ── MODAL AJOUT / MODIF COMMANDE ── */
function CommandeModal({ client, mois, annee, commande, societyId, onClose, onDone }: {
  client: SuiviClient; mois: number; annee: number
  commande?: Commande | null; societyId: string
  onClose: () => void; onDone: () => void
}) {
  const [montant, setMontant] = useState(commande?.montant?.toString() || "")
  const [detail, setDetail]   = useState(commande?.detail || "")
  const [date, setDate]       = useState(commande?.date_commande || `${annee}-${String(mois).padStart(2,"0")}-01`)
  const [notes, setNotes]     = useState(commande?.notes || "")
  const [saving, setSaving]   = useState(false)

  const save = async () => {
    if (!montant || parseFloat(montant) <= 0) return
    setSaving(true)
    const payload = {
      society_id: societyId,
      client_id: client.client_id,
      annee, mois,
      montant: parseFloat(montant),
      detail: detail || null,
      date_commande: date || null,
      notes: notes || null,
    }
    if (commande?.id) {
      await supabase.from("suivi_commandes").update(payload).eq("id", commande.id)
    } else {
      await supabase.from("suivi_commandes").insert(payload)
    }
    setSaving(false); onDone(); onClose()
  }

  const deleteCmd = async () => {
    if (!commande?.id || !confirm("Supprimer cette commande ?")) return
    await supabase.from("suivi_commandes").delete().eq("id", commande.id)
    onDone(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <p className="text-white font-bold text-sm">
              {commande ? "Modifier la commande" : "Nouvelle commande"}
            </p>
            <p className="text-zinc-500 text-xs mt-0.5">
              {client.client_prenom ? `${client.client_prenom} ${client.client_nom}` : client.client_nom}
              {client.client_nom_shop && <span className="ml-1 text-zinc-600">· 🏪 {client.client_nom_shop}</span>}
              {" — "}{MOIS_FULL[mois - 1]} {annee}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16}/></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">💰 Montant *</label>
            <div className="relative">
              <input type="number" step="0.01" min="0" value={montant} onChange={e => setMontant(e.target.value)}
                placeholder="0.00" autoFocus
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/60 pr-8"/>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">€</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">📅 Date de commande</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"/>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">📦 Détail de la commande</label>
            <textarea value={detail} onChange={e => setDetail(e.target.value)} rows={3}
              placeholder="Ex: 3× Baume 50ml, 2× Huile sèche 30ml..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"/>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">📝 Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Paiement, livraison, remarques..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={save} disabled={saving || !montant || parseFloat(montant) <= 0}
            className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black font-bold text-sm flex items-center justify-center gap-2">
            {saving
              ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/>
              : <><Check size={14}/> {commande ? "Mettre à jour" : "Valider la commande"}</>
            }
          </button>
          {commande && (
            <button onClick={deleteCmd} className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-semibold text-sm">
              <Trash2 size={14}/>
            </button>
          )}
          <button onClick={onClose} className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ── MODAL DÉTAIL ── */
function DetailModal({ client, commande, mois, annee, onClose, onEdit }: {
  client: SuiviClient; commande: Commande; mois: number; annee: number
  onClose: () => void; onEdit: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-green-500/30 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="bg-green-500/10 px-5 py-4 border-b border-green-500/20 flex items-center justify-between">
          <div>
            <p className="text-green-400 font-bold text-sm">✅ Commande validée</p>
            <p className="text-zinc-400 text-xs mt-0.5">{MOIS_FULL[mois-1]} {annee}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16}/></button>
        </div>

        <div className="p-5 space-y-3">
          <div className="bg-zinc-900 rounded-xl px-4 py-3">
            <p className="text-zinc-500 text-xs mb-0.5">👤 Client</p>
            <p className="text-white font-bold text-sm">
              {client.client_prenom ? `${client.client_prenom} ${client.client_nom}` : client.client_nom}
            </p>
            {client.client_nom_shop && <p className="text-zinc-500 text-[11px] mt-0.5">🏪 {client.client_nom_shop}</p>}
          </div>

          <div className="bg-zinc-900 rounded-xl px-4 py-3">
            <p className="text-zinc-500 text-xs mb-1">💰 Montant</p>
            <p className="text-green-400 text-2xl font-black">{Number(commande.montant).toFixed(2)}€</p>
          </div>

          {commande.date_commande && (
            <div className="flex items-center gap-3 bg-zinc-900 rounded-xl px-4 py-3">
              <Calendar size={14} className="text-zinc-400 shrink-0"/>
              <div>
                <p className="text-zinc-500 text-xs">Date</p>
                <p className="text-white text-sm font-semibold">
                  {new Date(commande.date_commande + "T00:00:00").toLocaleDateString("fr-FR", { weekday:"short", day:"numeric", month:"long", year:"numeric" })}
                </p>
              </div>
            </div>
          )}

          {commande.detail && (
            <div className="bg-zinc-900 rounded-xl px-4 py-3">
              <p className="text-zinc-500 text-xs mb-1">📦 Détail</p>
              <p className="text-zinc-300 text-sm whitespace-pre-wrap">{commande.detail}</p>
            </div>
          )}

          {commande.notes && (
            <div className="bg-zinc-900 rounded-xl px-4 py-3">
              <p className="text-zinc-500 text-xs mb-1">📝 Notes</p>
              <p className="text-zinc-400 text-sm">{commande.notes}</p>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onEdit} className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm">Modifier</button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-semibold text-sm">Fermer</button>
        </div>
      </div>
    </div>
  )
}

/* ── MODAL AJOUT CLIENT AU SUIVI ── */
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
      return c.nom?.toLowerCase().includes(s)
        || c.prenom?.toLowerCase().includes(s)
        || c.nom_shop?.toLowerCase().includes(s)
    })

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
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
                ? "Tous les clients sont déjà dans le suivi"
                : "Aucun client trouvé"}
            </p>
          ) : filtered.map(c => {
            const isSelected = selected.has(c.id)
            return (
              <button key={c.id} onClick={() => toggle(c.id)}
                className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/50 transition-colors text-left ${isSelected ? "bg-green-500/5" : ""}`}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-green-500 border-green-500" : "border-zinc-600"}`}>
                  {isSelected && <Check size={12} className="text-black"/>}
                </div>
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
  const [year, setYear]                 = useState(new Date().getFullYear())

  const [showAddClient, setShowAddClient]   = useState(false)
  const [commandeModal, setCommandeModal]   = useState<{ client: SuiviClient; mois: number; commande?: Commande | null } | null>(null)
  const [detailModal, setDetailModal]       = useState<{ client: SuiviClient; mois: number; commande: Commande } | null>(null)

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const [{ data: sc }, { data: cmd }] = await Promise.all([
      supabase.from("suivi_clients")
        .select("id, client_id, clients(nom, prenom, nom_shop, contrat)")
        .eq("society_id", activeSociety.id)
        .order("created_at"),
      supabase.from("suivi_commandes")
        .select("*")
        .eq("society_id", activeSociety.id)
        .eq("annee", year),
    ])

    const mapped: SuiviClient[] = (sc || []).map((s: any) => ({
      id: s.id,
      client_id: s.client_id,
      client_nom: s.clients?.nom || "?",
      client_prenom: s.clients?.prenom || "",
      client_nom_shop: s.clients?.nom_shop || "",
      client_contrat: s.clients?.contrat || "",
    }))

    setSuiviClients(mapped)
    setCommandes(cmd || [])
    setLoading(false)
  }, [activeSociety?.id, year])

  useEffect(() => { load() }, [load])

  const removeClient = async (suiviId: string) => {
    if (!confirm("Retirer ce client du suivi ?")) return
    await supabase.from("suivi_clients").delete().eq("id", suiviId)
    setSuiviClients(prev => prev.filter(c => c.id !== suiviId))
  }

  const getCommande = (clientId: string, mois: number): Commande | undefined =>
    commandes.find(c => c.client_id === clientId && c.mois === mois)

  const totalAnnee      = commandes.reduce((s, c) => s + Number(c.montant || 0), 0)
  const cellsVertes     = commandes.length
  const cellsTotal      = suiviClients.length * 12
  const tauxCouverture  = cellsTotal > 0 ? Math.round((cellsVertes / cellsTotal) * 100) : 0

  const totalParMois = MOIS.map((_, i) => {
    const m = i + 1
    return commandes.filter(c => c.mois === m).reduce((s, c) => s + Number(c.montant || 0), 0)
  })

  const totalParClient = suiviClients.map(sc =>
    commandes.filter(c => c.client_id === sc.client_id).reduce((s, c) => s + Number(c.montant || 0), 0)
  )

  return (
    <div className="flex-1 overflow-hidden bg-[#0a0a0a] flex flex-col">

      {/* HEADER */}
      <div className="border-b border-zinc-900 p-4 shrink-0 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-white font-bold text-xl">📋 Suivi clients</h1>
            <p className="text-zinc-500 text-xs mt-0.5">
              {suiviClients.length} client{suiviClients.length > 1 ? "s" : ""} suivis
              {cellsTotal > 0 && <> · <span className="text-green-400 font-semibold">{tauxCouverture}% couverture</span></>}
              {" · "}CA {year} : <span className="text-yellow-400 font-bold">{totalAnnee.toFixed(2)}€</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
              <button onClick={() => setYear(y => y - 1)} className="text-zinc-500 hover:text-white"><ChevronLeft size={14}/></button>
              <span className="text-white font-bold text-sm px-2">{year}</span>
              <button onClick={() => setYear(y => y + 1)} disabled={year >= new Date().getFullYear()}
                className="text-zinc-500 hover:text-white disabled:opacity-30"><ChevronRight size={14}/></button>
            </div>
            <button onClick={() => setShowAddClient(true)}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-yellow-500/20">
              <Plus size={15}/> Ajouter un client
            </button>
          </div>
        </div>

        {/* Barre de progression */}
        {suiviClients.length > 0 && (
          <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-zinc-800">
            <div className="h-full bg-green-500 rounded-full transition-all duration-700" style={{ width: `${tauxCouverture}%` }}/>
          </div>
        )}
      </div>

      {/* CONTENU */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : suiviClients.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 p-8">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-white text-lg font-bold mb-2">Aucun client dans le suivi</p>
          <p className="text-zinc-500 text-sm mb-6 text-center">Ajoutez vos clients pour suivre leurs commandes mois par mois</p>
          <button onClick={() => setShowAddClient(true)}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl text-sm">
            <Plus size={15}/> Ajouter un client
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="border-collapse min-w-full">
            <thead className="sticky top-0 z-20">
              <tr>
                {/* Coin haut-gauche */}
                <th className="sticky left-0 z-30 bg-[#0d0d0d] border-b border-r border-zinc-800 px-4 py-3 min-w-[180px] w-[180px]">
                  <span className="text-zinc-600 text-[11px] font-bold uppercase tracking-wider">Client</span>
                </th>
                {/* Colonnes mois */}
                {MOIS.map((m, i) => (
                  <th key={m} className="bg-[#0d0d0d] border-b border-r border-zinc-800 px-2 py-3 min-w-[96px] text-center">
                    <p className="text-zinc-300 text-xs font-bold">{m}</p>
                    {totalParMois[i] > 0 && (
                      <p className="text-yellow-400 text-[10px] font-semibold mt-0.5">{totalParMois[i].toFixed(0)}€</p>
                    )}
                  </th>
                ))}
                {/* Colonne total */}
                <th className="bg-[#0d0d0d] border-b border-zinc-800 px-3 py-3 min-w-[80px] text-center">
                  <span className="text-zinc-600 text-[11px] font-bold uppercase tracking-wider">Total</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {suiviClients.map((sc, rowIdx) => (
                <tr key={sc.id} className="group">
                  {/* Client — sticky */}
                  <td className="sticky left-0 z-10 bg-[#0a0a0a] group-hover:bg-zinc-900/60 border-b border-r border-zinc-800/60 px-4 py-2 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white text-xs font-bold truncate">
                          {sc.client_prenom ? `${sc.client_prenom} ${sc.client_nom}` : sc.client_nom}
                        </p>
                        {sc.client_nom_shop
                          ? <p className="text-zinc-500 text-[10px] truncate">🏪 {sc.client_nom_shop}</p>
                          : sc.client_contrat && sc.client_contrat !== "Aucun" && (
                            <p className="text-zinc-600 text-[10px]">{sc.client_contrat}</p>
                          )
                        }
                      </div>
                      <button onClick={() => removeClient(sc.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-400 transition-all shrink-0 p-1 rounded">
                        <Trash2 size={11}/>
                      </button>
                    </div>
                  </td>

                  {/* Cellules mois */}
                  {MOIS.map((_, i) => {
                    const mois   = i + 1
                    const cmd    = getCommande(sc.client_id, mois)
                    const hasCmd = !!cmd

                    return (
                      <td key={mois} className="border-b border-r border-zinc-800/60 p-1">
                        <button
                          onClick={() => {
                            if (hasCmd) {
                              setDetailModal({ client: sc, mois, commande: cmd! })
                            } else {
                              setCommandeModal({ client: sc, mois, commande: null })
                            }
                          }}
                          className={`w-full h-[72px] rounded-xl text-center transition-all duration-200 flex flex-col items-center justify-center gap-0.5 border ${
                            hasCmd
                              ? "bg-green-500/15 border-green-500/40 hover:bg-green-500/25 hover:border-green-500/60"
                              : "bg-red-500/10 border-red-500/20 hover:bg-red-500/15 hover:border-red-500/35"
                          }`}>
                          {hasCmd ? (
                            <>
                              <span className="text-[9px]">✅</span>
                              <p className="text-green-400 text-[11px] font-black leading-tight">
                                {Number(cmd.montant).toFixed(0)}€
                              </p>
                              {cmd.date_commande && (
                                <p className="text-green-600 text-[9px] leading-tight font-medium">
                                  {new Date(cmd.date_commande + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="text-red-500/40 text-xl">×</span>
                          )}
                        </button>
                      </td>
                    )
                  })}

                  {/* Total client */}
                  <td className="border-b border-zinc-800/60 px-3 py-2 text-center">
                    {totalParClient[rowIdx] > 0 ? (
                      <p className="text-yellow-400 text-xs font-bold">{totalParClient[rowIdx].toFixed(0)}€</p>
                    ) : (
                      <p className="text-zinc-700 text-xs">—</p>
                    )}
                  </td>
                </tr>
              ))}

              {/* Ligne totaux */}
              <tr className="bg-zinc-900/30">
                <td className="sticky left-0 z-10 bg-zinc-900/50 border-t border-r border-zinc-700 px-4 py-2">
                  <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider">Total mois</p>
                </td>
                {MOIS.map((_, i) => {
                  const t = totalParMois[i]
                  return (
                    <td key={i} className="border-t border-r border-zinc-700 px-2 py-2 text-center">
                      {t > 0
                        ? <p className="text-yellow-400 text-xs font-bold">{t.toFixed(0)}€</p>
                        : <p className="text-zinc-700 text-[10px]">—</p>
                      }
                    </td>
                  )
                })}
                <td className="border-t border-zinc-700 px-3 py-2 text-center">
                  <p className="text-yellow-500 text-xs font-black">{totalAnnee.toFixed(0)}€</p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Légende */}
          <div className="flex items-center gap-6 px-4 py-3 border-t border-zinc-900">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-md bg-green-500/15 border border-green-500/40"/>
              <span className="text-zinc-500 text-[11px]">Commande validée — cliquer pour voir le détail</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-md bg-red-500/10 border border-red-500/20"/>
              <span className="text-zinc-500 text-[11px]">Pas de commande — cliquer pour en ajouter une</span>
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

      {commandeModal && (
        <CommandeModal
          client={commandeModal.client}
          mois={commandeModal.mois}
          annee={year}
          commande={commandeModal.commande}
          societyId={activeSociety.id}
          onClose={() => setCommandeModal(null)}
          onDone={load}
        />
      )}

      {detailModal && (
        <DetailModal
          client={detailModal.client}
          commande={detailModal.commande}
          mois={detailModal.mois}
          annee={year}
          onClose={() => setDetailModal(null)}
          onEdit={() => {
            setCommandeModal({ client: detailModal.client, mois: detailModal.mois, commande: detailModal.commande })
            setDetailModal(null)
          }}
        />
      )}
    </div>
  )
}