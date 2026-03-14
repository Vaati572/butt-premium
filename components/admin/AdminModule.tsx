"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import {
  Plus, X, Pencil, Trash2, Search, Package,
  Tag, Save, Link, Check, Camera,
  ChevronRight, Building2, Users,
} from "lucide-react"

interface Product {
  id: string; name: string; gamme: string; pv: number; cf: number
  in_stock: boolean; composition: Record<string, number>; avatar_url?: string
}
interface Props { activeSociety: any; profile: any }

// ✅ Shopify + Convention ajoutés
const GAMMES = ["Particuliers", "Professionnels", "Shopify", "Convention"]

const GAMMES_CONFIG: Record<string, { label: string; color: string }> = {
  "Particuliers":   { label: "👤 Particuliers",   color: "#eab308" },
  "Professionnels": { label: "🏢 Professionnels", color: "#a855f7" },
  "Shopify":        { label: "🛍️ Shopify",         color: "#22c55e" },
  "Convention":     { label: "🎪 Convention",      color: "#f97316" },
}

const emptyProduct = {
  name: "", gamme: "Particuliers", pv: "", cf: "", in_stock: true,
  composition: {} as Record<string, number>,
}

/* ── PANEL PRODUIT ─────────────────────────── */
function ProductPanel({ product, allProducts, onSave, onClose }: {
  product: any; allProducts: Product[]; onSave: (p: any) => void; onClose: () => void
}) {
  const [form, setForm]         = useState({ ...product })
  const [uploading, setUploading] = useState(false)
  const fileInputRef            = useRef<HTMLInputElement>(null)
  const isEdit                  = !!product.id
  const stockProducts           = allProducts.filter(p => p.id !== product.id)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setUploading(true)
    try {
      const ext  = file.name.split(".").pop()
      const path = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true })
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path)
        setForm((p: any) => ({ ...p, avatar_url: publicUrl }))
      }
    } catch {}
    setUploading(false)
  }

  const addComposition = (sp: Product) =>
    setForm((prev: any) => ({ ...prev, composition: { ...prev.composition, [sp.name]: 1 }, in_stock: false }))

  const updateCompQty = (name: string, qty: number) => {
    if (qty <= 0) { const c = { ...form.composition }; delete c[name]; setForm((p: any) => ({ ...p, composition: c })) }
    else setForm((p: any) => ({ ...p, composition: { ...p.composition, [name]: qty } }))
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">{isEdit ? "Modifier le produit" : "Nouveau produit"}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{isEdit ? form.name : "Ajouter au catalogue"}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Image */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Image du produit</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-zinc-700 shrink-0 bg-zinc-800 flex items-center justify-center">
                {form.avatar_url ? <img src={form.avatar_url} alt={form.name} className="w-full h-full object-cover" /> : <Package size={24} className="text-zinc-600" />}
              </div>
              <div className="flex-1 space-y-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-800 border border-zinc-700 hover:border-yellow-500/50 text-zinc-300 text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-40">
                  {uploading ? <><div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />Upload...</> : <><Camera size={14} />{form.avatar_url ? "Changer l'image" : "Ajouter une image"}</>}
                </button>
                {form.avatar_url && <button onClick={() => setForm((p: any) => ({ ...p, avatar_url: null }))} className="w-full text-red-400 text-xs hover:underline">Supprimer l'image</button>}
              </div>
            </div>
          </div>
          {/* Nom */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Nom du produit</label>
            <input type="text" placeholder="Ex: Baume 250ml" value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
          </div>
          {/* Gamme — 4 options */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Gamme</label>
            <div className="grid grid-cols-2 gap-2">
              {GAMMES.map(g => {
                const gcfg = GAMMES_CONFIG[g]; const active = form.gamme === g
                return (
                  <button key={g} onClick={() => setForm((p: any) => ({ ...p, gamme: g }))}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${active ? "text-black border-transparent" : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500"}`}
                    style={active ? { backgroundColor: gcfg.color } : {}}>
                    {gcfg.label}
                  </button>
                )
              })}
            </div>
          </div>
          {/* Prix */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Prix de vente (€)</label>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={form.pv} onChange={e => setForm((p: any) => ({ ...p, pv: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Coût fabr. (€)</label>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={form.cf} onChange={e => setForm((p: any) => ({ ...p, cf: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" />
            </div>
          </div>
          {/* Stock */}
          <div className="flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3">
            <button onClick={() => setForm((p: any) => ({ ...p, in_stock: !p.in_stock }))}
              className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${form.in_stock ? "bg-yellow-500 border-yellow-500" : "bg-transparent border-zinc-600"}`}>
              {form.in_stock && <Check size={12} className="text-black" />}
            </button>
            <div>
              <p className="text-white text-sm font-medium">Afficher dans le stock</p>
              <p className="text-zinc-500 text-[11px]">{Object.keys(form.composition||{}).length>0 ? "Décoché recommandé — ce produit utilise le stock d'autres produits" : "Décocher pour les packs/promos qui utilisent un autre stock"}</p>
            </div>
          </div>
          {/* Composition */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5"><Link size={11} /> Composition / Lien stock</span>
            </label>
            <p className="text-[11px] text-zinc-600 mb-3">Quels produits sont consommés à la vente. Ex: "KS Baume" consomme 1× "Baume 50ml".</p>
            {Object.entries(form.composition).length > 0 && (
              <div className="space-y-2 mb-3">
                {Object.entries(form.composition).map(([name, qty]: [string, any]) => (
                  <div key={name} className="flex items-center gap-2 bg-zinc-800 border border-yellow-500/30 rounded-lg px-3 py-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
                    <span className="text-white text-sm flex-1 truncate">{name}</span>
                    <span className="text-zinc-500 text-xs">×</span>
                    <input type="number" min="0.001" step="0.001" value={qty} onChange={e => updateCompQty(name, parseFloat(e.target.value)||0)}
                      className="w-16 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none" />
                    <button onClick={() => updateCompQty(name, 0)} className="text-zinc-600 hover:text-red-400 transition-colors"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
            {stockProducts.filter(p => !Object.keys(form.composition).includes(p.name)).length > 0 && (
              <div>
                <p className="text-[11px] text-zinc-600 mb-2">Ajouter un produit lié :</p>
                <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                  {stockProducts.filter(p => !Object.keys(form.composition).includes(p.name)).map(p => (
                    <button key={p.id} onClick={() => addComposition(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-zinc-700 transition-colors border-b border-zinc-700 last:border-0 flex items-center justify-between group">
                      <div><span className="text-white text-sm">{p.name}</span><span className="text-zinc-500 text-[11px] ml-2">{p.gamme}</span></div>
                      <span className="text-yellow-500 text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">+ Lier</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {Object.entries(form.composition).length===0 && stockProducts.length===0 && <p className="text-[11px] text-zinc-700 italic">Aucun autre produit disponible.</p>}
          </div>
        </div>
        <div className="p-6 border-t border-zinc-800 space-y-3">
          <button onClick={() => onSave(form)} disabled={!form.name.trim()||!form.pv}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
            <Save size={15} />{isEdit ? "Sauvegarder" : "Ajouter le produit"}
          </button>
          <button onClick={onClose} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ── TARIFS CLIENTS ─────────────────────────── */
function TarifsClientsSection({ societyId }: { societyId: string }) {
  const [clients, setClients]     = useState<any[]>([])
  const [products, setProducts]   = useState<any[]>([])
  const [selected, setSelected]   = useState<any>(null)
  const [prixMap, setPrixMap]     = useState<Record<string,number>>({})
  const [search, setSearch]       = useState("")
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [baseGamme, setBaseGamme] = useState("Particuliers")

  useEffect(() => {
    Promise.all([
      supabase.from("clients").select("id,nom,contrat").eq("society_id",societyId).order("nom"),
      supabase.from("products").select("id,name,gamme,pv").eq("society_id",societyId).order("gamme").order("name"),
    ]).then(([{data:c},{data:p}]) => { setClients(c||[]); setProducts(p||[]) })
  }, [societyId])

  const loadTarifs = async (id: string) => {
    const { data } = await supabase.from("client_prix").select("*").eq("client_id", id)
    const map: Record<string,number> = {}
    ;(data||[]).forEach((p:any) => { map[p.product_id] = p.prix })
    setPrixMap(map)
  }

  const applyBase = () => {
    const map = {...prixMap}
    products.forEach(p => { if (p.gamme===baseGamme) map[p.id]=Number(p.pv) })
    setPrixMap(map)
  }

  const saveTarifs = async () => {
    if (!selected) return; setSaving(true)
    await supabase.from("client_prix").delete().eq("client_id", selected.id)
    const rows = Object.entries(prixMap).filter(([_,v])=>v>0).map(([product_id,prix])=>({ client_id: selected.id, product_id, prix }))
    if (rows.length>0) await supabase.from("client_prix").insert(rows)
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2000)
  }

  const gammes = [...new Set(products.map(p=>p.gamme))]

  return (
    <div className="flex gap-5">
      <div className="w-64 shrink-0 space-y-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden max-h-[55vh] overflow-y-auto">
          {clients.filter(c=>c.nom?.toLowerCase().includes(search.toLowerCase())).map(c=>(
            <button key={c.id} onClick={()=>{ setSelected(c); loadTarifs(c.id); setSaved(false) }}
              className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 last:border-0 ${selected?.id===c.id?"bg-yellow-500/10":""}`}>
              <div>
                <p className={`text-sm font-semibold ${selected?.id===c.id?"text-yellow-400":"text-white"}`}>{c.nom}</p>
                {c.contrat&&<p className="text-zinc-500 text-xs">{c.contrat}</p>}
              </div>
              {selected?.id===c.id&&<ChevronRight size={14} className="text-yellow-400 shrink-0"/>}
            </button>
          ))}
          {clients.length===0&&<p className="text-zinc-600 text-sm text-center py-6">Aucun client</p>}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        {!selected ? (
          <div className="flex items-center justify-center h-64 text-zinc-600 flex-col gap-3">
            <Users size={40} className="opacity-20"/><p className="text-sm">Sélectionne un client pour gérer ses tarifs</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div><p className="text-white font-bold text-lg">{selected.nom}</p><p className="text-zinc-500 text-xs">{selected.contrat||"Sans contrat"}</p></div>
              <div className="flex items-center gap-2 flex-wrap">
                <select value={baseGamme} onChange={e=>setBaseGamme(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none">
                  {GAMMES.map(g=><option key={g} value={g}>{GAMMES_CONFIG[g].label}</option>)}
                </select>
                <button onClick={applyBase} className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-3 py-1.5 rounded-lg hover:bg-blue-400/20">↩ Appliquer base</button>
                <button onClick={saveTarifs} disabled={saving}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg ${saved?"bg-green-500 text-white":"bg-yellow-500 hover:bg-yellow-400 text-black disabled:opacity-40"}`}>
                  {saved?<><Check size={12}/> Sauvegardé</>:<><Save size={12}/> Sauvegarder</>}
                </button>
              </div>
            </div>
            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              {gammes.map(gamme=>{
                const gcfg = GAMMES_CONFIG[gamme]
                return (
                  <div key={gamme}>
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{color:gcfg?.color||"#71717a"}}>{gcfg?.label||gamme}</p>
                    <div className="space-y-1.5">
                      {products.filter(p=>p.gamme===gamme).map(p=>(
                        <div key={p.id} className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-2">
                          <span className="flex-1 text-sm text-white truncate">{p.name}</span>
                          <span className="text-zinc-500 text-xs shrink-0">PV: {Number(p.pv).toFixed(2)}€</span>
                          <input type="number" min="0" step="0.01" value={prixMap[p.id]??""} placeholder={Number(p.pv).toFixed(2)}
                            onChange={e=>setPrixMap(prev=>({...prev,[p.id]:parseFloat(e.target.value)||0}))}
                            className="w-24 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1 text-sm text-white text-right focus:outline-none focus:border-yellow-500/60"/>
                          {prixMap[p.id]!=null&&prixMap[p.id]!==Number(p.pv)&&(
                            <span className={`text-[10px] font-bold w-14 text-right shrink-0 ${prixMap[p.id]<Number(p.pv)?"text-blue-400":"text-red-400"}`}>
                              {prixMap[p.id]<Number(p.pv)?"▼":"▲"}{Math.abs(prixMap[p.id]-Number(p.pv)).toFixed(2)}€
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── TARIFS PHARMACIES ──────────────────────── */
function TarifsPharmaciesSection({ societyId }: { societyId: string }) {
  const [pharmacies, setPharmacies] = useState<any[]>([])
  const [products, setProducts]     = useState<any[]>([])
  const [selected, setSelected]     = useState<any>(null)
  const [prixMap, setPrixMap]       = useState<Record<string,number>>({})
  const [search, setSearch]         = useState("")
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [baseGamme, setBaseGamme]   = useState("Particuliers")

  useEffect(() => {
    Promise.all([
      supabase.from("pharmacies").select("id,nom,ville,contrat").eq("society_id",societyId).order("nom"),
      supabase.from("products").select("id,name,gamme,pv").eq("society_id",societyId).order("gamme").order("name"),
    ]).then(([{data:p},{data:pr}]) => { setPharmacies(p||[]); setProducts(pr||[]) })
  }, [societyId])

  const loadTarifs = async (id: string) => {
    const { data } = await supabase.from("client_prix").select("*").eq("client_id", id)
    const map: Record<string,number> = {}
    ;(data||[]).forEach((p:any) => { map[p.product_id] = p.prix })
    setPrixMap(map)
  }

  const applyBase = () => {
    const map = {...prixMap}
    products.forEach(p => { if (p.gamme===baseGamme) map[p.id]=Number(p.pv) })
    setPrixMap(map)
  }

  const saveTarifs = async () => {
    if (!selected) return; setSaving(true)
    await supabase.from("client_prix").delete().eq("client_id", selected.id)
    const rows = Object.entries(prixMap).filter(([_,v])=>v>0).map(([product_id,prix])=>({ client_id: selected.id, product_id, prix }))
    if (rows.length>0) await supabase.from("client_prix").insert(rows)
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2000)
  }

  const gammes = [...new Set(products.map(p=>p.gamme))]

  return (
    <div className="flex gap-5">
      <div className="w-64 shrink-0 space-y-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nom, ville..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden max-h-[55vh] overflow-y-auto">
          {pharmacies.filter(p=>p.nom?.toLowerCase().includes(search.toLowerCase())||p.ville?.toLowerCase().includes(search.toLowerCase())).map(p=>(
            <button key={p.id} onClick={()=>{ setSelected(p); loadTarifs(p.id); setSaved(false) }}
              className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 last:border-0 ${selected?.id===p.id?"bg-green-500/10":""}`}>
              <div>
                <p className={`text-sm font-semibold ${selected?.id===p.id?"text-green-400":"text-white"}`}>{p.nom}</p>
                {p.ville&&<p className="text-zinc-500 text-xs">{p.ville}</p>}
              </div>
              {selected?.id===p.id&&<ChevronRight size={14} className="text-green-400 shrink-0"/>}
            </button>
          ))}
          {pharmacies.length===0&&<p className="text-zinc-600 text-sm text-center py-6">Aucune pharmacie</p>}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        {!selected ? (
          <div className="flex items-center justify-center h-64 text-zinc-600 flex-col gap-3">
            <Building2 size={40} className="opacity-20"/><p className="text-sm">Sélectionne une pharmacie pour gérer ses tarifs</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div><p className="text-white font-bold text-lg">{selected.nom}</p><p className="text-zinc-500 text-xs">{selected.ville||""}</p></div>
              <div className="flex items-center gap-2 flex-wrap">
                <select value={baseGamme} onChange={e=>setBaseGamme(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none">
                  {GAMMES.map(g=><option key={g} value={g}>{GAMMES_CONFIG[g].label}</option>)}
                </select>
                <button onClick={applyBase} className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-3 py-1.5 rounded-lg hover:bg-blue-400/20">↩ Appliquer base</button>
                <button onClick={saveTarifs} disabled={saving}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg ${saved?"bg-green-500 text-white":"bg-green-500 hover:bg-green-400 text-black disabled:opacity-40"}`}>
                  {saved?<><Check size={12}/> Sauvegardé</>:<><Save size={12}/> Sauvegarder</>}
                </button>
              </div>
            </div>
            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              {gammes.map(gamme=>{
                const gcfg = GAMMES_CONFIG[gamme]
                return (
                  <div key={gamme}>
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{color:gcfg?.color||"#71717a"}}>{gcfg?.label||gamme}</p>
                    <div className="space-y-1.5">
                      {products.filter(p=>p.gamme===gamme).map(p=>(
                        <div key={p.id} className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-2">
                          <span className="flex-1 text-sm text-white truncate">{p.name}</span>
                          <span className="text-zinc-500 text-xs shrink-0">PV: {Number(p.pv).toFixed(2)}€</span>
                          <input type="number" min="0" step="0.01" value={prixMap[p.id]??""} placeholder={Number(p.pv).toFixed(2)}
                            onChange={e=>setPrixMap(prev=>({...prev,[p.id]:parseFloat(e.target.value)||0}))}
                            className="w-24 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1 text-sm text-white text-right focus:outline-none focus:border-green-500/60"/>
                          {prixMap[p.id]!=null&&prixMap[p.id]!==Number(p.pv)&&(
                            <span className={`text-[10px] font-bold w-14 text-right shrink-0 ${prixMap[p.id]<Number(p.pv)?"text-blue-400":"text-red-400"}`}>
                              {prixMap[p.id]<Number(p.pv)?"▼":"▲"}{Math.abs(prixMap[p.id]-Number(p.pv)).toFixed(2)}€
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── MAIN ───────────────────────────────────── */
export default function AdminModule({ activeSociety, profile }: Props) {
  const [products, setProducts]           = useState<Product[]>([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState("")
  const [activeGamme, setActiveGamme]     = useState("Tous")
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [showPanel, setShowPanel]         = useState(false)
  const [activeSection, setActiveSection] = useState("produits")
  const [tarifTab, setTarifTab]           = useState<"overview"|"clients"|"pharmacies">("overview")

  useEffect(() => { if (activeSociety) loadProducts() }, [activeSociety])

  const loadProducts = async () => {
    setLoading(true)
    const { data } = await supabase.from("products").select("*").eq("society_id", activeSociety.id).order("gamme").order("name")
    setProducts(data || []); setLoading(false)
  }

  const saveProduct = async (form: any) => {
    const hasCompo = Object.keys(form.composition||{}).length > 0
    const inStock  = hasCompo ? false : form.in_stock
    const payload  = { society_id: activeSociety.id, name: form.name.trim(), gamme: form.gamme, pv: parseFloat(form.pv)||0, cf: parseFloat(form.cf)||0, in_stock: inStock, composition: form.composition||{}, avatar_url: form.avatar_url||null }
    if (form.id) {
      await supabase.from("products").update(payload).eq("id", form.id)
      if (inStock) {
        const { data: ex } = await supabase.from("stock").select("id").eq("society_id",activeSociety.id).eq("product_id",form.id).maybeSingle()
        if (!ex) await supabase.from("stock").insert({ society_id:activeSociety.id, product_id:form.id, produit_nom:form.name.trim(), quantite:0, seuil_alerte:0 })
      }
    } else {
      const { data: newProd } = await supabase.from("products").insert(payload).select().single()
      if (inStock&&newProd) await supabase.from("stock").insert({ society_id:activeSociety.id, product_id:newProd.id, produit_nom:form.name.trim(), quantite:0, seuil_alerte:0 })
    }
    setEditingProduct(null); setShowPanel(false); loadProducts()
  }

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" du catalogue ?\n\nCela supprimera aussi son entrée dans le stock.`)) return
    await supabase.from("stock").delete().eq("product_id", id)
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (error) { alert(`Erreur suppression : ${error.message}`); return }
    loadProducts()
  }

  const filtered     = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && (activeGamme==="Tous"||p.gamme===activeGamme))
  const gammeGroups  = GAMMES.filter(g => activeGamme==="Tous"||g===activeGamme)

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Administration</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{activeSociety.name}</p>
          </div>
        </div>

        {/* Nav sections */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id:"utilisateurs", label:"👥 Utilisateurs & Droits" },
            { id:"produits",     label:"📦 Catalogue produits" },
            { id:"tarifs",       label:"🏷️ Tarifs" },
            { id:"vente",        label:"🛒 Vente" },
            { id:"finances",     label:"🏦 Finances & Taxes" },
          ].map(s=>(
            <button key={s.id} onClick={()=>setActiveSection(s.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${activeSection===s.id?"bg-yellow-500 text-black border-yellow-500":"bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* UTILISATEURS */}
        {activeSection==="utilisateurs" && <AdminUsersSection activeSociety={activeSociety} currentProfile={profile}/>}

        {/* PRODUITS */}
        {activeSection==="produits" && (
          <>
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                <input type="text" placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50"/>
              </div>
              <div className="flex gap-2 flex-wrap">
                {["Tous",...GAMMES].map(g=>(
                  <button key={g} onClick={()=>setActiveGamme(g)}
                    className={`text-[11px] font-semibold px-3 py-2 rounded-lg border transition-colors ${activeGamme===g?"bg-yellow-500 text-black border-yellow-500":"text-zinc-400 border-zinc-800 bg-zinc-900 hover:border-zinc-600"}`}>
                    {GAMMES_CONFIG[g]?.label||g}
                  </button>
                ))}
              </div>
              <button onClick={()=>{setEditingProduct(emptyProduct);setShowPanel(true)}}
                className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-yellow-500/20 ml-auto">
                <Plus size={16}/> Nouveau produit
              </button>
            </div>
            {/* Stats par gamme */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {GAMMES.map(g=>{
                const gcfg = GAMMES_CONFIG[g]
                return (
                  <div key={g} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-zinc-500 text-[11px] font-semibold uppercase tracking-wider mb-1">{gcfg.label}</p>
                    <p className="text-2xl font-bold" style={{color:gcfg.color}}>{products.filter(p=>p.gamme===g).length}</p>
                  </div>
                )
              })}
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/></div>
            ) : (
              <div className="space-y-6">
                {gammeGroups.map(gamme=>{
                  const gammeProducts = filtered.filter(p=>p.gamme===gamme)
                  if (gammeProducts.length===0) return null
                  const gcfg = GAMMES_CONFIG[gamme]
                  return (
                    <div key={gamme}>
                      <div className="flex items-center gap-3 mb-3">
                        <h2 className="text-sm font-bold uppercase tracking-wider" style={{color:gcfg?.color||"#71717a"}}>{gcfg?.label||gamme}</h2>
                        <div className="flex-1 h-px bg-zinc-800"/>
                        <span className="text-xs text-zinc-600">{gammeProducts.length} produits</span>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-zinc-800">
                              {["Produit","PV","CF","Marge","Stock","Composition","Actions"].map(h=>(
                                <th key={h} className={`px-5 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider ${h==="Actions"?"text-right":h==="Produit"?"text-left":"text-center"}`}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800">
                            {gammeProducts.map(product=>{
                              const marge  = product.pv - product.cf
                              const margeP = product.pv>0?(marge/product.pv*100):0
                              const compEntries = Object.entries(product.composition||{})
                              return (
                                <tr key={product.id} className="hover:bg-zinc-800/40 transition-colors">
                                  <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-xl overflow-hidden border border-zinc-700 shrink-0 bg-zinc-800 flex items-center justify-center">
                                        {product.avatar_url ? <img src={product.avatar_url} alt={product.name} className="w-full h-full object-cover"/> : <Package size={14} className="text-yellow-500 opacity-60"/>}
                                      </div>
                                      <span className="text-white text-sm font-medium">{product.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3 text-center"><span className="text-yellow-500 font-bold text-sm">{Number(product.pv).toFixed(2)}€</span></td>
                                  <td className="px-5 py-3 text-center"><span className="text-zinc-400 text-sm">{Number(product.cf).toFixed(2)}€</span></td>
                                  <td className="px-5 py-3 text-center">
                                    <span className={`text-sm font-semibold ${marge>=0?"text-green-400":"text-red-400"}`}>
                                      {marge.toFixed(2)}€ <span className="text-[10px] font-normal opacity-70">({margeP.toFixed(0)}%)</span>
                                    </span>
                                  </td>
                                  <td className="px-5 py-3 text-center">
                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${product.in_stock?"text-green-400 bg-green-400/10 border-green-400/20":"text-zinc-500 bg-zinc-800 border-zinc-700"}`}>
                                      {product.in_stock?"Oui":"Non"}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3">
                                    {compEntries.length>0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {compEntries.map(([name,qty])=>(
                                          <span key={name} className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-full">{name} ×{qty}</span>
                                        ))}
                                      </div>
                                    ):<span className="text-zinc-700 text-xs">—</span>}
                                  </td>
                                  <td className="px-5 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                      <button onClick={()=>{setEditingProduct(product);setShowPanel(true)}}
                                        className="text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold hover:bg-blue-400/20 transition-colors flex items-center gap-1">
                                        <Pencil size={11}/> Modifier
                                      </button>
                                      <button onClick={()=>deleteProduct(product.id,product.name)}
                                        className="text-red-400 bg-red-400/10 border border-red-400/20 p-1.5 rounded-lg hover:bg-red-400/20 transition-colors">
                                        <Trash2 size={13}/>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
                {filtered.length===0&&(
                  <div className="text-center py-16 text-zinc-600">
                    <Package size={40} className="mx-auto mb-4 opacity-20"/>
                    <p className="text-sm">Aucun produit trouvé</p>
                    <button onClick={()=>{setEditingProduct(emptyProduct);setShowPanel(true)}} className="mt-4 text-yellow-500 text-xs hover:underline">+ Ajouter un produit</button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* TARIFS — 3 sous-onglets */}
        {activeSection==="tarifs" && (
          <div className="space-y-5">
            <div className="flex gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1.5">
              {([{id:"overview",label:"📊 Vue globale"},{id:"clients",label:"👤 Tarifs clients"},{id:"pharmacies",label:"🏥 Tarifs pharmacies"}] as const).map(t=>(
                <button key={t.id} onClick={()=>setTarifTab(t.id)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tarifTab===t.id?"bg-yellow-500 text-black":"text-zinc-400 hover:text-zinc-200"}`}>
                  {t.label}
                </button>
              ))}
            </div>
            {tarifTab==="overview" && (
              <div className="space-y-4">
                <p className="text-zinc-500 text-sm">Vue globale des tarifs par gamme.</p>
                {GAMMES.map(gamme=>{
                  const gammeProducts = products.filter(p=>p.gamme===gamme)
                  if (gammeProducts.length===0) return null
                  const gcfg = GAMMES_CONFIG[gamme]
                  return (
                    <div key={gamme} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                      <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
                        <h3 className="text-white font-bold">{gcfg?.label||gamme}</h3>
                        <span className="text-xs text-zinc-500">({gammeProducts.length})</span>
                      </div>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-zinc-800">
                            {["Produit","Prix de vente","Coût fabrication","Marge brute","Marge %"].map(h=>(
                              <th key={h} className={`px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider ${h==="Produit"?"text-left":"text-center"}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {gammeProducts.map(p=>{
                            const marge  = p.pv-p.cf
                            const margeP = p.pv>0?(marge/p.pv*100):0
                            return (
                              <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                                <td className="px-6 py-3 text-white text-sm font-medium">{p.name}</td>
                                <td className="px-6 py-3 text-center text-yellow-500 font-bold">{Number(p.pv).toFixed(2)}€</td>
                                <td className="px-6 py-3 text-center text-zinc-400">{Number(p.cf).toFixed(2)}€</td>
                                <td className={`px-6 py-3 text-center font-semibold ${marge>=0?"text-green-400":"text-red-400"}`}>{marge.toFixed(2)}€</td>
                                <td className={`px-6 py-3 text-center text-sm ${margeP>=50?"text-green-400":margeP>=30?"text-yellow-400":"text-red-400"}`}>{margeP.toFixed(1)}%</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                })}
              </div>
            )}
            {tarifTab==="clients"    && <TarifsClientsSection societyId={activeSociety.id}/>}
            {tarifTab==="pharmacies" && <TarifsPharmaciesSection societyId={activeSociety.id}/>}
          </div>
        )}

        {activeSection==="vente"    && <AdminVenteSection activeSociety={activeSociety}/>}
        {activeSection==="finances" && <AdminFinancesSection activeSociety={activeSociety}/>}
      </div>

      {showPanel&&editingProduct&&(
        <ProductPanel product={editingProduct} allProducts={products} onSave={saveProduct} onClose={()=>{setShowPanel(false);setEditingProduct(null)}}/>
      )}
    </div>
  )
}

/* ══ SECTION VENTE (inchangée) ══════════════ */
const VENTE_DEFAULTS = {
  tva_rate:20.0,remise_max:30,vente_min_amt:0,port_defaut:0,
  offert_max:5,vente_confirm:false,vente_auto_print:false,
  modes_paiement:["Espèces","CB","Chèque","Virement","PayPal"],
}
function AdminVenteSection({activeSociety}:{activeSociety:any}) {
  const [cfg,setCfg]         = useState<Record<string,any>>({...VENTE_DEFAULTS})
  const [saving,setSaving]   = useState(false)
  const [saved,setSaved]     = useState(false)
  const [tagInput,setTagInput] = useState("")
  useEffect(()=>{
    supabase.from("settings").select("key,value").eq("society_id",activeSociety.id).in("key",Object.keys(VENTE_DEFAULTS)).then(({data})=>{
      if(data?.length) data.forEach(({key,value})=>setCfg(p=>({...p,[key]:value})))
    })
  },[activeSociety])
  const set=(k:string,v:any)=>setCfg(p=>({...p,[k]:v}))
  const save=async()=>{
    setSaving(true)
    await Promise.all(Object.entries(cfg).map(([key,value])=>supabase.from("settings").upsert({society_id:activeSociety.id,key,value},{onConflict:"society_id,key"})))
    setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2500)
  }
  const addMode=()=>{const v=tagInput.trim();if(v&&!cfg.modes_paiement.includes(v))set("modes_paiement",[...cfg.modes_paiement,v]);setTagInput("")}
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${saved?"bg-green-500/20 text-green-400 border border-green-500/30":"bg-yellow-500 hover:bg-yellow-400 text-black"}`}>
          {saving?<div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/>:saved?"✓":<Save size={14}/>}{saved?"Sauvegardé !":"Sauvegarder"}
        </button>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
        <h3 className="text-white font-bold text-sm border-b border-zinc-800 pb-3">🛒 Règles & Limites</h3>
        {[["tva_rate","TVA par défaut (%)","number"],["remise_max","Remise maximale autorisée (%)","number"],["vente_min_amt","Montant minimum de vente (€)","number"],["port_defaut","Port par défaut (€)","number"],["offert_max","Quantité max offerts/cassés/vente","number"]].map(([key,label,type])=>(
          <div key={key} className="flex items-center justify-between">
            <p className="text-zinc-300 text-sm">{label}</p>
            <input type={type} value={cfg[key]} onChange={e=>set(key,type==="number"?Number(e.target.value):e.target.value)} className="w-32 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-yellow-500/60"/>
          </div>
        ))}
        <div className="border-t border-zinc-800 pt-4 space-y-3">
          {[["vente_confirm","Demander confirmation avant valider une vente"],["vente_auto_print","Imprimer automatiquement après vente"]].map(([key,label])=>(
            <div key={key} className="flex items-center justify-between">
              <p className="text-zinc-300 text-sm">{label}</p>
              <button onClick={()=>set(key,!cfg[key])} className={`relative w-11 h-6 rounded-full transition-colors ${cfg[key]?"bg-yellow-500":"bg-zinc-700"}`}>
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform left-0.5" style={{transform:cfg[key]?"translateX(20px)":"translateX(0)"}}/>
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-white font-bold text-sm border-b border-zinc-800 pb-3 mb-4">💳 Modes de paiement</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {cfg.modes_paiement.map((m:string)=>(
            <span key={m} className="flex items-center gap-1.5 bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-lg border border-zinc-700">
              {m}<button onClick={()=>set("modes_paiement",cfg.modes_paiement.filter((x:string)=>x!==m))} className="text-zinc-500 hover:text-red-400 transition-colors">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addMode()} placeholder="Ajouter un mode..." className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60"/>
          <button onClick={addMode} className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-xl text-sm transition-colors">+</button>
        </div>
      </div>
    </div>
  )
}

/* ══ SECTION FINANCES (inchangée) ═══════════ */
const FINANCES_DEFAULTS={urssaf_rate_global:0.14,tva_taux_reduit:5.5,tva_taux_super_reduit:2.1,seuil_micro_bic:77700,seuil_auto_entrepreneur:188700}
function AdminFinancesSection({activeSociety}:{activeSociety:any}) {
  const [cfg,setCfg]       = useState<Record<string,any>>({...FINANCES_DEFAULTS})
  const [saving,setSaving] = useState(false)
  const [saved,setSaved]   = useState(false)
  useEffect(()=>{
    supabase.from("settings").select("key,value").eq("society_id",activeSociety.id).in("key",Object.keys(FINANCES_DEFAULTS)).then(({data})=>{
      if(data?.length) data.forEach(({key,value})=>setCfg(p=>({...p,[key]:value})))
    })
  },[activeSociety])
  const set=(k:string,v:any)=>setCfg(p=>({...p,[k]:v}))
  const save=async()=>{
    setSaving(true)
    await Promise.all(Object.entries(cfg).map(([key,value])=>supabase.from("settings").upsert({society_id:activeSociety.id,key,value},{onConflict:"society_id,key"})))
    setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2500)
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${saved?"bg-green-500/20 text-green-400 border border-green-500/30":"bg-yellow-500 hover:bg-yellow-400 text-black"}`}>
          {saving?<div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/>:saved?"✓":<Save size={14}/>}{saved?"Sauvegardé !":"Sauvegarder"}
        </button>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
        <h3 className="text-white font-bold text-sm border-b border-zinc-800 pb-3">🏦 Taux & Charges</h3>
        <div className="flex items-center justify-between">
          <div><p className="text-zinc-300 text-sm">Taux URSSAF (%)</p><p className="text-zinc-600 text-xs mt-0.5">Appliqué au calcul du net sur les ventes</p></div>
          <div className="flex items-center gap-2">
            <input type="number" step="0.1" value={(cfg.urssaf_rate_global*100).toFixed(1)} onChange={e=>set("urssaf_rate_global",Number(e.target.value)/100)} className="w-24 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-yellow-500/60"/>
            <span className="text-zinc-500 text-xs">%</span>
          </div>
        </div>
        {[["tva_taux_reduit","TVA taux réduit (%)","Produits alimentaires, transports..."],["tva_taux_super_reduit","TVA taux super réduit (%)","Médicaments, presse..."]].map(([key,label,sub])=>(
          <div key={key} className="flex items-center justify-between">
            <div><p className="text-zinc-300 text-sm">{label}</p><p className="text-zinc-600 text-xs mt-0.5">{sub}</p></div>
            <input type="number" step="0.1" value={cfg[key]} onChange={e=>set(key,Number(e.target.value))} className="w-24 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-yellow-500/60"/>
          </div>
        ))}
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
        <h3 className="text-white font-bold text-sm border-b border-zinc-800 pb-3">⚖️ Seuils légaux</h3>
        {[["seuil_micro_bic","Seuil Micro-BIC (€)","Régime fiscal simplifié"],["seuil_auto_entrepreneur","Seuil auto-entrepreneur (€)","Plafond annuel de CA"]].map(([key,label,sub])=>(
          <div key={key} className="flex items-center justify-between">
            <div><p className="text-zinc-300 text-sm">{label}</p><p className="text-zinc-600 text-xs mt-0.5">{sub}</p></div>
            <input type="number" value={cfg[key]} onChange={e=>set(key,Number(e.target.value))} className="w-36 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-yellow-500/60"/>
          </div>
        ))}
        <div className="mt-4 border-t border-zinc-800 pt-4">
          <p className="text-zinc-500 text-xs mb-3">Taux effectif actuel appliqué sur les ventes</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-zinc-800 rounded-full h-3 overflow-hidden"><div className="bg-yellow-500 h-3 rounded-full" style={{width:`${cfg.urssaf_rate_global*100}%`}}/></div>
            <span className="text-yellow-500 font-bold text-sm w-12 text-right">{(cfg.urssaf_rate_global*100).toFixed(1)}%</span>
          </div>
          <p className="text-zinc-600 text-xs mt-1.5">Sur 1000€ de CA → net = <span className="text-green-400 font-semibold">{(1000-1000*cfg.urssaf_rate_global).toFixed(0)}€</span></p>
        </div>
      </div>
    </div>
  )
}

/* ══ SECTION UTILISATEURS (inchangée) ══════ */
const ALL_TABS_CONFIG=[
  {id:"accueil",label:"🏠 Accueil",category:"principal"},{id:"vente",label:"🛒 Vente",category:"principal"},
  {id:"clients",label:"👤 Clients",category:"principal"},{id:"stocks",label:"📦 Stock",category:"principal"},
  {id:"depenses",label:"💸 Dépenses & Offerts",category:"gestion"},{id:"contrats",label:"📑 Contrats",category:"gestion"},
  {id:"pharmacies",label:"🏥 Pharmacies",category:"gestion"},{id:"stats",label:"📊 Statistiques",category:"analyse"},
  {id:"historique",label:"🕓 Historique",category:"analyse"},{id:"messages",label:"💬 Messages",category:"outils"},
  {id:"notes",label:"📝 Notes",category:"outils"},{id:"documents",label:"📁 Documents",category:"outils"},
  {id:"prospects",label:"🎯 Prospects",category:"demarchage"},{id:"map",label:"🗺️ Map & Tournées",category:"demarchage"},
  {id:"admin",label:"🔒 Admin",category:"systeme"},{id:"parametres",label:"⚙️ Paramètres",category:"systeme"},
]
const ROLE_PRESETS:Record<string,string[]>={
  admin:ALL_TABS_CONFIG.map(t=>t.id),
  gerant:["accueil","vente","clients","stocks","depenses","contrats","pharmacies","stats","historique","messages","notes","documents","parametres"],
  vendeur:["accueil","vente","clients","stocks","notes","messages","parametres"],
  demarcheur:["accueil","prospects","map","messages","notes","parametres"],
  lecture:["accueil","stats","historique","messages","parametres"],
}
const ROLE_LABELS:Record<string,string>={admin:"Administrateur",gerant:"Gérant",vendeur:"Vendeur",demarcheur:"Démarcheur",lecture:"Lecture seule"}
const ROLE_COLORS:Record<string,string>={admin:"#ef4444",gerant:"#f97316",vendeur:"#22c55e",demarcheur:"#3b82f6",lecture:"#71717a"}
const CATEGORY_LABELS:Record<string,string>={principal:"Principal",gestion:"Gestion",analyse:"Analyse",outils:"Outils",demarchage:"Démarchage",systeme:"Système"}
interface UserProfile{id:string;nom:string;email?:string;avatar_url?:string;color?:string;role:string;permissions:Record<string,boolean>;is_active:boolean;notes_admin:string;created_at?:string}

function AdminUsersSection({activeSociety,currentProfile}:{activeSociety:any;currentProfile:any}) {
  const [users,setUsers]           = useState<UserProfile[]>([])
  const [selected,setSelected]     = useState<UserProfile|null>(null)
  const [showInvite,setShowInvite] = useState(false)
  const [inviteEmail,setInviteEmail] = useState("")
  const [inviteNom,setInviteNom]   = useState("")
  const [inviteRole,setInviteRole] = useState("vendeur")
  const [inviting,setInviting]     = useState(false)
  const [saving,setSaving]         = useState(false)
  const [saved,setSaved]           = useState(false)
  const [search,setSearch]         = useState("")
  useEffect(()=>{loadUsers()},[activeSociety])
  const loadUsers=async()=>{
    const{data,error}=await supabase.from("profiles_with_email").select("id,nom,email,avatar_url,color,role,permissions,is_active,notes_admin,created_at").eq("society_id",activeSociety.id).order("created_at",{ascending:true})
    if(error){const{data:fb}=await supabase.from("profiles").select("id,nom,email,avatar_url,color,role,permissions,is_active,notes_admin,created_at").eq("society_id",activeSociety.id).order("created_at",{ascending:true});if(fb)setUsers(fb as UserProfile[]);return}
    if(data)setUsers(data as UserProfile[])
  }
  const selectUser=(u:UserProfile)=>{
    const preset=ROLE_PRESETS[u.role]||[];const perms:Record<string,boolean>={}
    ALL_TABS_CONFIG.forEach(t=>{perms[t.id]=u.permissions?.[t.id]??preset.includes(t.id)})
    setSelected({...u,permissions:perms})
  }
  const setRole=(role:string)=>{
    if(!selected)return;const preset=ROLE_PRESETS[role]||[];const perms:Record<string,boolean>={}
    ALL_TABS_CONFIG.forEach(t=>{perms[t.id]=preset.includes(t.id)});setSelected({...selected,role,permissions:perms})
  }
  const togglePerm=(tabId:string)=>{if(!selected)return;setSelected({...selected,permissions:{...selected.permissions,[tabId]:!selected.permissions[tabId]}})}
  const saveUser=async()=>{
    if(!selected)return;setSaving(true)
    await supabase.from("profiles").update({role:selected.role,permissions:selected.permissions,is_active:selected.is_active,notes_admin:selected.notes_admin}).eq("id",selected.id)
    setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2000);loadUsers()
  }
  const toggleActive=async(u:UserProfile)=>{
    await supabase.from("profiles").update({is_active:!u.is_active}).eq("id",u.id);loadUsers()
    if(selected?.id===u.id)setSelected({...selected,is_active:!u.is_active})
  }
  const inviteUser=async()=>{
    if(!inviteEmail.trim()||!inviteNom.trim())return;setInviting(true)
    await (supabase.auth as any).admin?.inviteUserByEmail?.(inviteEmail)
    const preset=ROLE_PRESETS[inviteRole];const perms:Record<string,boolean>={}
    ALL_TABS_CONFIG.forEach(t=>{perms[t.id]=preset.includes(t.id)})
    await supabase.from("profiles").insert({nom:inviteNom,role:inviteRole,permissions:perms,society_id:activeSociety.id,is_active:true,created_by:currentProfile.id}).select()
    setInviting(false);setShowInvite(false);setInviteEmail("");setInviteNom("");loadUsers()
  }
  const categories=[...new Set(ALL_TABS_CONFIG.map(t=>t.category))]
  const filtered=users.filter(u=>u.nom?.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="flex gap-6 h-[calc(100vh-220px)] min-h-[500px]">
      <div className="w-72 flex flex-col gap-3 shrink-0">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"/>
          </div>
          <button onClick={()=>setShowInvite(true)} className="w-9 h-9 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl flex items-center justify-center shrink-0 transition-colors"><Plus size={16}/></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {filtered.map(u=>{
            const isSelected=selected?.id===u.id;const roleColor=ROLE_COLORS[u.role]||"#71717a"
            const initials=u.nom?.split(" ").map((n:string)=>n[0]).join("").toUpperCase().slice(0,2)||"?"
            return (
              <button key={u.id} onClick={()=>selectUser(u)} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSelected?"border-yellow-500/50 bg-yellow-500/8":"border-zinc-800 bg-zinc-900 hover:border-zinc-700"}`}>
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-black font-bold text-xs overflow-hidden border border-zinc-700" style={{backgroundColor:u.avatar_url?undefined:(u.color||roleColor)}}>
                    {u.avatar_url?<img src={u.avatar_url} className="w-full h-full object-cover" alt=""/>:initials}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-zinc-900 ${u.is_active?"bg-green-400":"bg-zinc-600"}`}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{u.nom}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{backgroundColor:roleColor+"20",color:roleColor}}>{ROLE_LABELS[u.role]||u.role}</span>
                    {!u.is_active&&<span className="text-[10px] text-zinc-500">Désactivé</span>}
                  </div>
                </div>
                {u.id===currentProfile.id&&<span className="text-[10px] text-zinc-600 shrink-0">Moi</span>}
              </button>
            )
          })}
        </div>
        <div className="text-zinc-600 text-xs text-center">{users.length} utilisateur{users.length>1?"s":""}</div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {!selected?(
          <div className="h-full flex items-center justify-center text-zinc-700">
            <div className="text-center"><p className="text-4xl mb-3">👥</p><p className="text-sm font-semibold">Sélectionnez un utilisateur</p><p className="text-xs mt-1 opacity-60">pour modifier ses droits d'accès</p></div>
          </div>
        ):(
          <div className="space-y-4 pb-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center text-black font-black text-lg shrink-0" style={{backgroundColor:selected.color||ROLE_COLORS[selected.role]||"#d97706"}}>
                  {selected.avatar_url?<img src={selected.avatar_url} className="w-full h-full object-cover" alt=""/>:selected.nom?.slice(0,2).toUpperCase()}
                </div>
                <div className="flex-1"><p className="text-white font-bold text-lg">{selected.nom}</p><p className="text-zinc-500 text-sm">{selected.email||"Email non renseigné"}</p></div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>toggleActive(selected)} className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${selected.is_active?"text-green-400 border-green-500/30 bg-green-500/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30":"text-red-400 border-red-500/30 bg-red-500/10 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/30"}`}>
                    {selected.is_active?"✓ Actif":"✗ Désactivé"}
                  </button>
                  <button onClick={saveUser} disabled={saving} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${saved?"bg-green-500/20 text-green-400":"bg-yellow-500 text-black hover:bg-yellow-400"}`}>
                    {saving?<div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>:saved?<Check size={12}/>:<Save size={12}/>}{saved?"Sauvegardé":"Sauvegarder"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Rôle prédéfini</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(ROLE_LABELS).map(([role,label])=>(
                    <button key={role} onClick={()=>setRole(role)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selected.role===role?"border-0":"border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
                      style={selected.role===role?{backgroundColor:ROLE_COLORS[role]+"25",color:ROLE_COLORS[role],border:`1px solid ${ROLE_COLORS[role]}50`}:{}}>{label}
                    </button>
                  ))}
                </div>
                <p className="text-zinc-600 text-[11px] mt-2">Sélectionner un rôle applique ses permissions par défaut. Vous pouvez ensuite les affiner manuellement.</p>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-sm">Accès aux modules</h3>
                <div className="flex gap-2">
                  <button onClick={()=>{const all:Record<string,boolean>={};ALL_TABS_CONFIG.forEach(t=>{all[t.id]=true});setSelected({...selected,permissions:all})}} className="text-xs text-zinc-400 hover:text-white transition-colors">Tout cocher</button>
                  <span className="text-zinc-700">·</span>
                  <button onClick={()=>{const none:Record<string,boolean>={};ALL_TABS_CONFIG.forEach(t=>{none[t.id]=false});setSelected({...selected,permissions:none})}} className="text-xs text-zinc-400 hover:text-white transition-colors">Tout décocher</button>
                </div>
              </div>
              <div className="space-y-4">
                {categories.map(cat=>(
                  <div key={cat}>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">{CATEGORY_LABELS[cat]||cat}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ALL_TABS_CONFIG.filter(t=>t.category===cat).map(tab=>{
                        const enabled=selected.permissions[tab.id]??false
                        return (
                          <button key={tab.id} onClick={()=>togglePerm(tab.id)} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all ${enabled?"bg-green-500/8 border-green-500/30":"border-zinc-800 bg-zinc-800/40 opacity-50 hover:opacity-70"}`}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${enabled?"bg-green-500 border-green-500":"border-zinc-600"}`}>{enabled&&<Check size={10} className="text-black"/>}</div>
                            <span className={`text-xs font-medium ${enabled?"text-zinc-200":"text-zinc-500"}`}>{tab.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-zinc-500 text-xs"><span className="text-green-400 font-bold">{Object.values(selected.permissions).filter(Boolean).length}</span> module{Object.values(selected.permissions).filter(Boolean).length>1?"s":""} autorisé{Object.values(selected.permissions).filter(Boolean).length>1?"s":""} sur {ALL_TABS_CONFIG.length}</p>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Notes administrateur</label>
              <textarea value={selected.notes_admin||""} onChange={e=>setSelected({...selected,notes_admin:e.target.value})} rows={3} placeholder="Notes internes sur cet utilisateur (non visible par lui)..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 resize-none"/>
            </div>
          </div>
        )}
      </div>
      {showInvite&&(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h3 className="text-white font-bold">➕ Ajouter un utilisateur</h3>
              <button onClick={()=>setShowInvite(false)} className="text-zinc-500 hover:text-white"><X size={16}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5">Nom complet</label>
                <input value={inviteNom} onChange={e=>setInviteNom(e.target.value)} placeholder="Ex: Rudy Martin" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60"/>
              </div>
              <div>
                <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="email@exemple.com" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60"/>
              </div>
              <div>
                <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5">Rôle</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(ROLE_LABELS).map(([role,label])=>(
                    <button key={role} onClick={()=>setInviteRole(role)} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left ${inviteRole===role?"":"border-zinc-700 text-zinc-400"}`}
                      style={inviteRole===role?{backgroundColor:ROLE_COLORS[role]+"20",color:ROLE_COLORS[role],borderColor:ROLE_COLORS[role]+"50"}:{}}>
                      {label}<p className="text-[10px] font-normal mt-0.5 opacity-70">{ROLE_PRESETS[role]?.length||0} modules</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-zinc-800 rounded-xl p-3">
                <p className="text-zinc-400 text-xs font-semibold mb-1">Modules autorisés avec ce rôle :</p>
                <p className="text-zinc-500 text-[11px]">{ROLE_PRESETS[inviteRole]?.map(id=>ALL_TABS_CONFIG.find(t=>t.id===id)?.label).join(", ")}</p>
              </div>
            </div>
            <div className="p-5 pt-0">
              <button onClick={inviteUser} disabled={inviting||!inviteNom.trim()} className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-2.5 rounded-xl text-sm transition-colors">
                {inviting?"Création...":"Créer l'utilisateur"}
              </button>
              <p className="text-zinc-600 text-[11px] text-center mt-2">L'utilisateur devra se connecter avec cet email et définir son mot de passe.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}