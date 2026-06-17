"use client"

import { useEffect, useState, useCallback, useRef, type MouseEvent } from "react"
import { supabase } from "@/lib/supabase"
import {
  Plus, X, Search, Check, Trash2, ChevronLeft, ChevronRight,
  Calendar, Pencil, Bell, Package, Truck, CheckCircle2,
  Clock, AlertTriangle,
} from "lucide-react"

interface Props { activeSociety: any; profile: any }

interface SuiviClient {
  id: string; client_id: string; client_nom: string
  client_prenom?: string; client_nom_shop?: string; client_contrat?: string
  derniere_relance?: string | null
}

interface Commande {
  id: string; client_id: string; annee: number; mois: number
  montant: number; detail?: string; date_commande?: string; notes?: string
  statut_paiement?: string
  statut_colis?: string
  date_expedition?: string
  date_validation_paiement?: string
  type?: "commande" | "relance"
  vente_id?: string | null
}

const MOIS_SHORT = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"]
const MOIS_FULL  = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]
const NOW_MONTH  = new Date().getMonth() + 1
const NOW_YEAR   = new Date().getFullYear()
const TODAY      = new Date()

const PAIEMENT = {
  attente: { label: "En attente", color: "#eab308", bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.4)",  dot: "bg-yellow-400" },
  valide:  { label: "Validé",     color: "#22c55e", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.4)",  dot: "bg-green-400"  },
  relance: { label: "Relancé",    color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.4)", dot: "bg-blue-400"   },
}

const COLIS = {
  a_preparer:   { label: "À préparer",   Icon: Package,      color: "#71717a" },
  en_livraison: { label: "En livraison", Icon: Truck,        color: "#f97316" },
  recu:         { label: "Reçu ✓",       Icon: CheckCircle2, color: "#22c55e" },
}

const CONTRAT_COLORS: Record<string, string> = {
  "Essentielle": "#f97316", "Avantage": "#94a3b8", "Élite": "#eab308", "ProTeam": "#a855f7",
}

const daysDiff = (dateStr: string) =>
  Math.floor((TODAY.getTime() - new Date(dateStr).getTime()) / 86400000)

/* ── Popup validation livraison (4j) ── */
function LivraisonPopup({ commandes, clients, societyId, onClose, onDone }: {
  commandes: Commande[]; clients: SuiviClient[]; societyId: string
  onClose: () => void; onDone: () => void
}) {
  const [validating, setValidating] = useState<Set<string>>(new Set())

  const pending = commandes.filter(c =>
    c.statut_colis === "en_livraison" && c.date_expedition &&
    daysDiff(c.date_expedition) >= 4
  )
  if (pending.length === 0) { onClose(); return null }

  const validate = async (cmd: Commande) => {
    setValidating(prev => new Set(prev).add(cmd.id))
    await supabase.from("suivi_commandes").update({ statut_colis: "recu" }).eq("id", cmd.id)
    setValidating(prev => { const n = new Set(prev); n.delete(cmd.id); return n })
    onDone()
    if (pending.length <= 1) onClose()
  }

  const getClientName = (clientId: string) => {
    const c = clients.find(cl => cl.client_id === clientId)
    return c ? (c.client_prenom ? `${c.client_prenom} ${c.client_nom}` : c.client_nom) : "Client"
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-orange-500/40 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-orange-500/20 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.15), transparent)" }}>
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-xl shrink-0">🚚</div>
          <div>
            <p className="text-white font-bold">Validation de livraison</p>
            <p className="text-orange-300 text-xs">{pending.length} colis en attente de confirmation</p>
          </div>
          <button onClick={onClose} className="ml-auto text-zinc-500 hover:text-white"><X size={16}/></button>
        </div>
        <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
          {pending.map(cmd => {
            const jours = daysDiff(cmd.date_expedition!)
            const isV = validating.has(cmd.id)
            return (
              <div key={cmd.id} className="flex items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                <div>
                  <p className="text-white text-sm font-semibold">{getClientName(cmd.client_id)}</p>
                  <p className="text-zinc-500 text-xs">{MOIS_FULL[cmd.mois - 1]} · Expédié il y a {jours}j · {Number(cmd.montant).toFixed(0)}€</p>
                </div>
                <button onClick={() => validate(cmd)} disabled={isV}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black font-bold text-xs shrink-0">
                  {isV ? <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <><Check size={12}/> Reçu</>}
                </button>
              </div>
            )
          })}
        </div>
        <div className="px-5 py-3 border-t border-zinc-800">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm">Plus tard</button>
        </div>
      </div>
    </div>
  )
}

