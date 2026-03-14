"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  Package, AlertTriangle, Plus, X, Pencil,
  Trash2, Search, TrendingUp, TrendingDown,
  History, Eye, EyeOff, Download, ArrowUpDown,
  ChevronUp, ChevronDown as ChevronDownIcon,
} from "lucide-react"

interface StockItem {
  id: string; product_id: string; produit_nom: string; quantite: number
  seuil_alerte: number; hidden: boolean; updated_at: string
  unite?: string; fournisseur?: string; prix_achat?: number
}
interface StockHistory {
  id: string; produit_nom: string; action: string; quantite: number
  quantite_avant: number; quantite_apres: number; notes?: string; created_at: string
}
interface Product { id: string; name: string; gamme: string }
interface Props { activeSociety: any; profile: any }

const ACTION_COLORS: Record<string, string> = {
  "Entrée":     "text-green-400 bg-green-400/10 border-green-400/20",
  "Sortie":     "text-red-400 bg-red-400/10 border-red-400/20",
  "Correction": "text-blue-400 bg-blue-400/10 border-blue-400/20",
  "Inventaire": "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  "Transfert":  "text-purple-400 bg-purple-400/10 border-purple-400/20",
  "Retour":     "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
}

function MouvementPanel({ item, profile, onClose, onDone }: { item: StockItem; profile: any; onClose: () => void; onDone: () => void }) {
  const [action, setAction] = useState("Entrée")
  const [quantite, setQuantite] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    const qty = parseFloat(quantite)
    if (!qty || isNaN(qty)) return
    setLoading(true)
    let newQty = item.quantite
    if (action === "Entrée" || action === "Retour") newQty = item.quantite + qty
    else if (action === "Sortie" || action === "Transfert") newQty = item.quantite - qty
    else if (action === "Correction" || action === "Inventaire") newQty = qty
    await supabase.from("stock").update({ quantite: newQty, updated_at: new Date().toISOString() }).eq("id", item.id)
    await supabase.from("stock_history").insert({
      society_id: item.product_id, product_id: item.product_id,
      produit_nom: item.produit_nom, user_id: profile.id,
      action, quantite: qty, quantite_avant: item.quantite, quantite_apres: newQty, notes,
    })
    setLoading(false); onDone(); onClose()
  }

  const previewQty = quantite ? (() => {
    const qty = parseFloat(quantite); if (isNaN(qty)) return null
    if (action === "Entrée" || action === "Retour") return item.quantite + qty
    if (action === "Sortie" || action === "Transfert") return item.quantite - qty
    return qty
  })() : null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div><h3 className="text-base font-bold text-white">Mouvement de stock</h3><p className="text-xs text-zinc-500 mt-0.5">{item.produit_nom}</p></div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="flex-1 p-6 space-y-5 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Stock actuel</p>
            <p className={`text-3xl font-bold ${item.quantite < 0 ? "text-red-500" : item.quantite <= item.seuil_alerte && item.seuil_alerte > 0 ? "text-red-400" : "text-yellow-500"}`}>
              {item.quantite}{item.unite ? ` ${item.unite}` : ""}
            </p>
            {item.quantite < 0 && <p className="text-[11px] text-red-400 font-semibold mt-1">⚠ Stock négatif</p>}
            {item.seuil_alerte > 0 && <p className="text-[11px] text-zinc-600 mt-1">Seuil : {item.seuil_alerte}</p>}
            {item.prix_achat && item.quantite > 0 && <p className="text-[11px] text-zinc-500 mt-1">Valeur : {(item.quantite * item.prix_achat).toFixed(2)}€</p>}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {["Entrée","Sortie","Correction","Inventaire","Transfert","Retour"].map(a => (
                <button key={a} onClick={() => setAction(a)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${action===a ? "bg-yellow-500 text-black border-yellow-500" : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500"}`}>
                  {a==="Entrée"?"📥 ":a==="Sortie"?"📤 ":a==="Correction"?"✏️ ":a==="Inventaire"?"📋 ":a==="Transfert"?"↔️ ":"↩️ "}{a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              {action==="Correction"||action==="Inventaire" ? "Nouvelle quantité" : "Quantité"}
            </label>
            <input type="number" min="0" step="0.001" placeholder="0" value={quantite} onChange={e => setQuantite(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-lg font-bold text-center focus:outline-none focus:border-yellow-500/60" />
            {previewQty !== null && (
              <p className={`text-xs mt-1 text-center font-semibold ${previewQty<0?"text-red-500":action==="Entrée"||action==="Retour"?"text-green-400":action==="Sortie"||action==="Transfert"?"text-red-400":"text-blue-400"}`}>
                → {previewQty}{item.unite?` ${item.unite}`:""}{previewQty<0?" (négatif — autorisé)":""}
              </p>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Notes</label>
            <input type="text" placeholder="Raison..." value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
          </div>
        </div>
        <div className="p-6 border-t border-zinc-800 space-y-3">
          <button onClick={handleSave} disabled={loading||!quantite} className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm">
            {loading ? "Enregistrement..." : "Valider"}
          </button>
          <button onClick={onClose} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

function EditStockPanel({ item, onClose, onDone }: { item: StockItem; onClose: () => void; onDone: () => void }) {
  const [nom, setNom] = useState(item.produit_nom)
  const [seuil, setSeuil] = useState(String(item.seuil_alerte||""))
  const [unite, setUnite] = useState(item.unite||"")
  const [fournisseur, setFournisseur] = useState(item.fournisseur||"")
  const [prixAchat, setPrixAchat] = useState(String(item.prix_achat||""))
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setLoading(true)
    await supabase.from("stock").update({ produit_nom: nom, seuil_alerte: parseFloat(seuil)||0, unite, fournisseur, prix_achat: parseFloat(prixAchat)||null }).eq("id", item.id)
    setLoading(false); onDone(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div><h3 className="text-base font-bold text-white">Modifier</h3><p className="text-xs text-zinc-500 mt-0.5">{item.produit_nom}</p></div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          {([
            { label: "Nom", value: nom, set: setNom, type: "text", placeholder: "" },
            { label: "Seuil d'alerte", value: seuil, set: setSeuil, type: "number", placeholder: "0" },
            { label: "Prix d'achat (€)", value: prixAchat, set: setPrixAchat, type: "number", placeholder: "0.00" },
            { label: "Fournisseur", value: fournisseur, set: setFournisseur, type: "text", placeholder: "Nom..." },
          ] as {label:string;value:string;set:(v:string)=>void;type:string;placeholder:string}[]).map(({ label, value, set, type, placeholder }) => (
            <div key={label}>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
              <input type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Unité</label>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {["pcs","kg","g","L","mL","boîte","sachet"].map(u => (
                <button key={u} onClick={() => setUnite(u)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${unite===u?"bg-yellow-500 text-black border-yellow-500":"bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500"}`}>{u}</button>
              ))}
            </div>
            <input type="text" placeholder="Autre..." value={unite} onChange={e => setUnite(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none" />
          </div>
        </div>
        <div className="p-6 border-t border-zinc-800 space-y-3">
          <button onClick={save} disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm">
            {loading ? "..." : "Sauvegarder"}
          </button>
          <button onClick={onClose} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

function HistoryPanel({ societyId, onClose }: { societyId: string; onClose: () => void }) {
  const [history, setHistory] = useState<StockHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    supabase.from("stock_history").select("*").order("created_at", { ascending: false }).limit(300)
      .then(({ data }) => { setHistory(data||[]); setLoading(false) })
  }, [])

  const deleteLine = async (id: string) => {
    if (!confirm("Supprimer cette ligne ?")) return
    await supabase.from("stock_history").delete().eq("id", id)
    setHistory(prev => prev.filter(h => h.id !== id))
  }

  const clearFiltered = async () => {
    if (!confirm(`Supprimer les ${filtered.length} lignes affichées ? Irréversible.`)) return
    const ids = filtered.map(h => h.id)
    for (const id of ids) await supabase.from("stock_history").delete().eq("id", id)
    setHistory(prev => prev.filter(h => !ids.includes(h.id)))
  }

  const exportCSV = () => {
    const rows = [["Date","Produit","Action","Qté","Avant","Après","Notes"]]
    filtered.forEach(h => rows.push([new Date(h.created_at).toLocaleString("fr-FR"), h.produit_nom, h.action, String(h.quantite), String(h.quantite_avant), String(h.quantite_apres), h.notes||""]))
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8,"+encodeURIComponent(rows.map(r=>r.join(";")).join("\n")); a.download = "historique_stock.csv"; a.click()
  }

  const filtered = history.filter(h => (!filterAction||h.action===filterAction) && (!search||h.produit_nom.toLowerCase().includes(search.toLowerCase())))

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-lg h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div><h3 className="text-base font-bold text-white">Historique</h3><p className="text-xs text-zinc-500 mt-0.5">{filtered.length} entrée{filtered.length>1?"s":""}</p></div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg hover:bg-zinc-700"><Download size={12}/> CSV</button>
            <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
          </div>
        </div>
        <div className="p-3 border-b border-zinc-900 flex gap-2">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filtrer..." className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none"/>
          </div>
          <select value={filterAction} onChange={e=>setFilterAction(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
            <option value="">Tous</option>
            {Object.keys(ACTION_COLORS).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={clearFiltered} className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 whitespace-nowrap">🗑 Vider</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/></div>
          : filtered.length===0 ? <div className="text-center py-12 text-zinc-600"><History size={32} className="mx-auto mb-3 opacity-20"/><p className="text-sm">Aucun mouvement</p></div>
          : filtered.map(h => (
            <div key={h.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 group">
              <div className="flex items-start justify-between mb-2">
                <p className="text-white text-sm font-semibold">{h.produit_nom}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ACTION_COLORS[h.action]||"text-zinc-400 bg-zinc-800 border-zinc-700"}`}>{h.action}</span>
                  <button onClick={() => deleteLine(h.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10"><Trash2 size={13}/></button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span>{h.quantite_avant} → <span className={`font-semibold ${h.quantite_apres<0?"text-red-400":"text-white"}`}>{h.quantite_apres}</span>{h.quantite_apres<0?" ⚠":""}</span>
                {h.notes && <span className="italic truncate">"{h.notes}"</span>}
              </div>
              <p className="text-[11px] text-zinc-700 mt-1">{new Date(h.created_at).toLocaleString("fr-FR")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AddStockPanel({ societyId, onClose, onDone }: { societyId: string; onClose: () => void; onDone: () => void }) {
  const [products, setProducts] = useState<Product[]>([])
  const [selected, setSelected] = useState("")
  const [customName, setCustomName] = useState("")
  const [quantite, setQuantite] = useState("0")
  const [seuil, setSeuil] = useState("0")
  const [unite, setUnite] = useState("")
  const [fournisseur, setFournisseur] = useState("")
  const [prixAchat, setPrixAchat] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => { supabase.from("products").select("*").eq("society_id", societyId).then(({data}) => setProducts(data||[])) }, [societyId])

  const handleSave = async () => {
    const nom = selected==="__custom" ? customName : products.find(p=>p.id===selected)?.name||customName
    if (!nom.trim()) return
    setLoading(true)
    await supabase.from("stock").insert({ society_id: societyId, product_id: selected!=="__custom"?selected:null, produit_nom: nom, quantite: parseFloat(quantite)||0, seuil_alerte: parseFloat(seuil)||0, unite, fournisseur, prix_achat: parseFloat(prixAchat)||null })
    setLoading(false); onDone(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div><h3 className="text-base font-bold text-white">Ajouter au stock</h3></div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Produit</label>
            <select value={selected} onChange={e=>setSelected(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60">
              <option value="">-- Sélectionner --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              <option value="__custom">+ Nom personnalisé</option>
            </select>
          </div>
          {(selected==="__custom"||!selected) && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Nom</label>
              <input type="text" placeholder="Nom..." value={customName} onChange={e=>setCustomName(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60"/>
            </div>
          )}
          {([
            {label:"Quantité initiale",value:quantite,set:setQuantite,step:"0.001"},
            {label:"Seuil d'alerte",value:seuil,set:setSeuil,step:"0.001"},
            {label:"Prix d'achat (€)",value:prixAchat,set:setPrixAchat,step:"0.01"},
          ] as {label:string;value:string;set:(v:string)=>void;step:string}[]).map(({label,value,set,step}) => (
            <div key={label}>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
              <input type="number" step={step} value={value} onChange={e=>set(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60"/>
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Unité</label>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {["pcs","kg","g","L","mL","boîte","sachet"].map(u => (
                <button key={u} onClick={()=>setUnite(u)} className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${unite===u?"bg-yellow-500 text-black border-yellow-500":"bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500"}`}>{u}</button>
              ))}
            </div>
            <input type="text" placeholder="Autre..." value={unite} onChange={e=>setUnite(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Fournisseur</label>
            <input type="text" placeholder="Nom du fournisseur..." value={fournisseur} onChange={e=>setFournisseur(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
          </div>
        </div>
        <div className="p-6 border-t border-zinc-800 space-y-3">
          <button onClick={handleSave} disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
            <Plus size={16}/> Ajouter
          </button>
          <button onClick={onClose} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

export default function StocksModule({ activeSociety, profile }: Props) {
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [movementItem, setMovementItem] = useState<StockItem|null>(null)
  const [editItem, setEditItem] = useState<StockItem|null>(null)
  const [filterAlert, setFilterAlert] = useState(false)
  const [filterFournisseur, setFilterFournisseur] = useState("")
  const [sortField, setSortField] = useState<"produit_nom"|"quantite"|"seuil_alerte">("produit_nom")
  const [sortDir, setSortDir] = useState<"asc"|"desc">("asc")
  const [viewMode, setViewMode] = useState<"table"|"cards">("table")
  const [showManageVis, setShowManageVis] = useState(false)

  const VIS_KEY = `stock_hidden_${activeSociety?.id}_${profile?.id}`
  const [hiddenByMe, setHiddenByMe] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(`stock_hidden_init`) || "[]") } catch { return [] }
  })

  // Charger depuis localStorage côté client
  useEffect(() => {
    try { setHiddenByMe(JSON.parse(localStorage.getItem(VIS_KEY) || "[]")) } catch {}
  }, [VIS_KEY])

  useEffect(() => { if (activeSociety) loadStock() }, [activeSociety])

  const loadStock = async () => {
    setLoading(true)
    const { data } = await supabase.from("stock").select("*").eq("society_id", activeSociety.id).order("produit_nom")
    setStock(data || [])
    setLoading(false)
  }

  const toggleMyHide = (id: string) => {
    const next = hiddenByMe.includes(id) ? hiddenByMe.filter(x=>x!==id) : [...hiddenByMe, id]
    setHiddenByMe(next)
    try { localStorage.setItem(VIS_KEY, JSON.stringify(next)) } catch {}
  }

  const deleteStock = async (id: string) => {
    if (!confirm("Supprimer ce produit du stock ?")) return
    await supabase.from("stock").delete().eq("id", id)
    loadStock()
  }

  const exportCSV = () => {
    const rows = [["Produit","Quantité","Unité","Seuil","Fournisseur","Prix achat","MAJ"]]
    filteredSorted.forEach(i => rows.push([i.produit_nom,String(i.quantite),i.unite||"",String(i.seuil_alerte),i.fournisseur||"",String(i.prix_achat||""),new Date(i.updated_at).toLocaleDateString("fr-FR")]))
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8,"+encodeURIComponent(rows.map(r=>r.join(";")).join("\n")); a.download = "stock.csv"; a.click()
  }

  const toggleSort = (field: typeof sortField) => {
    if (sortField===field) setSortDir(d=>d==="asc"?"desc":"asc")
    else { setSortField(field); setSortDir("asc") }
  }

  const fournisseurs = [...new Set(stock.map(i=>i.fournisseur).filter(Boolean))] as string[]
  const visibleStock = stock.filter(i => !hiddenByMe.includes(i.id))

  // Sépare stock société (is_labo=false/null) et stock labo fournisseurs (is_labo=true)
  const stockSociete  = visibleStock.filter(i => !(i as any).is_labo)
  const stockLabo     = visibleStock.filter(i => (i as any).is_labo === true)

  const applyFilters = (list: StockItem[]) => list
    .filter(item => {
      if (filterAlert && !(item.seuil_alerte>0 && item.quantite<=item.seuil_alerte)) return false
      if (filterFournisseur && item.fournisseur!==filterFournisseur) return false
      return item.produit_nom.toLowerCase().includes(search.toLowerCase())
    })
    .sort((a,b) => {
      const v = sortField==="produit_nom" ? a.produit_nom.localeCompare(b.produit_nom) : (a[sortField] as number)-(b[sortField] as number)
      return sortDir==="asc"?v:-v
    })

  const filteredSorted     = applyFilters(stockSociete)
  const filteredSortedLabo = applyFilters(stockLabo)

  const alertCount   = visibleStock.filter(i=>i.seuil_alerte>0&&i.quantite<=i.seuil_alerte&&i.quantite>=0).length
  const stockVide    = visibleStock.filter(i=>i.quantite<=0).length
  const stockNegatif = visibleStock.filter(i=>i.quantite<0).length
  const valeurTotale = stockSociete.reduce((s,i)=>s+((i.quantite>0&&i.prix_achat)?i.quantite*i.prix_achat:0),0)

  const SortIcon = ({ field }: { field: string }) =>
    sortField!==field ? <ArrowUpDown size={10} className="text-zinc-600 ml-1"/>
    : sortDir==="asc" ? <ChevronUp size={10} className="text-yellow-500 ml-1"/> : <ChevronDownIcon size={10} className="text-yellow-500 ml-1"/>

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="p-6 max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Stock</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {visibleStock.length} produit{visibleStock.length>1?"s":""} visibles
              {hiddenByMe.length>0 && <span className="text-zinc-700"> · {hiddenByMe.length} masqué{hiddenByMe.length>1?"s":""}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={()=>setShowManageVis(!showManageVis)}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-colors ${showManageVis?"bg-zinc-700 text-white border-zinc-600":"bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"}`}>
              <Eye size={13}/> Gérer affichage
            </button>
            <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl hover:bg-zinc-800">
              <Download size={13}/> Export
            </button>
            <button onClick={()=>setShowHistory(true)} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold px-4 py-2.5 rounded-xl text-sm border border-zinc-700">
              <History size={15}/> Historique
            </button>
            <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-yellow-500/20">
              <Plus size={16}/> Ajouter
            </button>
          </div>
        </div>

        {showManageVis && (
          <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-bold text-sm">👁 Gérer mon affichage</p>
              <p className="text-zinc-600 text-xs">Visible uniquement par toi — indépendant de l'admin</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {stock.map(item => (
                <button key={item.id} onClick={()=>toggleMyHide(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${hiddenByMe.includes(item.id)?"bg-zinc-800 text-zinc-600 border-zinc-700 opacity-50":"bg-zinc-800 text-zinc-200 border-zinc-700 hover:border-yellow-500/50"}`}>
                  {hiddenByMe.includes(item.id) ? <EyeOff size={11}/> : <Eye size={11}/>}
                  {item.produit_nom}
                </button>
              ))}
            </div>
            {hiddenByMe.length>0 && (
              <button onClick={()=>{setHiddenByMe([]);try{localStorage.setItem(VIS_KEY,"[]")}catch{}}} className="mt-3 text-xs text-yellow-500 hover:text-yellow-400">
                ↺ Tout réafficher ({hiddenByMe.length})
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Produits", value: visibleStock.length, icon: Package, c: "yellow", sub: "" },
            { label: "En alerte", value: alertCount, icon: AlertTriangle, c: alertCount>0?"red":"zinc", sub: "" },
            { label: "Stock ≤ 0", value: stockVide, icon: TrendingDown, c: stockVide>0?"orange":"zinc", sub: stockNegatif>0?`${stockNegatif} négatif${stockNegatif>1?"s":""}`:""  },
            { label: "Valeur stock", value: valeurTotale>0?valeurTotale.toFixed(0)+"€":"—", icon: TrendingUp, c: "blue", sub: "" },
          ].map(({ label, value, icon: Icon, c, sub }) => (
            <div key={label} className={`bg-zinc-900 border rounded-2xl p-4 ${c==="red"&&alertCount>0?"border-red-500/20":c==="orange"&&stockVide>0?"border-orange-500/20":"border-zinc-800"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-${c}-500/10`}>
                  <Icon size={16} className={`text-${c}-${c==="zinc"?"500":"400"}`}/>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">{label}</p>
                  <p className={`text-xl font-bold text-${c}-${c==="zinc"?"500":"400"}`}>{value}</p>
                  {sub && <p className="text-[10px] text-red-400">{sub}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input type="text" placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50"/>
          </div>
          <button onClick={()=>setFilterAlert(!filterAlert)}
            className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-lg border transition-colors ${filterAlert?"bg-red-500/20 text-red-400 border-red-500/40":"bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"}`}>
            <AlertTriangle size={12}/> Alertes
          </button>
          {fournisseurs.length>0 && (
            <select value={filterFournisseur} onChange={e=>setFilterFournisseur(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
              <option value="">Tous fournisseurs</option>
              {fournisseurs.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          )}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {(["table","cards"] as const).map(m => (
              <button key={m} onClick={()=>setViewMode(m)} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${viewMode===m?"bg-zinc-700 text-white":"text-zinc-500 hover:text-zinc-300"}`}>
                {m==="table"?"≡ Tableau":"⊞ Cartes"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : viewMode==="table" ? (
          <div className="space-y-8">

            {/* ══ TABLEAU 1 : MON STOCK ══ */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-white font-bold text-base">📦 Mon stock</h2>
                <span className="text-xs text-zinc-500 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full">
                  {filteredSorted.length} produit{filteredSorted.length>1?"s":""}
                </span>
              </div>
              {filteredSorted.length===0 ? (
                <div className="text-center py-10 text-zinc-600 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <Package size={32} className="mx-auto mb-3 opacity-20"/>
                  <p className="text-sm">Aucun produit{search?" trouvé":""}</p>
                  {!search && <button onClick={()=>setShowAdd(true)} className="mt-3 text-yellow-500 text-xs hover:underline">+ Ajouter</button>}
                </div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        {([{l:"Produit",f:"produit_nom"},{l:"Quantité",f:"quantite"},{l:"Unité",f:null},{l:"Fournisseur",f:null},{l:"Seuil",f:"seuil_alerte"},{l:"Statut",f:null},{l:"Actions",f:null}] as {l:string;f:string|null}[]).map(({l,f})=>(
                          <th key={l} onClick={()=>f&&toggleSort(f as typeof sortField)}
                            className={`px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider ${f?"cursor-pointer hover:text-zinc-300 select-none":""} ${l==="Actions"?"text-right":"text-left"}`}>
                            <span className="inline-flex items-center">{l}{f&&<SortIcon field={f}/>}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {filteredSorted.map(item => {
                        const neg=item.quantite<0, empty=item.quantite===0, alert=!neg&&item.seuil_alerte>0&&item.quantite<=item.seuil_alerte
                        return (
                          <tr key={item.id} className="hover:bg-zinc-800/40 transition-colors group">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${neg?"bg-red-500/20":alert?"bg-orange-500/20":"bg-yellow-500/20"}`}>
                                  <Package size={13} className={neg?"text-red-500":alert?"text-orange-400":"text-yellow-500"}/>
                                </div>
                                <span className="text-white text-sm font-medium">{item.produit_nom}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-lg font-bold ${neg?"text-red-500":empty?"text-zinc-600":alert?"text-orange-400":"text-white"}`}>{item.quantite}</span>
                            </td>
                            <td className="px-4 py-3 text-center"><span className="text-zinc-500 text-xs">{item.unite||"—"}</span></td>
                            <td className="px-4 py-3"><span className="text-zinc-400 text-xs">{item.fournisseur||"—"}</span></td>
                            <td className="px-4 py-3 text-center"><span className="text-zinc-500 text-sm">{item.seuil_alerte||"—"}</span></td>
                            <td className="px-4 py-3 text-center">
                              {neg ? <span className="text-[11px] font-semibold text-red-500 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/30 animate-pulse">⚠ Négatif</span>
                              : empty ? <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full border border-zinc-700">Vide</span>
                              : alert ? <span className="text-[11px] font-semibold text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full border border-orange-400/20 animate-pulse">⚠ Alerte</span>
                              : <span className="text-[11px] font-semibold text-green-400 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20">OK</span>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={()=>setMovementItem(item)} className="flex items-center gap-1 text-[11px] font-semibold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-1.5 rounded-lg hover:bg-yellow-400/20">
                                  <TrendingUp size={11}/> Mvt
                                </button>
                                <button onClick={()=>setEditItem(item)} className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800"><Pencil size={13}/></button>
                                <button onClick={()=>toggleMyHide(item.id)} className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800"><EyeOff size={13}/></button>
                                <button onClick={()=>deleteStock(item.id)} className="text-red-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={13}/></button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ══ TABLEAU 2 : STOCK LABO LUDIVINE ══ */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-white font-bold text-base">🔬 Stock Labo — Ludivine</h2>
                <span className="text-xs text-zinc-500 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full">
                  {filteredSortedLabo.length} produit{filteredSortedLabo.length>1?"s":""}
                </span>
                <span className="text-[10px] text-purple-400 bg-purple-400/10 border border-purple-400/20 px-2 py-0.5 rounded-full">Pots vides</span>
              </div>
              {filteredSortedLabo.length===0 ? (
                <div className="text-center py-8 text-zinc-700 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl">
                  <p className="text-sm">Aucun stock labo — exécute la migration SQL</p>
                </div>
              ) : (
                <div className="bg-zinc-900/60 border border-purple-500/10 rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        {([{l:"Produit (pots vides)",f:"produit_nom"},{l:"Quantité",f:"quantite"},{l:"Unité",f:null},{l:"Seuil",f:"seuil_alerte"},{l:"Statut",f:null},{l:"Actions",f:null}] as {l:string;f:string|null}[]).map(({l,f})=>(
                          <th key={l} onClick={()=>f&&toggleSort(f as typeof sortField)}
                            className={`px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider ${f?"cursor-pointer hover:text-zinc-300 select-none":""} ${l==="Actions"?"text-right":"text-left"}`}>
                            <span className="inline-flex items-center">{l}{f&&<SortIcon field={f}/>}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {filteredSortedLabo.map(item => {
                        const neg=item.quantite<0, empty=item.quantite===0, alert=!neg&&item.seuil_alerte>0&&item.quantite<=item.seuil_alerte
                        return (
                          <tr key={item.id} className="hover:bg-zinc-800/40 transition-colors group">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                  <Package size={13} className="text-purple-400"/>
                                </div>
                                <span className="text-white text-sm font-medium">{item.produit_nom}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-lg font-bold ${neg?"text-red-500":empty?"text-zinc-600":alert?"text-orange-400":"text-purple-300"}`}>{item.quantite}</span>
                            </td>
                            <td className="px-4 py-3 text-center"><span className="text-zinc-500 text-xs">{item.unite||"—"}</span></td>
                            <td className="px-4 py-3 text-center"><span className="text-zinc-500 text-sm">{item.seuil_alerte||"—"}</span></td>
                            <td className="px-4 py-3 text-center">
                              {neg ? <span className="text-[11px] font-semibold text-red-500 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/30 animate-pulse">⚠ Négatif</span>
                              : empty ? <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full border border-zinc-700">Vide</span>
                              : alert ? <span className="text-[11px] font-semibold text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full border border-orange-400/20 animate-pulse">⚠ Alerte</span>
                              : <span className="text-[11px] font-semibold text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full border border-purple-400/20">OK</span>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={()=>setMovementItem(item)} className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 bg-purple-400/10 border border-purple-400/20 px-2 py-1.5 rounded-lg hover:bg-purple-400/20">
                                  <TrendingUp size={11}/> Mvt
                                </button>
                                <button onClick={()=>setEditItem(item)} className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800"><Pencil size={13}/></button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="space-y-8">
            {/* ══ CARTES 1 : MON STOCK ══ */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-white font-bold text-base">📦 Mon stock</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSorted.map(item => {
                  const neg=item.quantite<0, alert=!neg&&item.seuil_alerte>0&&item.quantite<=item.seuil_alerte
                  return (
                    <div key={item.id} className={`bg-zinc-900 border rounded-2xl p-4 group relative ${neg?"border-red-500/30":alert?"border-orange-500/30":"border-zinc-800"}`}>
                      <button onClick={()=>toggleMyHide(item.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-zinc-400 p-1 rounded hover:bg-zinc-800"><EyeOff size={12}/></button>
                      <p className="text-white font-bold text-sm mb-1 truncate pr-6">{item.produit_nom}</p>
                      {item.fournisseur && <p className="text-zinc-600 text-[10px] mb-1">{item.fournisseur}</p>}
                      <p className={`text-3xl font-black mb-0.5 ${neg?"text-red-500":item.quantite===0?"text-zinc-600":alert?"text-orange-400":"text-yellow-500"}`}>{item.quantite}</p>
                      <p className="text-zinc-600 text-xs mb-1">{item.unite||"unités"}</p>
                      {item.seuil_alerte>0 && <p className="text-zinc-700 text-[10px]">Seuil: {item.seuil_alerte}</p>}
                      {item.prix_achat&&item.quantite>0 && <p className="text-zinc-600 text-[10px]">{(item.quantite*item.prix_achat).toFixed(2)}€</p>}
                      <div className="flex gap-1.5 mt-3">
                        <button onClick={()=>setMovementItem(item)} className="flex-1 text-[11px] font-semibold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 py-1.5 rounded-lg hover:bg-yellow-400/20">Mouvement</button>
                        <button onClick={()=>setEditItem(item)} className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 rounded-lg"><Pencil size={12}/></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            {/* ══ CARTES 2 : STOCK LABO ══ */}
            {filteredSortedLabo.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-white font-bold text-base">🔬 Stock Labo — Ludivine</h2>
                  <span className="text-[10px] text-purple-400 bg-purple-400/10 border border-purple-400/20 px-2 py-0.5 rounded-full">Pots vides</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredSortedLabo.map(item => {
                    const neg=item.quantite<0, alert=!neg&&item.seuil_alerte>0&&item.quantite<=item.seuil_alerte
                    return (
                      <div key={item.id} className={`bg-zinc-900/60 border rounded-2xl p-4 ${neg?"border-red-500/30":alert?"border-orange-500/30":"border-purple-500/10"}`}>
                        <p className="text-white font-bold text-sm mb-1 truncate">{item.produit_nom}</p>
                        <p className={`text-3xl font-black mb-0.5 ${neg?"text-red-500":item.quantite===0?"text-zinc-600":alert?"text-orange-400":"text-purple-300"}`}>{item.quantite}</p>
                        <p className="text-zinc-600 text-xs mb-1">{item.unite||"unités"}</p>
                        <div className="flex gap-1.5 mt-3">
                          <button onClick={()=>setMovementItem(item)} className="flex-1 text-[11px] font-semibold text-purple-400 bg-purple-400/10 border border-purple-400/20 py-1.5 rounded-lg hover:bg-purple-400/20">Mvt</button>
                          <button onClick={()=>setEditItem(item)} className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 rounded-lg"><Pencil size={12}/></button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      {showAdd && <AddStockPanel societyId={activeSociety.id} onClose={()=>setShowAdd(false)} onDone={loadStock}/>}
      {showHistory && <HistoryPanel societyId={activeSociety.id} onClose={()=>setShowHistory(false)}/>}
      {movementItem && <MouvementPanel item={movementItem} profile={profile} onClose={()=>setMovementItem(null)} onDone={loadStock}/>}
      {editItem && <EditStockPanel item={editItem} onClose={()=>setEditItem(null)} onDone={loadStock}/>}
    </div>
  )
}