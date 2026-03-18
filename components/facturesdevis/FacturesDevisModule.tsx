"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Plus, X, Check, Pencil, Trash2, Eye, FileText, Upload, ExternalLink, CheckCircle, Clock, AlertTriangle, ShoppingCart } from "lucide-react"

interface Props { activeSociety: any; profile: any }

/* ══ TYPES ══ */
interface DevisItem { nom: string; qty: number; prix_ht: number }
interface Devis {
  id: string; numero: string; client_nom: string; client_email: string; client_adresse: string
  items: DevisItem[]; total_ht: number; total_ttc: number
  statut: "brouillon"|"envoye"|"accepte"|"refuse"|"expire"
  notes: string; date_emission: string; date_validite: string
  vente_id: string | null; created_at: string; society_id: string
}
interface Facture {
  id: string; numero: string; client_nom: string; montant: number
  statut: "en_attente"|"payee"|"en_retard"
  source: "manuelle"|"vente"|"devis"
  vente_id: string | null; devis_id: string | null
  fichier_url: string | null; fichier_nom: string | null
  date_emission: string; date_echeance: string | null; date_paiement: string | null
  notes: string; created_at: string
}

/* ══ CONFIG ══ */
const DEVIS_STATUTS = {
  brouillon: { label: "Brouillon",   color: "#71717a", bg: "bg-zinc-500/10 border-zinc-500/30" },
  envoye:    { label: "Envoyé",      color: "#3b82f6", bg: "bg-blue-500/10 border-blue-500/30" },
  accepte:   { label: "Accepté",     color: "#22c55e", bg: "bg-green-500/10 border-green-500/30" },
  refuse:    { label: "Refusé",      color: "#ef4444", bg: "bg-red-500/10 border-red-500/30" },
  expire:    { label: "Expiré",      color: "#f97316", bg: "bg-orange-500/10 border-orange-500/30" },
}
const FACTURE_STATUTS = {
  en_attente: { label: "En attente", color: "#eab308", icon: Clock },
  payee:      { label: "Payée",      color: "#22c55e", icon: CheckCircle },
  en_retard:  { label: "En retard",  color: "#ef4444", icon: AlertTriangle },
}
const SOURCE_LABELS = {
  manuelle: { label: "Manuelle",      color: "#71717a" },
  vente:    { label: "Via Vente",     color: "#eab308" },
  devis:    { label: "Via Devis",     color: "#3b82f6" },
}