/* ── Panel commande ── */
function CommandePanel({ client, mois, annee, commande, societyId, onClose, onDone }: {
  client: SuiviClient; mois: number; annee: number
  commande: Commande | null; societyId: string
  onClose: () => void; onDone: () => void
}) {
  const [editMode, setEditMode] = useState(!commande)
  const [type, setType]         = useState<"commande" | "relance">((commande?.type as any) || "commande")
  const [montant, setMontant]   = useState(commande?.montant?.toString() || "")
  const [detail, setDetail]     = useState(commande?.detail || "")
  const [date, setDate]         = useState(commande?.date_commande || `${annee}-${String(mois).padStart(2,"0")}-01`)
  const [notes, setNotes]       = useState(commande?.notes || "")
  const [paiement, setPaiement] = useState(commande?.statut_paiement || "attente")
  const [colis, setColis]       = useState(commande?.statut_colis || "a_preparer")
  const [dateExp, setDateExp]   = useState(commande?.date_expedition || "")
  const [saving, setSaving]     = useState(false)
  const [showConvert, setShowConvert]     = useState(false)
  const [ventesDispo, setVentesDispo]     = useState<any[]>([])
  const [loadingVentes, setLoadingVentes] = useState(false)
  const [linkingId, setLinkingId]         = useState<string | null>(null)
  const montantRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!commande) setTimeout(() => montantRef.current?.focus(), 100) }, [])

  const openConvert = async () => {
    setShowConvert(true)
    setLoadingVentes(true)
    const { data } = await supabase.from("ventes").select("id, client_nom, total_ttc, paiement, created_at")
      .eq("society_id", societyId).eq("client_id", client.client_id)
      .order("created_at", { ascending: false }).limit(15)
    setVentesDispo(data || [])
    setLoadingVentes(false)
  }

  const linkVente = async (vente: any) => {
    if (!commande?.id) return
    setLinkingId(vente.id)
    const venteDateStr = vente.created_at ? vente.created_at.slice(0, 10) : date
    const payload: any = {
      type: "commande", vente_id: vente.id, montant: Number(vente.total_ttc) || 0,
      date_commande: venteDateStr,
      detail: `Liée à la vente du ${new Date(venteDateStr + "T00:00:00").toLocaleDateString("fr-FR")}`,
      statut_paiement: "valide", statut_colis: "a_preparer",
      date_validation_paiement: venteDateStr,
    }
    await supabase.from("suivi_commandes").update(payload).eq("id", commande.id)
    setLinkingId(null); setShowConvert(false); onDone(); onClose()
  }

  const switchToManualCommande = () => {
    setShowConvert(false)
    setType("commande")
    setEditMode(true)
  }

  const save = async () => {
    if (type === "commande" && (!montant || parseFloat(montant) <= 0)) return
    setSaving(true)
    const now = new Date().toISOString().slice(0, 10)
    const payload: any = {
      society_id: societyId, client_id: client.client_id, annee, mois, type,
      montant: type === "commande" ? parseFloat(montant) : 0,
      detail: type === "commande" ? (detail || null) : null,
      date_commande: date || null, notes: notes || null,
      statut_paiement: type === "commande" ? paiement : null,
      statut_colis: type === "commande" ? colis : null,
      date_expedition: type === "commande" && colis === "en_livraison" ? (dateExp || now) : null,
    }
    if (type === "commande") {
      if (paiement === "valide" && (!commande?.date_validation_paiement || commande.statut_paiement !== "valide")) {
        payload.date_validation_paiement = now
      } else if (commande?.date_validation_paiement) {
        payload.date_validation_paiement = commande.date_validation_paiement
      }
    } else {
      payload.date_validation_paiement = null
    }
    if (commande?.id) await supabase.from("suivi_commandes").update(payload).eq("id", commande.id)
    else              await supabase.from("suivi_commandes").insert(payload)
    setSaving(false); onDone(); onClose()
  }

  const deleteCmd = async () => {
    if (!commande?.id || !confirm("Supprimer cette entrée ?")) return
    await supabase.from("suivi_commandes").delete().eq("id", commande.id)
    onDone(); onClose()
  }

  const quickUpdate = async (field: string, value: string) => {
    if (!commande?.id) return
    const extra: any = {}
    if (field === "statut_paiement" && value === "valide" && commande.statut_paiement !== "valide")
      extra.date_validation_paiement = new Date().toISOString().slice(0, 10)
    if (field === "statut_colis" && value === "en_livraison" && !commande.date_expedition)
      extra.date_expedition = new Date().toISOString().slice(0, 10)
    await supabase.from("suivi_commandes").update({ [field]: value, ...extra }).eq("id", commande.id)
    if (field === "statut_paiement") setPaiement(value)
    if (field === "statut_colis")    setColis(value)
    onDone()
  }

  const contratColor = CONTRAT_COLORS[client.client_contrat || ""] || ""
  const clientName   = client.client_prenom ? `${client.client_prenom} ${client.client_nom}` : client.client_nom
  const relanceAlert = commande?.date_validation_paiement && paiement === "valide" && type === "commande"
    ? daysDiff(commande.date_validation_paiement) : null
  const isRelanceEntry = commande?.type === "relance"

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-zinc-800 shrink-0"
          style={contratColor ? { background: `linear-gradient(135deg, ${contratColor}12, transparent)` } : {}}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">{MOIS_FULL[mois - 1]} {annee}</p>
              <h2 className="text-white font-bold text-base">{clientName}</h2>
              {client.client_nom_shop && <p className="text-zinc-400 text-xs mt-0.5">🏪 {client.client_nom_shop}</p>}
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16}/></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Alerte relance */}
          {relanceAlert !== null && relanceAlert >= 25 && (
            <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3">
              <Bell size={16} className="text-blue-400 shrink-0 animate-pulse"/>
              <div>
                <p className="text-blue-300 text-sm font-bold">Relance recommandée !</p>
                <p className="text-blue-400/70 text-xs">Paiement validé il y a {relanceAlert} jours</p>
              </div>
              {commande?.id && (
                <button onClick={() => quickUpdate("statut_paiement", "relance")}
                  className="ml-auto text-xs font-bold px-2.5 py-1.5 rounded-lg bg-blue-500 text-black shrink-0">
                  Relancé ✓
                </button>
              )}
            </div>
          )}
          {relanceAlert !== null && relanceAlert >= 20 && relanceAlert < 25 && (
            <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
              <Clock size={14} className="text-yellow-400 shrink-0"/>
              <p className="text-yellow-300 text-xs">Relance dans <span className="font-black">{25 - relanceAlert}</span> jours</p>
            </div>
          )}

          {/* Commande / Relance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                {showConvert ? "Lier à une vente" : isRelanceEntry ? "Relance" : "Commande"}
              </p>
              {commande && !editMode && !showConvert && (
                <button onClick={() => setEditMode(true)} className="text-zinc-600 hover:text-white flex items-center gap-1 text-[10px]">
                  <Pencil size={10}/> Modifier
                </button>
              )}
            </div>

            {showConvert ? (
              <div className="space-y-2">
                <button onClick={() => setShowConvert(false)} className="text-zinc-500 hover:text-white text-[10px] mb-1">← Retour</button>
                {loadingVentes ? (
                  <div className="flex items-center justify-center py-8"><div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/></div>
                ) : ventesDispo.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-zinc-500 text-sm mb-3">Aucune vente trouvée pour ce client</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {ventesDispo.map(v => (
                      <button key={v.id} onClick={() => linkVente(v)} disabled={linkingId === v.id}
                        className="w-full flex items-center justify-between gap-2 bg-zinc-900 border border-zinc-800 hover:border-green-500/40 rounded-xl px-3 py-2.5 text-left disabled:opacity-50">
                        <div>
                          <p className="text-white text-sm font-bold">{Number(v.total_ttc).toFixed(2)}€</p>
                          <p className="text-zinc-500 text-[10px]">{v.created_at ? new Date(v.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" }) : ""} · {v.paiement || "—"}</p>
                        </div>
                        {linkingId === v.id
                          ? <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"/>
                          : <Check size={14} className="text-zinc-600"/>}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={switchToManualCommande}
                  className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-semibold text-xs mt-2">
                  Pas de vente correspondante → saisir manuellement
                </button>
              </div>
            ) : !editMode && commande && isRelanceEntry ? (
              <div className="space-y-2">
                <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl px-4 py-3 text-center">
                  <p className="text-blue-300 text-sm font-bold flex items-center justify-center gap-1.5"><Bell size={14}/> Relance effectuée</p>
                  {commande.date_commande && (
                    <p className="text-blue-400/70 text-xs mt-0.5">
                      {new Date(commande.date_commande + "T00:00:00").toLocaleDateString("fr-FR", { weekday:"short", day:"numeric", month:"long" })}
                    </p>
                  )}
                </div>
                {commande.notes && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5">
                    <p className="text-zinc-500 text-[10px] mb-0.5">📝 Notes</p>
                    <p className="text-zinc-400 text-sm">{commande.notes}</p>
                  </div>
                )}
                <button onClick={openConvert}
                  className="w-full py-2.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-500/20">
                  💰 Transformer en commande
                </button>
              </div>
            ) : !editMode && commande ? (
              <div className="space-y-2">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-center">
                  <p className="text-white text-2xl font-black">{Number(commande.montant).toFixed(2)}€</p>
                  {commande.date_commande && (
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {new Date(commande.date_commande + "T00:00:00").toLocaleDateString("fr-FR", { weekday:"short", day:"numeric", month:"long" })}
                    </p>
                  )}
                </div>
                {commande.detail && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5">
                    <p className="text-zinc-500 text-[10px] mb-0.5">📦 Détail</p>
                    <p className="text-zinc-300 text-sm">{commande.detail}</p>
                  </div>
                )}
                {commande.notes && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5">
                    <p className="text-zinc-500 text-[10px] mb-0.5">📝 Notes</p>
                    <p className="text-zinc-400 text-sm">{commande.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {(!commande || isRelanceEntry) && (
                  <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={() => setType("relance")}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all"
                      style={{
                        backgroundColor: type === "relance" ? "rgba(59,130,246,0.12)" : "rgba(39,39,42,0.5)",
                        borderColor: type === "relance" ? "rgba(59,130,246,0.4)" : "rgba(63,63,70,0.5)",
                        color: type === "relance" ? "#3b82f6" : "#52525b",
                      }}>
                      <Bell size={12}/> Relance
                    </button>
                    <button onClick={() => setType("commande")}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all"
                      style={{
                        backgroundColor: type === "commande" ? "rgba(34,197,94,0.12)" : "rgba(39,39,42,0.5)",
                        borderColor: type === "commande" ? "rgba(34,197,94,0.4)" : "rgba(63,63,70,0.5)",
                        color: type === "commande" ? "#22c55e" : "#52525b",
                      }}>
                      💰 Commande
                    </button>
                  </div>
                )}

                {type === "relance" ? (
                  <>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"/>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && save()}
                      placeholder="Note de relance (optionnel)..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <input ref={montantRef} type="number" step="0.01" min="0" value={montant}
                        onChange={e => setMontant(e.target.value)} placeholder="0.00"
                        onKeyDown={e => e.key === "Enter" && save()}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-xl text-white font-bold focus:outline-none focus:border-green-500/60 pr-10"/>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">€</span>
                    </div>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"/>
                    <textarea value={detail} onChange={e => setDetail(e.target.value)} rows={2}
                      placeholder="Détail de la commande..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"/>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Notes..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Paiement */}
          {type === "commande" && !showConvert && (
          <div>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">💳 Paiement</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.entries(PAIEMENT) as [string, typeof PAIEMENT.attente][]).map(([key, cfg]) => {
                const isActive = paiement === key
                return (
                  <button key={key}
                    onClick={() => commande?.id ? quickUpdate("statut_paiement", key) : setPaiement(key)}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-bold transition-all"
                    style={{
                      backgroundColor: isActive ? cfg.bg : "rgba(39,39,42,0.5)",
                      borderColor: isActive ? cfg.border : "rgba(63,63,70,0.5)",
                      color: isActive ? cfg.color : "#52525b",
                    }}>
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`}/>
                    <span className="text-[10px]">{cfg.label}</span>
                  </button>
                )
              })}
            </div>
            {paiement === "valide" && commande?.date_validation_paiement && (
              <p className="text-green-600 text-[10px] mt-1.5 flex items-center gap-1">
                <Check size={10}/> Validé le {new Date(commande.date_validation_paiement + "T00:00:00").toLocaleDateString("fr-FR")}
                {relanceAlert !== null && <span className="text-zinc-600 ml-1">· J+{relanceAlert}/25</span>}
              </p>
            )}
          </div>
          )}

          {/* Livraison */}
          {type === "commande" && !showConvert && (
          <div>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">📦 Livraison</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.entries(COLIS) as [string, typeof COLIS.a_preparer][]).map(([key, cfg]) => {
                const isActive = colis === key
                const { Icon } = cfg
                return (
                  <button key={key}
                    onClick={() => commande?.id ? quickUpdate("statut_colis", key) : setColis(key)}
                    className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all"
                    style={{
                      backgroundColor: isActive ? cfg.color + "18" : "rgba(39,39,42,0.5)",
                      borderColor: isActive ? cfg.color + "50" : "rgba(63,63,70,0.5)",
                      color: isActive ? cfg.color : "#52525b",
                    }}>
                    <Icon size={14}/>
                    <span className="text-[9px] text-center leading-tight">{cfg.label}</span>
                  </button>
                )
              })}
            </div>
            {(colis === "en_livraison" || commande?.statut_colis === "en_livraison") && (
              <div className="mt-2">
                <label className="block text-[10px] text-zinc-600 mb-1">Date d&apos;expédition</label>
                <input type="date" value={dateExp || commande?.date_expedition || ""}
                  onChange={e => setDateExp(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"/>
              </div>
            )}
            {commande?.date_expedition && colis === "en_livraison" && (
              <p className="text-orange-400 text-[10px] mt-1.5 flex items-center gap-1">
                <Truck size={10}/>
                Expédié le {new Date(commande.date_expedition + "T00:00:00").toLocaleDateString("fr-FR")}
                {daysDiff(commande.date_expedition) >= 4 && <span className="text-orange-300 font-bold"> · Confirmer réception ?</span>}
              </p>
            )}
          </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-zinc-800 space-y-2 shrink-0">
          {editMode && !showConvert && (
            <div className="flex gap-2">
              <button onClick={save} disabled={saving || (type === "commande" && (!montant || parseFloat(montant) <= 0))}
                className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black font-bold text-sm flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <><Check size={14}/> {commande ? "Mettre à jour" : type === "relance" ? "Valider la relance" : "Valider"}</>}
              </button>
              {commande && (
                <button onClick={() => setEditMode(false)}
                  className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm">Annuler</button>
              )}
            </div>
          )}
          {commande && !showConvert && (
            <button onClick={deleteCmd}
              className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400/70 hover:bg-red-500/15 font-semibold text-sm flex items-center justify-center gap-2">
              <Trash2 size={12}/> Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Modal ajout client ── */
function AddClientModal({ societyId, existingClientIds, onClose, onDone }: {
  societyId: string; existingClientIds: string[]; onClose: () => void; onDone: () => void
}) {
  const [clients, setClients]   = useState<any[]>([])
  const [search, setSearch]     = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    supabase.from("clients").select("id,nom,prenom,nom_shop,contrat").eq("society_id", societyId).order("nom")
      .then(({ data }) => setClients(data || []))
  }, [societyId])

  const filtered = clients
    .filter(c => !existingClientIds.includes(c.id))
    .filter(c => { const s = search.toLowerCase(); return !s || c.nom?.toLowerCase().includes(s) || c.prenom?.toLowerCase().includes(s) || c.nom_shop?.toLowerCase().includes(s) })

  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const save = async () => {
    if (!selected.size) return
    setSaving(true)
    await supabase.from("suivi_clients").insert(Array.from(selected).map(client_id => ({ society_id: societyId, client_id })))
    setSaving(false); onDone(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
          <div><p className="text-white font-bold">Ajouter au suivi</p><p className="text-zinc-500 text-xs">{selected.size} sélectionné{selected.size > 1 ? "s" : ""}</p></div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16}/></button>
        </div>
        <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input type="text" placeholder="Nom, prénom, shop..." value={search} onChange={e => setSearch(e.target.value)} autoFocus
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none"/>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-8">
              {clients.filter(c => !existingClientIds.includes(c.id)).length === 0 ? "Tous les clients sont dans le suivi" : "Aucun résultat"}
            </p>
          ) : filtered.map(c => {
            const isSel = selected.has(c.id); const cc = CONTRAT_COLORS[c.contrat || ""]
            return (
              <button key={c.id} onClick={() => toggle(c.id)}
                className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/50 transition-colors ${isSel ? "bg-green-500/5" : ""}`}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSel ? "bg-green-500 border-green-500" : "border-zinc-600"}`}>
                  {isSel && <Check size={12} className="text-black"/>}
                </div>
                {cc && <div className="w-1 h-7 rounded-full shrink-0" style={{ backgroundColor: cc }}/>}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{c.prenom ? `${c.prenom} ${c.nom}` : c.nom}</p>
                  {c.nom_shop ? <p className="text-zinc-500 text-[11px]">🏪 {c.nom_shop}</p> : c.contrat && c.contrat !== "Aucun" && <p className="text-zinc-600 text-[11px]">{c.contrat}</p>}
                </div>
              </button>
            )
          })}
        </div>
        <div className="px-5 py-4 border-t border-zinc-800 flex gap-2 shrink-0">
          <button onClick={save} disabled={saving || !selected.size}
            className="flex-1 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold text-sm flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <><Plus size={14}/> Ajouter {selected.size > 0 ? `(${selected.size})` : ""}</>}
          </button>
          <button onClick={onClose} className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ── Panel clients inactifs (−25j sans commande) ── */
function InactifsPanel({ items, onClose, onSelectClient, onRelance }: {
  items: { client: SuiviClient; lastDate: string | null; jours: number | null }[]
  onClose: () => void
  onSelectClient: (client: SuiviClient) => void
  onRelance: (client: SuiviClient) => Promise<void>
}) {
  const [relancingId, setRelancingId] = useState<string | null>(null)

  const handleRelance = async (e: MouseEvent, client: SuiviClient) => {
    e.stopPropagation()
    setRelancingId(client.id)
    await onRelance(client)
    setRelancingId(null)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-zinc-800 shrink-0"
          style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.12), transparent)" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <AlertTriangle size={11}/> Clients inactifs
              </p>
              <h2 className="text-white font-bold text-base">Sans commande depuis 25j+</h2>
              <p className="text-zinc-500 text-xs mt-0.5">{items.length} client{items.length > 1 ? "s" : ""} concerné{items.length > 1 ? "s" : ""}</p>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16}/></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <span className="text-4xl mb-3">🎉</span>
              <p className="text-zinc-400 text-sm font-semibold">Tous vos clients sont à jour !</p>
              <p className="text-zinc-600 text-xs mt-1">Aucun client sans commande depuis plus de 25 jours</p>
            </div>
          ) : items.map(({ client, lastDate, jours }) => {
            const contratColor = CONTRAT_COLORS[client.client_contrat || ""] || ""
            const clientName = client.client_prenom ? `${client.client_prenom} ${client.client_nom}` : client.client_nom
            const isRelancing = relancingId === client.id
            return (
              <div key={client.id}
                className="w-full bg-zinc-900 border border-zinc-800 hover:border-red-500/30 rounded-xl px-4 py-3 transition-colors">
                <button onClick={() => onSelectClient(client)} className="w-full flex items-center gap-3 text-left">
                  {contratColor && <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: contratColor }}/>}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{clientName}</p>
                    {client.client_nom_shop && <p className="text-zinc-500 text-[11px] truncate">🏪 {client.client_nom_shop}</p>}
                    <p className="text-zinc-600 text-[11px] mt-0.5">
                      {lastDate
                        ? `Dernière commande : ${new Date(lastDate + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`
                        : "Aucune commande enregistrée"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {jours !== null
                      ? <p className="text-red-400 text-sm font-black">{jours}j</p>
                      : <p className="text-red-500 text-[10px] font-bold">Jamais</p>}
                  </div>
                </button>
                <button onClick={e => handleRelance(e, client)} disabled={isRelancing}
                  className="w-full mt-2.5 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/10 border border-blue-500/25 hover:bg-blue-500/20 disabled:opacity-50 text-blue-300 text-xs font-bold transition-colors">
                  {isRelancing
                    ? <div className="w-3 h-3 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"/>
                    : <><Bell size={11}/> Relancé — ne plus signaler ce mois</>}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN MODULE
══════════════════════════════════════════════ */
export default function SuiviModule({ activeSociety, profile }: Props) {
  const [suiviClients, setSuiviClients]   = useState<SuiviClient[]>([])
  const [commandes, setCommandes]         = useState<Commande[]>([])
  const [lastCommandeMap, setLastCommandeMap] = useState<Record<string, string | null>>({})
  const [loading, setLoading]             = useState(true)
  const [year, setYear]                   = useState(NOW_YEAR)
  const [search, setSearch]               = useState("")
  const [showAddClient, setShowAddClient] = useState(false)
  const [panel, setPanel]                 = useState<{ client: SuiviClient; mois: number; commande: Commande | null } | null>(null)
  const [livraisonPopup, setLivraisonPopup] = useState(false)
  const [showInactifs, setShowInactifs]   = useState(false)

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const [{ data: sc }, { data: cmd }, { data: allCmd }] = await Promise.all([
      supabase.from("suivi_clients").select("id, client_id, derniere_relance, clients(nom, prenom, nom_shop, contrat)")
        .eq("society_id", activeSociety.id).order("created_at"),
      supabase.from("suivi_commandes").select("*").eq("society_id", activeSociety.id).eq("annee", year),
      supabase.from("suivi_commandes").select("client_id, date_commande")
        .eq("society_id", activeSociety.id).not("date_commande", "is", null)
        .order("date_commande", { ascending: false }),
    ])
    setSuiviClients((sc || []).map((s: any) => ({
      id: s.id, client_id: s.client_id, client_nom: s.clients?.nom || "?",
      client_prenom: s.clients?.prenom || "", client_nom_shop: s.clients?.nom_shop || "",
      client_contrat: s.clients?.contrat || "", derniere_relance: s.derniere_relance || null,
    })))
    setCommandes(cmd || [])
    const lastMap: Record<string, string | null> = {}
    ;(allCmd || []).forEach((c: any) => { if (!lastMap[c.client_id]) lastMap[c.client_id] = c.date_commande })
    setLastCommandeMap(lastMap)
    setLoading(false)
    const pending = (cmd || []).filter((c: any) =>
      c.statut_colis === "en_livraison" && c.date_expedition && daysDiff(c.date_expedition) >= 4
    )
    if (pending.length > 0) setTimeout(() => setLivraisonPopup(true), 1500)
  }, [activeSociety?.id, year])

  useEffect(() => { load() }, [load])

  const handleDone = async () => {
    await load()
    if (panel) {
      const { data } = await supabase.from("suivi_commandes").select("*")
        .eq("society_id", activeSociety.id).eq("client_id", panel.client.client_id)
        .eq("annee", year).eq("mois", panel.mois).limit(1).then(r => ({ data: r.data?.[0] || null }))
      setPanel(p => p ? { ...p, commande: data || null } : null)
    }
  }

  const removeClient = async (suiviId: string) => {
    if (!confirm("Retirer ce client du suivi ?")) return
    await supabase.from("suivi_clients").delete().eq("id", suiviId)
    setSuiviClients(prev => prev.filter(c => c.id !== suiviId))
  }

  const getCmd = (clientId: string, mois: number): Commande | null =>
    commandes.find(c => c.client_id === clientId && c.mois === mois) || null

  const filteredClients = suiviClients.filter(sc => {
    if (!search) return true
    const s = search.toLowerCase()
    return sc.client_nom?.toLowerCase().includes(s) || sc.client_prenom?.toLowerCase().includes(s) || sc.client_nom_shop?.toLowerCase().includes(s)
  })

  const totalAnnee      = commandes.reduce((s, c) => s + Number(c.montant || 0), 0)
  const cellsVertes     = commandes.length
  const cellsTotal      = suiviClients.length * 12
  const tauxCouverture  = cellsTotal > 0 ? Math.round((cellsVertes / cellsTotal) * 100) : 0
  const relanceDue      = commandes.filter(c => c.statut_paiement === "valide" && c.date_validation_paiement && daysDiff(c.date_validation_paiement) >= 25).length
  const livraisonsEnCours = commandes.filter(c => c.statut_colis === "en_livraison").length
  const totalParMois    = MOIS_SHORT.map((_, i) => commandes.filter(c => c.mois === i + 1).reduce((s, c) => s + Number(c.montant || 0), 0))

  /* ── Clients sans commande depuis 25j+ (ou jamais commandé), hors ceux relancés récemment ── */
  const inactifs = suiviClients
    .map(sc => {
      const lastDate = lastCommandeMap[sc.client_id] || null
      const jours = lastDate ? daysDiff(lastDate) : null
      return { client: sc, lastDate, jours }
    })
    .filter(x => {
      const isInactive = x.jours === null || x.jours >= 25
      if (!isInactive) return false
      if (x.client.derniere_relance && daysDiff(x.client.derniere_relance) < 25) return false
      return true
    })
    .sort((a, b) => {
      if (a.jours === null && b.jours === null) return 0
      if (a.jours === null) return -1
      if (b.jours === null) return 1
      return b.jours - a.jours
    })

  const relancerClient = async (client: SuiviClient) => {
    const today = new Date().toISOString().slice(0, 10)
    await supabase.from("suivi_clients").update({ derniere_relance: today }).eq("id", client.id)
    setSuiviClients(prev => prev.map(c => c.id === client.id ? { ...c, derniere_relance: today } : c))
  }

  const handleSelectInactif = async (client: SuiviClient) => {
    setShowInactifs(false)
    if (year !== NOW_YEAR) setYear(NOW_YEAR)
    const { data } = await supabase.from("suivi_commandes").select("*")
      .eq("society_id", activeSociety.id).eq("client_id", client.client_id)
      .eq("annee", NOW_YEAR).eq("mois", NOW_MONTH).limit(1)
    setPanel({ client, mois: NOW_MONTH, commande: data?.[0] || null })
  }

  return (
    <div className="flex-1 overflow-hidden bg-[#0a0a0a] flex flex-col">
      <div className="border-b border-zinc-900 px-4 pt-4 pb-3 shrink-0 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-white font-bold text-xl">📋 Suivi clients</h1>
            <p className="text-zinc-500 text-xs mt-0.5">{suiviClients.length} clients · {year}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowInactifs(true)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 border transition-colors ${
                inactifs.length > 0
                  ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/15"
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-600"
              }`}>
              <AlertTriangle size={12} className={inactifs.length > 0 ? "text-red-400 animate-pulse" : "text-zinc-500"}/>
              <span className={`text-xs font-bold ${inactifs.length > 0 ? "text-red-300" : "text-zinc-400"}`}>
                {inactifs.length} −25j
              </span>
            </button>
            {relanceDue > 0 && (
              <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-2">
                <Bell size={12} className="text-blue-400 animate-pulse"/>
                <span className="text-blue-300 text-xs font-bold">{relanceDue} relance{relanceDue > 1 ? "s" : ""}</span>
              </div>
            )}
            {livraisonsEnCours > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2">
                <Truck size={12} className="text-orange-400"/>
                <span className="text-orange-300 text-xs font-bold">{livraisonsEnCours} en cours</span>
              </div>
            )}
            <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1.5">
              <button onClick={() => setYear(y => y - 1)} className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800"><ChevronLeft size={14}/></button>
              <span className="text-white font-bold text-sm px-2 min-w-[3rem] text-center">{year}</span>
              <button onClick={() => setYear(y => y + 1)} disabled={year >= NOW_YEAR} className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 disabled:opacity-30"><ChevronRight size={14}/></button>
            </div>
            <button onClick={() => setShowAddClient(true)}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-yellow-500/20">
              <Plus size={15}/> Ajouter
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { label: "CA annuel",  value: totalAnnee.toFixed(0)+"€", color: "text-yellow-400" },
            { label: "Couverture", value: tauxCouverture+"%",         color: tauxCouverture > 60 ? "text-green-400" : "text-yellow-400" },
            { label: "Validés",    value: String(commandes.filter(c => c.statut_paiement === "valide").length),  color: "text-green-400"  },
            { label: "En attente", value: String(commandes.filter(c => c.statut_paiement === "attente").length), color: "text-yellow-400" },
            { label: "À préparer", value: String(commandes.filter(c => c.statut_colis === "a_preparer").length), color: "text-zinc-400"   },
          ].map(({ label, value, color }) => (
            <div key={label} className="shrink-0 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 flex items-center gap-2">
              <p className={`text-sm font-black ${color}`}>{value}</p>
              <p className="text-zinc-600 text-[10px]">{label}</p>
            </div>
          ))}
        </div>

        {suiviClients.length > 0 && (
          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-700" style={{ width: `${tauxCouverture}%` }}/>
          </div>
        )}

        {suiviClients.length > 3 && (
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input type="text" placeholder="Filtrer les clients..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/40"/>
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"><X size={12}/></button>}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/></div>
      ) : suiviClients.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-white text-lg font-bold mb-2">Aucun client dans le suivi</p>
          <p className="text-zinc-500 text-sm mb-6">Ajoutez vos clients pour suivre leurs commandes</p>
          <button onClick={() => setShowAddClient(true)} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl text-sm"><Plus size={15}/> Ajouter un client</button>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="border-collapse" style={{ minWidth: `${180 + 12 * 84 + 72}px` }}>
            <thead className="sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 z-30 bg-[#0d0d0d] border-b border-r border-zinc-800 px-3 py-2.5 w-[180px] min-w-[180px]">
                  <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-wider">Client</span>
                </th>
                {MOIS_SHORT.map((m, i) => {
                  const moisNum = i + 1
                  const isCurrent = year === NOW_YEAR && moisNum === NOW_MONTH
                  const isPast    = year < NOW_YEAR || (year === NOW_YEAR && moisNum < NOW_MONTH)
                  const total     = totalParMois[i]
                  return (
                    <th key={m} className="border-b border-r border-zinc-800 py-2 px-0.5 min-w-[84px] text-center"
                      style={{ backgroundColor: isCurrent ? "#eab30812" : "#0d0d0d", borderBottomColor: isCurrent ? "#eab30860" : undefined }}>
                      <p className={`text-[10px] font-bold ${isCurrent ? "text-yellow-400" : isPast ? "text-zinc-600" : "text-zinc-300"}`}>
                        {m}{isCurrent && <span className="text-yellow-500 ml-0.5">●</span>}
                      </p>
                      {total > 0 ? <p className="text-[9px] text-zinc-500 font-semibold">{total.toFixed(0)}€</p> : <p className="text-[9px] text-zinc-800">—</p>}
                    </th>
                  )
                })}
                <th className="bg-[#0d0d0d] border-b border-zinc-800 px-3 py-2.5 w-[72px] min-w-[72px] text-center">
                  <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-wider">Total</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(sc => {
                const clientCmds   = commandes.filter(c => c.client_id === sc.client_id)
                const clientTotal  = clientCmds.reduce((s, c) => s + Number(c.montant || 0), 0)
                const clientCoverage = clientCmds.length
                const contratColor = CONTRAT_COLORS[sc.client_contrat || ""] || ""
                return (
                  <tr key={sc.id} className="group">
                    <td className="sticky left-0 z-10 bg-[#0a0a0a] group-hover:bg-zinc-900/40 border-b border-r border-zinc-800/60 transition-colors"
                      style={contratColor ? { borderLeft: `2px solid ${contratColor}60` } : {}}>
                      <div className="flex items-center justify-between gap-1 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-[12px] font-semibold truncate">
                            {sc.client_prenom ? `${sc.client_prenom} ${sc.client_nom}` : sc.client_nom}
                          </p>
                          {sc.client_nom_shop
                            ? <p className="text-zinc-500 text-[10px] truncate">🏪 {sc.client_nom_shop}</p>
                            : sc.client_contrat && sc.client_contrat !== "Aucun"
                            ? <p className="text-[10px] font-semibold" style={{ color: contratColor || "#71717a" }}>{sc.client_contrat}</p>
                            : null
                          }
                          <div className="flex gap-0.5 mt-1">
                            {Array.from({ length: 12 }).map((_, i) => {
                              const cmd = getCmd(sc.client_id, i + 1)
                              const pColor = cmd?.type === "relance" ? "#06b6d4" : cmd?.statut_paiement === "valide" ? "#22c55e" : cmd?.statut_paiement === "relance" ? "#3b82f6" : cmd ? "#eab308" : year === NOW_YEAR && i + 1 === NOW_MONTH ? "#eab30830" : "#27272a"
                              return <div key={i} className="w-2 h-1 rounded-full" style={{ backgroundColor: pColor }}/>
                            })}
                          </div>
                        </div>
                        <button onClick={() => removeClient(sc.id)} className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-400 transition-all shrink-0 p-1 rounded"><Trash2 size={10}/></button>
                      </div>
                    </td>
                    {MOIS_SHORT.map((_, i) => {
                      const moisNum   = i + 1
                      const cmd       = getCmd(sc.client_id, moisNum)
                      const isCurrent = year === NOW_YEAR && moisNum === NOW_MONTH
                      const isPast    = year < NOW_YEAR || (year === NOW_YEAR && moisNum < NOW_MONTH)
                      const isActive  = panel?.client.client_id === sc.client_id && panel?.mois === moisNum
                      let cellBg = "rgba(39,39,42,0.2)"; let cellBorder = "rgba(63,63,70,0.3)"
                      if (cmd?.type === "relance") { cellBg = "rgba(6,182,212,0.12)"; cellBorder = "rgba(6,182,212,0.4)" }
                      else if (cmd) {
                        const p = (cmd.statut_paiement || "attente") as keyof typeof PAIEMENT
                        cellBg = PAIEMENT[p]?.bg || cellBg; cellBorder = PAIEMENT[p]?.border || cellBorder
                      } else if (isPast) { cellBg = "rgba(239,68,68,0.04)"; cellBorder = "rgba(239,68,68,0.1)" }
                      const relance25 = cmd?.date_validation_paiement && cmd.statut_paiement === "valide" && daysDiff(cmd.date_validation_paiement) >= 25
                      const ColisIconComp = cmd ? (COLIS[(cmd.statut_colis || "a_preparer") as keyof typeof COLIS] || COLIS.a_preparer).Icon : null
                      const colisColor = cmd ? (COLIS[(cmd.statut_colis || "a_preparer") as keyof typeof COLIS] || COLIS.a_preparer).color : ""
                      return (
                        <td key={moisNum} className="border-b border-r border-zinc-800/40 p-0.5" style={isCurrent ? { backgroundColor: "#eab3080a" } : {}}>
                          <button onClick={() => setPanel({ client: sc, mois: moisNum, commande: cmd })}
                            className="w-full h-[64px] rounded-lg text-center transition-all duration-150 flex flex-col items-center justify-center gap-0.5 border group/cell relative"
                            style={{ backgroundColor: cellBg, borderColor: isActive ? "#eab308" : cellBorder, boxShadow: isActive ? "0 0 0 1px #eab30850" : "none" }}>
                            {relance25 && (
                              <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
                                <Bell size={7} className="text-white"/>
                              </div>
                            )}
                            {cmd?.type === "relance" ? (
                              <>
                                <Bell size={14} className="text-cyan-400"/>
                                <p className="text-[9px] font-bold leading-none text-cyan-400">Relancé</p>
                                {cmd.date_commande && (
                                  <p className="text-[8px] leading-none opacity-70 text-cyan-400">
                                    {new Date(cmd.date_commande + "T00:00:00").toLocaleDateString("fr-FR", { day:"numeric", month:"short" })}
                                  </p>
                                )}
                              </>
                            ) : cmd ? (
                              <>
                                <p className="text-[12px] font-black leading-none"
                                  style={{ color: PAIEMENT[(cmd.statut_paiement || "attente") as keyof typeof PAIEMENT]?.color || "#eab308" }}>
                                  {Number(cmd.montant).toFixed(0)}€
                                </p>
                                {cmd.date_commande && (
                                  <p className="text-[9px] leading-none opacity-70"
                                    style={{ color: PAIEMENT[(cmd.statut_paiement || "attente") as keyof typeof PAIEMENT]?.color || "#eab308" }}>
                                    {new Date(cmd.date_commande + "T00:00:00").toLocaleDateString("fr-FR", { day:"numeric", month:"short" })}
                                  </p>
                                )}
                                <div className="flex items-center gap-1 mt-0.5">
                                  {ColisIconComp && <ColisIconComp size={9} color={colisColor}/>}
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PAIEMENT[(cmd.statut_paiement || "attente") as keyof typeof PAIEMENT]?.color || "#eab308" }}/>
                                </div>
                              </>
                            ) : isPast ? (
                              <AlertTriangle size={13} className="text-red-500/20 group-hover/cell:text-red-500/40 transition-colors"/>
                            ) : (
                              <Plus size={13} className="text-zinc-700 group-hover/cell:text-zinc-400 transition-colors"/>
                            )}
                          </button>
                        </td>
                      )
                    })}
                    <td className="border-b border-zinc-800/40 px-2 py-2 text-center">
                      {clientTotal > 0 ? (
                        <div><p className="text-yellow-400 text-xs font-black">{clientTotal.toFixed(0)}€</p><p className="text-zinc-700 text-[9px]">{clientCoverage}×</p></div>
                      ) : <p className="text-zinc-800 text-xs">—</p>}
                    </td>
                  </tr>
                )
              })}
              <tr>
                <td className="sticky left-0 z-10 bg-zinc-900/60 border-t-2 border-r border-zinc-700 px-3 py-2.5">
                  <p className="text-zinc-400 text-[10px] font-black uppercase tracking-wider">Total</p>
                </td>
                {MOIS_SHORT.map((_, i) => {
                  const t = totalParMois[i]
                  return (
                    <td key={i} className="border-t-2 border-r border-zinc-700 px-1 py-2 text-center bg-zinc-900/30">
                      {t > 0 ? <p className="text-yellow-400 text-[11px] font-black">{t.toFixed(0)}€</p> : <p className="text-zinc-800 text-[10px]">—</p>}
                    </td>
                  )
                })}
                <td className="border-t-2 border-zinc-700 px-2 py-2 text-center bg-zinc-900/30">
                  <p className="text-yellow-500 text-xs font-black">{totalAnnee.toFixed(0)}€</p>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-zinc-900/60 flex-wrap">
            {[{ color: "#eab308", label: "En attente" }, { color: "#22c55e", label: "Validé" }, { color: "#3b82f6", label: "Paiement relancé" }, { color: "#06b6d4", label: "Relance commerciale" }].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}/><span className="text-zinc-600 text-[10px]">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5"><Package size={10} className="text-blue-600"/><span className="text-zinc-600 text-[10px]">À préparer</span></div>
            <div className="flex items-center gap-1.5"><Truck size={10} className="text-orange-600"/><span className="text-zinc-600 text-[10px]">En livraison</span></div>
            <div className="flex items-center gap-1.5"><CheckCircle2 size={10} className="text-green-600"/><span className="text-zinc-600 text-[10px]">Reçu</span></div>
          </div>
        </div>
      )}

      {showAddClient && (
        <AddClientModal societyId={activeSociety.id} existingClientIds={suiviClients.map(c => c.client_id)}
          onClose={() => setShowAddClient(false)} onDone={load}/>
      )}
      {panel && (
        <CommandePanel client={panel.client} mois={panel.mois} annee={year} commande={panel.commande}
          societyId={activeSociety.id} onClose={() => setPanel(null)} onDone={handleDone}/>
      )}
      {livraisonPopup && (
        <LivraisonPopup commandes={commandes} clients={suiviClients} societyId={activeSociety.id}
          onClose={() => setLivraisonPopup(false)} onDone={load}/>
      )}
      {showInactifs && (
        <InactifsPanel items={inactifs} onClose={() => setShowInactifs(false)} onSelectClient={handleSelectInactif} onRelance={relancerClient}/>
      )}
    </div>
  )
}