/* ══════════════════════════════════════════════
   FORM DEVIS
══════════════════════════════════════════════ */
function DevisForm({ societyId, profile, devis, onClose, onDone }: {
  societyId: string; profile: any; devis?: Devis; onClose: () => void; onDone: () => void
}) {
  const today     = new Date().toISOString().slice(0, 10)
  const inMonth   = new Date(Date.now() + 30*86400000).toISOString().slice(0, 10)

  const [clientNom,     setClientNom]     = useState(devis?.client_nom || "")
  const [clientEmail,   setClientEmail]   = useState(devis?.client_email || "")
  const [clientAdresse, setClientAdresse] = useState(devis?.client_adresse || "")
  const [dateEmission,  setDateEmission]  = useState(devis?.date_emission || today)
  const [dateValidite,  setDateValidite]  = useState(devis?.date_validite || inMonth)
  const [statut,        setStatut]        = useState<Devis["statut"]>(devis?.statut || "brouillon")
  const [notes,         setNotes]         = useState(devis?.notes || "")
  const [items,         setItems]         = useState<DevisItem[]>(devis?.items?.length ? devis.items : [{ nom: "", qty: 1, prix_ht: 0 }])
  const [saving,        setSaving]        = useState(false)

  const totalHT  = items.reduce((s, i) => s + i.qty * i.prix_ht, 0)
  const totalTTC = totalHT // pas de TVA par défaut, modifiable

  const addItem    = () => setItems(prev => [...prev, { nom: "", qty: 1, prix_ht: 0 }])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, j) => j !== i))
  const updateItem = (i: number, field: keyof DevisItem, val: any) =>
    setItems(prev => prev.map((it, j) => j === i ? { ...it, [field]: val } : it))

  // Générer un numéro de devis
  const genNumero = () => {
    const d = new Date()
    return `DEV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(Math.random()*900)+100}`
  }

  const save = async () => {
    if (!clientNom.trim()) return
    setSaving(true)
    const payload = {
      society_id: societyId,
      numero: devis?.numero || genNumero(),
      client_nom: clientNom.trim(),
      client_email: clientEmail || null,
      client_adresse: clientAdresse || null,
      items, total_ht: totalHT, total_ttc: totalTTC,
      statut, notes: notes || null,
      date_emission: dateEmission,
      date_validite: dateValidite,
    }
    if (devis?.id) {
      await supabase.from("devis").update(payload).eq("id", devis.id)
    } else {
      await supabase.from("devis").insert(payload)
    }
    setSaving(false)
    onDone(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-end">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 sticky top-0 bg-[#111111] z-10">
          <h3 className="text-white font-bold text-base">{devis ? "Modifier le devis" : "Nouveau devis"}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Client */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Client</p>
            <input value={clientNom} onChange={e => setClientNom(e.target.value)} placeholder="Nom du client *"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/60"/>
            <div className="grid grid-cols-2 gap-3">
              <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="Email"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
              <input value={clientAdresse} onChange={e => setClientAdresse(e.target.value)} placeholder="Adresse"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
            </div>
          </div>

          {/* Dates + statut */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">Date émission</label>
              <input type="date" value={dateEmission} onChange={e => setDateEmission(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"/>
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">Valide jusqu'au</label>
              <input type="date" value={dateValidite} onChange={e => setDateValidite(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"/>
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">Statut</label>
              <select value={statut} onChange={e => setStatut(e.target.value as any)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                {Object.entries(DEVIS_STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {/* Articles */}
          <div>
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Articles</p>
            <div className="space-y-2">
              {/* Header */}
              <div className="grid gap-2 px-1" style={{gridTemplateColumns:"1fr 70px 90px 80px 32px"}}>
                {["Désignation","Qté","Prix HT","Total",""].map((h,i) => (
                  <p key={i} className="text-[10px] text-zinc-600 font-semibold uppercase">{h}</p>
                ))}
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid gap-2 items-center" style={{gridTemplateColumns:"1fr 70px 90px 80px 32px"}}>
                  <input value={item.nom} onChange={e => updateItem(i, "nom", e.target.value)} placeholder="Description"
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
                  <input type="number" min="1" value={item.qty} onChange={e => updateItem(i, "qty", parseFloat(e.target.value)||1)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none"/>
                  <input type="number" min="0" step="0.01" value={item.prix_ht} onChange={e => updateItem(i, "prix_ht", parseFloat(e.target.value)||0)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none"/>
                  <p className="text-white font-semibold text-sm text-center">{(item.qty * item.prix_ht).toFixed(2)}€</p>
                  <button onClick={() => removeItem(i)} disabled={items.length<=1}
                    className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 disabled:opacity-20">
                    <X size={12}/>
                  </button>
                </div>
              ))}
              <button onClick={addItem}
                className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 font-semibold mt-2">
                <Plus size={12}/> Ajouter une ligne
              </button>
            </div>

            {/* Total */}
            <div className="mt-4 flex justify-end">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 min-w-[200px]">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-500">Total HT</span>
                  <span className="text-white font-bold">{totalHT.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm border-t border-zinc-700 pt-2 mt-2">
                  <span className="text-zinc-400 font-semibold">Total TTC</span>
                  <span className="text-blue-400 text-lg font-black">{totalTTC.toFixed(2)}€</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">Notes / Conditions</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Conditions de paiement, délais, mentions légales..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"/>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-800 flex gap-3 sticky bottom-0 bg-[#111111]">
          <button onClick={save} disabled={saving || !clientNom.trim()}
            className="flex-1 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm">
            {saving ? "Sauvegarde..." : devis ? "Mettre à jour" : "Créer le devis"}
          </button>
          <button onClick={onClose} className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-sm">
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   FORM FACTURE MANUELLE
══════════════════════════════════════════════ */
function FactureForm({ societyId, facture, onClose, onDone }: {
  societyId: string; facture?: Facture; onClose: () => void; onDone: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [clientNom,    setClientNom]    = useState(facture?.client_nom || "")
  const [montant,      setMontant]      = useState(String(facture?.montant || ""))
  const [dateEmission, setDateEmission] = useState(facture?.date_emission || today)
  const [dateEcheance, setDateEcheance] = useState(facture?.date_echeance || "")
  const [statut,       setStatut]       = useState<Facture["statut"]>(facture?.statut || "en_attente")
  const [notes,        setNotes]        = useState(facture?.notes || "")
  const [fichierUrl,   setFichierUrl]   = useState(facture?.fichier_url || "")
  const [fichierNom,   setFichierNom]   = useState(facture?.fichier_nom || "")
  const [uploading,    setUploading]    = useState(false)
  const [saving,       setSaving]       = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const genNumero = () => {
    const d = new Date()
    return `FAC-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(Math.random()*900)+100}`
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext  = file.name.split(".").pop()
    const path = `${societyId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from("factures").upload(path, file, { upsert: true })
    if (!error) {
      const { data: urlData } = supabase.storage.from("factures").getPublicUrl(path)
      setFichierUrl(urlData.publicUrl)
      setFichierNom(file.name)
    }
    setUploading(false)
  }

  const save = async () => {
    if (!clientNom.trim()) return
    setSaving(true)
    const payload = {
      society_id: societyId,
      numero: facture?.numero || genNumero(),
      client_nom: clientNom.trim(),
      montant: parseFloat(montant) || 0,
      statut,
      source: facture?.source || "manuelle",
      date_emission: dateEmission,
      date_echeance: dateEcheance || null,
      date_paiement: statut === "payee" ? (facture?.date_paiement || today) : null,
      notes: notes || null,
      fichier_url: fichierUrl || null,
      fichier_nom: fichierNom || null,
    }
    if (facture?.id) {
      await supabase.from("factures").update(payload).eq("id", facture.id)
    } else {
      await supabase.from("factures").insert(payload)
    }
    setSaving(false)
    onDone(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="text-white font-bold">{facture ? "Modifier la facture" : "Nouvelle facture"}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16}/></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">Client *</label>
            <input value={clientNom} onChange={e => setClientNom(e.target.value)} placeholder="Nom du client"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">Montant (€)</label>
              <input type="number" min="0" step="0.01" value={montant} onChange={e => setMontant(e.target.value)} placeholder="0.00"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">Statut</label>
              <select value={statut} onChange={e => setStatut(e.target.value as any)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                {Object.entries(FACTURE_STATUTS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">Date émission</label>
              <input type="date" value={dateEmission} onChange={e => setDateEmission(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"/>
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">Échéance</label>
              <input type="date" value={dateEcheance} onChange={e => setDateEcheance(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"/>
            </div>
          </div>

          {/* Upload fichier */}
          <div>
            <label className="block text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">Fichier facture (PDF / image)</label>
            <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFile} className="hidden"/>
            {fichierUrl ? (
              <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3">
                <FileText size={14} className="text-blue-400 shrink-0"/>
                <span className="text-white text-sm flex-1 truncate">{fichierNom}</span>
                <button onClick={() => { setFichierUrl(""); setFichierNom("") }}
                  className="text-red-400 hover:text-red-300"><X size={13}/></button>
                <a href={fichierUrl} target="_blank" rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300"><ExternalLink size={13}/></a>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full border-2 border-dashed border-zinc-700 hover:border-blue-500/50 rounded-xl py-4 text-center transition-colors">
                {uploading ? (
                  <p className="text-zinc-500 text-sm">Upload en cours...</p>
                ) : (
                  <>
                    <Upload size={20} className="mx-auto mb-1 text-zinc-600"/>
                    <p className="text-zinc-500 text-sm">Cliquer pour déposer un fichier</p>
                    <p className="text-zinc-700 text-xs mt-0.5">PDF, PNG, JPG</p>
                  </>
                )}
              </button>
            )}
          </div>

          <div>
            <label className="block text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"/>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={save} disabled={saving || !clientNom.trim()}
            className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm">
            {saving ? "Sauvegarde..." : facture ? "Mettre à jour" : "Créer la facture"}
          </button>
          <button onClick={onClose} className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   VIEWER FACTURE (PDF / image)
══════════════════════════════════════════════ */
function FichierViewer({ facture, onClose }: { facture: Facture; onClose: () => void }) {
  const isPdf = facture.fichier_nom?.toLowerCase().endsWith(".pdf")
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-[#111111]">
        <div className="flex items-center gap-3">
          <FileText size={16} className="text-blue-400"/>
          <p className="text-white font-semibold text-sm">{facture.fichier_nom}</p>
          <span className="text-zinc-500 text-xs">— {facture.client_nom}</span>
        </div>
        <div className="flex items-center gap-2">
          <a href={facture.fichier_url!} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg">
            <ExternalLink size={12}/> Ouvrir dans un onglet
          </a>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white">
            <X size={15}/>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {isPdf ? (
          <iframe src={facture.fichier_url!} className="w-full h-full" title={facture.fichier_nom || "Facture"}/>
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
            <img src={facture.fichier_url!} alt={facture.fichier_nom || "Facture"} className="max-w-full max-h-full object-contain rounded-xl"/>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN MODULE
══════════════════════════════════════════════ */
export default function FacturesDevisModule({ activeSociety, profile }: Props) {
  const [tab,          setTab]          = useState<"devis"|"factures">("devis")
  const [devisList,    setDevisList]    = useState<Devis[]>([])
  const [facturesList, setFacturesList] = useState<Facture[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showDevisForm,setShowDevisForm]= useState(false)
  const [editDevis,    setEditDevis]    = useState<Devis|null>(null)
  const [showFacForm,  setShowFacForm]  = useState(false)
  const [editFac,      setEditFac]      = useState<Facture|null>(null)
  const [viewFichier,  setViewFichier]  = useState<Facture|null>(null)
  const [filterDevis,  setFilterDevis]  = useState<string>("tous")
  const [filterFac,    setFilterFac]    = useState<string>("tous")

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const [{ data: d }, { data: f }] = await Promise.all([
      supabase.from("devis").select("*").eq("society_id", activeSociety.id).order("created_at", { ascending: false }),
      supabase.from("factures").select("*").eq("society_id", activeSociety.id).order("created_at", { ascending: false }),
    ])
    setDevisList(d || [])
    setFacturesList(f || [])
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { load() }, [load])

  /* ── Valider un devis → créer une vente + facture ── */
  const validerDevis = async (devis: Devis) => {
    if (!confirm(`Valider le devis "${devis.numero}" et créer une vente + facture ?`)) return

    // 1. Créer la vente
    const { data: vente } = await supabase.from("ventes").insert({
      society_id: activeSociety.id,
      user_id: profile.id,
      client_nom: devis.client_nom,
      total_ht: devis.total_ht,
      port: 0, remise: 0,
      total_ttc: devis.total_ttc,
      notes: `Issu du devis ${devis.numero}`,
    }).select().single()

    if (vente) {
      // 2. Créer les vente_items
      await supabase.from("vente_items").insert(
        devis.items.map(i => ({
          vente_id: vente.id,
          produit_nom: i.nom,
          quantite: i.qty,
          pv_unitaire: i.prix_ht,
          cf_unitaire: 0,
          total: i.qty * i.prix_ht,
        }))
      )

      // 3. Créer la facture liée
      const d = new Date()
      const numero = `FAC-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(Math.random()*900)+100}`
      await supabase.from("factures").insert({
        society_id: activeSociety.id,
        numero,
        client_nom: devis.client_nom,
        montant: devis.total_ttc,
        statut: "en_attente",
        source: "devis",
        vente_id: vente.id,
        devis_id: devis.id,
        date_emission: new Date().toISOString().slice(0, 10),
        notes: `Facture générée depuis le devis ${devis.numero}`,
      })

      // 4. Mettre à jour le devis
      await supabase.from("devis").update({ statut: "accepte", vente_id: vente.id }).eq("id", devis.id)
    }

    load()
  }

  const togglePaiement = async (facture: Facture) => {
    const newStatut = facture.statut === "payee" ? "en_attente" : "payee"
    await supabase.from("factures").update({
      statut: newStatut,
      date_paiement: newStatut === "payee" ? new Date().toISOString().slice(0,10) : null,
    }).eq("id", facture.id)
    load()
  }

  const deleteDevis = async (id: string) => {
    if (!confirm("Supprimer ce devis ?")) return
    await supabase.from("devis").delete().eq("id", id)
    load()
  }

  const deleteFacture = async (id: string) => {
    if (!confirm("Supprimer cette facture ?")) return
    await supabase.from("factures").delete().eq("id", id)
    load()
  }

  // Filtres
  const filteredDevis = devisList.filter(d => filterDevis === "tous" || d.statut === filterDevis)
  const filteredFac   = facturesList.filter(f => filterFac === "tous" || f.statut === filterFac || (filterFac === "source_vente" && f.source === "vente") || (filterFac === "source_devis" && f.source === "devis"))

  // KPIs
  const totalDevisEnCours = devisList.filter(d => d.statut === "brouillon" || d.statut === "envoye").reduce((s, d) => s + d.total_ttc, 0)
  const totalFacturesEnAttente = facturesList.filter(f => f.statut === "en_attente").reduce((s, f) => s + f.montant, 0)
  const totalFacturesPay = facturesList.filter(f => f.statut === "payee").reduce((s, f) => s + f.montant, 0)

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">

      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-900">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-white font-bold text-xl">📄 Factures & Devis</h1>
            <p className="text-zinc-500 text-xs mt-0.5">{devisList.length} devis · {facturesList.length} factures</p>
          </div>
          <button
            onClick={() => { if (tab === "devis") { setEditDevis(null); setShowDevisForm(true) } else { setEditFac(null); setShowFacForm(true) } }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-black text-sm font-bold bg-yellow-500 hover:bg-yellow-400 transition-colors">
            <Plus size={14}/> {tab === "devis" ? "Nouveau devis" : "Nouvelle facture"}
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Devis en cours</p>
            <p className="text-blue-400 font-black text-lg">{totalDevisEnCours.toFixed(2)}€</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Factures en attente</p>
            <p className="text-yellow-400 font-black text-lg">{totalFacturesEnAttente.toFixed(2)}€</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Factures payées</p>
            <p className="text-green-400 font-black text-lg">{totalFacturesPay.toFixed(2)}€</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
          {([["devis","📝 Devis"], ["factures","🧾 Factures"]] as const).map(([val, lbl]) => (
            <button key={val} onClick={() => setTab(val)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab===val ? "bg-yellow-500 text-black" : "text-zinc-500 hover:text-zinc-300"}`}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
          </div>

        ) : tab === "devis" ? (
          <>
            {/* Filtre devis */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {[["tous","Tous"], ...Object.entries(DEVIS_STATUTS).map(([k,v]) => [k, v.label])].map(([id, lbl]) => (
                <button key={id} onClick={() => setFilterDevis(id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${filterDevis===id ? "bg-yellow-500 text-black border-yellow-500" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"}`}>
                  {lbl}
                  {id !== "tous" && <span className="ml-1 opacity-60">({devisList.filter(d => d.statut===id).length})</span>}
                </button>
              ))}
            </div>

            {filteredDevis.length === 0 ? (
              <div className="text-center py-24 text-zinc-600">
                <p className="text-5xl mb-3">📝</p>
                <p className="text-sm">Aucun devis</p>
                <button onClick={() => { setEditDevis(null); setShowDevisForm(true) }}
                  className="mt-3 text-blue-400 text-xs hover:underline">+ Créer un devis</button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDevis.map(d => {
                  const sc = DEVIS_STATUTS[d.statut]
                  return (
                    <div key={d.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-all group">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-zinc-500 text-xs font-mono">{d.numero}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.bg}`} style={{ color: sc.color }}>{sc.label}</span>
                            {d.vente_id && <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">✓ Vente créée</span>}
                          </div>
                          <p className="text-white font-bold">{d.client_nom}</p>
                          <p className="text-zinc-500 text-xs mt-0.5">
                            Émis le {new Date(d.date_emission).toLocaleDateString("fr-FR")}
                            {d.date_validite && ` · Valide jusqu'au ${new Date(d.date_validite).toLocaleDateString("fr-FR")}`}
                          </p>
                          {d.items?.length > 0 && (
                            <p className="text-zinc-600 text-xs mt-0.5 truncate">
                              {d.items.map(i => `${i.nom} ×${i.qty}`).join(" · ")}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-blue-400 text-xl font-black">{d.total_ttc.toFixed(2)}€</p>
                          <p className="text-zinc-600 text-[10px]">TTC</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800 flex-wrap">
                        {/* Valider le devis */}
                        {(d.statut === "brouillon" || d.statut === "envoye") && !d.vente_id && (
                          <button onClick={() => validerDevis(d)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold transition-all">
                            <ShoppingCart size={11}/> Valider → créer vente
                          </button>
                        )}
                        <button onClick={() => { setEditDevis(d); setShowDevisForm(true) }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs">
                          <Pencil size={11}/> Éditer
                        </button>
                        <button onClick={() => deleteDevis(d.id)}
                          className="ml-auto p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>

        ) : (
          <>
            {/* Filtre factures */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {[
                ["tous",          "Toutes"],
                ["en_attente",    "⏳ En attente"],
                ["payee",         "✅ Payées"],
                ["en_retard",     "⚠ En retard"],
                ["source_vente",  "🛒 Via Vente"],
                ["source_devis",  "📝 Via Devis"],
              ].map(([id, lbl]) => (
                <button key={id} onClick={() => setFilterFac(id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${filterFac===id ? "bg-yellow-500 text-black border-yellow-500" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"}`}>
                  {lbl}
                </button>
              ))}
            </div>

            {filteredFac.length === 0 ? (
              <div className="text-center py-24 text-zinc-600">
                <p className="text-5xl mb-3">🧾</p>
                <p className="text-sm">Aucune facture</p>
                <button onClick={() => { setEditFac(null); setShowFacForm(true) }}
                  className="mt-3 text-yellow-400 text-xs hover:underline">+ Créer une facture</button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFac.map(f => {
                  const sc  = FACTURE_STATUTS[f.statut]
                  const src = SOURCE_LABELS[f.source] || SOURCE_LABELS.manuelle
                  const isRetard = f.statut === "en_attente" && f.date_echeance && f.date_echeance < new Date().toISOString().slice(0,10)
                  return (
                    <div key={f.id} className={`bg-zinc-900 border rounded-2xl p-4 hover:border-zinc-700 transition-all group ${f.statut === "payee" ? "border-zinc-800 opacity-80" : isRetard ? "border-red-500/30" : "border-zinc-800"}`}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-zinc-500 text-xs font-mono">{f.numero}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                              style={{ color: sc.color, backgroundColor: sc.color+"15", borderColor: sc.color+"30" }}>
                              {sc.label}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                              style={{ color: src.color, backgroundColor: src.color+"12", borderColor: src.color+"25" }}>
                              {src.label}
                            </span>
                            {isRetard && <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">En retard</span>}
                          </div>
                          <p className="text-white font-bold">{f.client_nom}</p>
                          <p className="text-zinc-500 text-xs mt-0.5">
                            Émise le {new Date(f.date_emission).toLocaleDateString("fr-FR")}
                            {f.date_echeance && ` · Échéance ${new Date(f.date_echeance).toLocaleDateString("fr-FR")}`}
                            {f.date_paiement && ` · Payée le ${new Date(f.date_paiement).toLocaleDateString("fr-FR")}`}
                          </p>
                          {f.notes && <p className="text-zinc-600 text-xs mt-0.5 truncate">{f.notes}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-yellow-400 text-xl font-black">{f.montant.toFixed(2)}€</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800 flex-wrap">
                        {/* Marquer payée / non payée */}
                        <button onClick={() => togglePaiement(f)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            f.statut === "payee"
                              ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                              : "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                          }`}>
                          {f.statut === "payee" ? <><Clock size={11}/> Marquer non payée</> : <><Check size={11}/> Marquer payée</>}
                        </button>

                        {/* Voir le fichier */}
                        {f.fichier_url && (
                          <button onClick={() => setViewFichier(f)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs">
                            <Eye size={11}/> Voir la facture
                          </button>
                        )}

                        <button onClick={() => { setEditFac(f); setShowFacForm(true) }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs">
                          <Pencil size={11}/> Éditer
                        </button>

                        <button onClick={() => deleteFacture(f.id)}
                          className="ml-auto p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showDevisForm && (
        <DevisForm societyId={activeSociety.id} profile={profile}
          devis={editDevis || undefined}
          onClose={() => { setShowDevisForm(false); setEditDevis(null) }} onDone={load}/>
      )}
      {showFacForm && (
        <FactureForm societyId={activeSociety.id}
          facture={editFac || undefined}
          onClose={() => { setShowFacForm(false); setEditFac(null) }} onDone={load}/>
      )}
      {viewFichier && (
        <FichierViewer facture={viewFichier} onClose={() => setViewFichier(null)}/>
      )}
    </div>
  )
}
