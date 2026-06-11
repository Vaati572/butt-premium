"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
  Plus, X, ShoppingCart, Check, Pencil, Trash2, Package,
  Wallet, Search, Minus, AlertTriangle, ChevronDown, User,
} from "lucide-react"

interface Props { activeSociety: any; profile: any }

const BILLETS = [500, 200, 100, 50, 20, 10, 5]
const PIECES  = [2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01]
const DEFAULT_URSSAF = 0.138
const GAMMES_ALL = ["Tous","Particuliers","Professionnels","Shopify","Convention"]
const PAIEMENTS_CONV = ["Especes","CB","Virement","Cheque","En attente"]
const GAMME_COLOR: Record<string,string> = {
  Particuliers:"#eab308",Professionnels:"#a855f7",Shopify:"#22c55e",Convention:"#f97316"
}
const GAMME_EMOJI: Record<string,string> = {
  Particuliers:"👤",Professionnels:"🏢",Shopify:"🛍️",Convention:"🎪"
}

/* CAISSE */
function CaissePanel({ societyId, convention, onClose }: { societyId:string; convention:any; onClose:()=>void }) {
  const today = new Date().toISOString().slice(0,10)
  const [date,setDate]=useState(today)
  const [fondOuverture,setFondOuverture]=useState(0)
  const [billets,setBillets]=useState<Record<number,number>>({})
  const [pieces,setPieces]=useState<Record<number,number>>({})
  const [notes,setNotes]=useState("")
  const [caConvention,setCaConvention]=useState(0)
  const [saving,setSaving]=useState(false)
  const [saved,setSaved]=useState(false)
  const [existingId,setExistingId]=useState<string|null>(null)
  const [section,setSection]=useState<"ouverture"|"fermeture">("ouverture")

  useEffect(()=>{
    supabase.from("ventes").select("total_ttc").eq("society_id",societyId).gte("created_at",`${date}T00:00:00`).lte("created_at",`${date}T23:59:59`)
      .then(({data})=>setCaConvention((data||[]).reduce((s:number,v:any)=>s+Number(v.total_ttc||0),0)))
  },[date,societyId])

  useEffect(()=>{
    supabase.from("caisse_journaliere").select("*").eq("convention_id",convention.id).eq("date",date).single()
      .then(({data})=>{
        if(data){setExistingId(data.id);setFondOuverture(Number(data.fond_ouverture||0));setBillets(data.billets||{});setPieces(data.pieces||{});setNotes(data.notes||"")}
        else{setExistingId(null);setFondOuverture(0);setBillets({});setPieces({});setNotes("")}
      })
  },[date,convention.id])

  const totalBillets=BILLETS.reduce((s,b)=>s+b*(billets[b]||0),0)
  const totalPieces=PIECES.reduce((s,p)=>s+p*(pieces[p]||0),0)
  const totalCompte=totalBillets+totalPieces
  const ecart=totalCompte-fondOuverture-caConvention

  const save=async()=>{
    setSaving(true)
    const payload={society_id:societyId,convention_id:convention.id,date,fond_ouverture:fondOuverture,billets,pieces,total_compte:totalCompte,ca_convention:caConvention,notes,updated_at:new Date().toISOString()}
    if(existingId)await supabase.from("caisse_journaliere").update(payload).eq("id",existingId)
    else{const{data}=await supabase.from("caisse_journaliere").insert(payload).select().single();if(data)setExistingId(data.id)}
    setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2000)
  }

  return(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-lg h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">🎪 {convention.nom}</p>
            <h3 className="text-white font-bold text-base flex items-center gap-2"><Wallet size={16}/>Caisse journalière</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-3">
          <label className="text-zinc-500 text-xs font-semibold uppercase tracking-wider shrink-0">Date</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} min={convention.date_debut} max={convention.date_fin}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"/>
          {existingId&&<span className="text-green-400 text-[10px] font-bold">✓ Enregistrée</span>}
        </div>
        <div className="flex border-b border-zinc-800">
          {([["ouverture","🌅 Ouverture"],["fermeture","🌙 Fermeture"]] as const).map(([v,l])=>(
            <button key={v} onClick={()=>setSection(v)} className={`flex-1 py-3 text-sm font-semibold transition-colors ${section===v?"text-orange-400 border-b-2 border-orange-400":"text-zinc-500 hover:text-zinc-300"}`}>{l}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {section==="ouverture"&&(
            <>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Fond de caisse (€)</label>
                <input type="number" min="0" step="0.01" value={fondOuverture} onChange={e=>setFondOuverture(parseFloat(e.target.value)||0)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-lg text-white font-bold focus:outline-none focus:border-orange-500/60"/>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <p className="text-zinc-500 text-[11px] uppercase tracking-wider font-semibold mb-1">CA enregistré ({date})</p>
                <p className="text-orange-400 text-2xl font-black">{caConvention.toFixed(2)}€</p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Notes</label>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Observations..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"/>
              </div>
            </>
          )}
          {section==="fermeture"&&(
            <>
              <div>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Billets</p>
                {BILLETS.map(val=>(
                  <div key={val} className="flex items-center gap-3 mb-2">
                    <div className="w-16 text-center"><span className="text-white font-bold text-sm">{val}€</span></div>
                    <div className="flex items-center gap-2 flex-1">
                      <button onClick={()=>setBillets(p=>({...p,[val]:Math.max(0,(p[val]||0)-1)}))} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center">−</button>
                      <input type="number" min="0" value={billets[val]||0} onChange={e=>setBillets(p=>({...p,[val]:parseInt(e.target.value)||0}))} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none"/>
                      <button onClick={()=>setBillets(p=>({...p,[val]:(p[val]||0)+1}))} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center">+</button>
                    </div>
                    <div className="w-20 text-right"><span className="text-orange-400 text-sm font-bold">{((billets[val]||0)*val).toFixed(0)}€</span></div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-zinc-800"><span className="text-zinc-400 text-sm">Total billets</span><span className="text-white font-bold">{totalBillets.toFixed(2)}€</span></div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Pièces</p>
                {PIECES.map(val=>(
                  <div key={val} className="flex items-center gap-3 mb-2">
                    <div className="w-16 text-center"><span className="text-white font-bold text-sm">{val>=1?`${val}€`:`${Math.round(val*100)}c`}</span></div>
                    <div className="flex items-center gap-2 flex-1">
                      <button onClick={()=>setPieces(p=>({...p,[val]:Math.max(0,(p[val]||0)-1)}))} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center">−</button>
                      <input type="number" min="0" value={pieces[val]||0} onChange={e=>setPieces(p=>({...p,[val]:parseInt(e.target.value)||0}))} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none"/>
                      <button onClick={()=>setPieces(p=>({...p,[val]:(p[val]||0)+1}))} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center">+</button>
                    </div>
                    <div className="w-20 text-right"><span className="text-orange-400 text-sm font-bold">{((pieces[val]||0)*val).toFixed(2)}€</span></div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-zinc-800"><span className="text-zinc-400 text-sm">Total pièces</span><span className="text-white font-bold">{totalPieces.toFixed(2)}€</span></div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Récapitulatif</p>
                {[{label:"Total compté",val:totalCompte,color:"text-white"},{label:"Fond d'ouverture",val:-fondOuverture,color:"text-zinc-400"},{label:"CA système",val:-caConvention,color:"text-orange-400"}].map(({label,val,color})=>(
                  <div key={label} className="flex items-center justify-between"><span className="text-zinc-500 text-sm">{label}</span><span className={`font-bold text-sm ${color}`}>{val>=0?"":"−"}{Math.abs(val).toFixed(2)}€</span></div>
                ))}
                <div className="border-t border-zinc-700 pt-3 flex items-center justify-between">
                  <span className="text-white font-bold">Écart de caisse</span>
                  <span className={`text-xl font-black ${ecart===0?"text-green-400":ecart>0?"text-blue-400":"text-red-400"}`}>{ecart>=0?"+":""}{ecart.toFixed(2)}€</span>
                </div>
                {ecart===0&&totalCompte>0&&<p className="text-green-400 text-xs text-center font-semibold">✓ Caisse équilibrée</p>}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Notes fermeture</label>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Observations..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"/>
              </div>
            </>
          )}
        </div>
        <div className="p-5 border-t border-zinc-800">
          <button onClick={save} disabled={saving} className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${saved?"bg-green-500 text-white":"bg-orange-500 hover:bg-orange-400 text-black disabled:opacity-40"}`}>
            {saved?<><Check size={16}/>Caisse sauvegardée !</>:saving?"Sauvegarde...":<><Wallet size={15}/>Sauvegarder</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* VENTE CONVENTION */
interface CartItem { product_id:string; nom:string; gamme:string; pv_original:number; pv:number; cf:number; quantite:number; stock_qty:number|null }

function VenteConventionPanel({ societyId, profile, convention, onClose, onDone }: {
  societyId:string; profile:any; convention:any; onClose:()=>void; onDone:()=>void
}) {
  const [products,setProducts]=useState<any[]>([])
  const [allStock,setAllStock]=useState<any[]>([])
  const [urssafRate,setUrssafRate]=useState(DEFAULT_URSSAF)
  const [cart,setCart]=useState<CartItem[]>([])
  const [search,setSearch]=useState("")
  const [activeGamme,setActiveGamme]=useState("Convention")
  const [paiement,setPaiement]=useState("Especes")
  const [clientNom,setClientNom]=useState("")
  const [notes,setNotes]=useState("")
  const [saving,setSaving]=useState(false)
  const [success,setSuccess]=useState(false)
  const [view,setView]=useState<"catalogue"|"panier">("catalogue")
  const [loadingProds,setLoadingProds]=useState(true)

  useEffect(()=>{
    const load=async()=>{
      setLoadingProds(true)
      const [{data:prods},{data:stock},{data:cfg}]=await Promise.all([
        supabase.from("products").select("*").eq("society_id",societyId).order("gamme").order("name"),
        supabase.from("stock").select("*").eq("society_id",societyId),
        supabase.from("settings").select("key,value").eq("society_id",societyId).eq("key","urssaf_rate_global").single(),
      ])
      setProducts(prods||[])
      setAllStock(stock||[])
      if(cfg?.value!=null)setUrssafRate(Number(cfg.value))
      setLoadingProds(false)
    }
    load()
  },[societyId])

  const findStock=(productId:string,productName:string)=>
    allStock.find((s:any)=>s.product_id&&s.product_id===productId)||
    allStock.find((s:any)=>s.produit_nom?.toLowerCase().trim()===productName.toLowerCase().trim())

  const filteredProds=products.filter(p=>{
    if(activeGamme!=="Tous"&&p.gamme!==activeGamme)return false
    if(search&&!p.name.toLowerCase().includes(search.toLowerCase()))return false
    return true
  })

  const addToCart=(product:any)=>{
    const si=findStock(product.id,product.name)
    setCart(prev=>{
      const ex=prev.find(i=>i.product_id===product.id)
      if(ex)return prev.map(i=>i.product_id===product.id?{...i,quantite:i.quantite+1}:i)
      return[...prev,{product_id:product.id,nom:product.name,gamme:product.gamme,pv_original:Number(product.pv),pv:Number(product.pv),cf:Number(product.cf||0),quantite:1,stock_qty:si?.quantite??null}]
    })
  }

  const cartCount=cart.reduce((s,i)=>s+i.quantite,0)
  const totalHT=cart.reduce((s,i)=>s+i.pv*i.quantite,0)
  const urssaf=totalHT*urssafRate
  const cfTotal=cart.reduce((s,i)=>s+i.cf*i.quantite,0)
  const resultat=totalHT-urssaf-cfTotal

  const saveVente=async()=>{
    if(!cart.length)return
    setSaving(true)
    try{
      const{data:vente,error}=await supabase.from("ventes").insert({
        society_id:societyId,user_id:profile.id,
        client_nom:clientNom||`Convention ${convention.nom}`,
        total_ht:totalHT,port:0,remise:0,total_ttc:totalHT,
        paiement,notes:notes||`Convention : ${convention.nom}`,
      }).select().single()
      if(error){alert("Erreur : "+error.message);setSaving(false);return}
      if(vente){
        await supabase.from("vente_items").insert(cart.map(i=>({
          vente_id:vente.id,product_id:i.product_id,produit_nom:i.nom,
          gamme:i.gamme,quantite:i.quantite,pv_unitaire:i.pv,
          cf_unitaire:i.cf,total:i.pv*i.quantite,
        })))
        const freshStock=[...allStock]
        for(const item of cart){
          const prod=products.find(p=>p.id===item.product_id)
          let compo:Record<string,number>={}
          if(prod?.composition){compo=typeof prod.composition==="string"?JSON.parse(prod.composition):prod.composition}
          const entries=Object.entries(compo)
          if(entries.length>0){
            for(const[cNom,qpu]of entries){
              const tot=item.quantite*Number(qpu)
              const si=freshStock.find((s:any)=>s.produit_nom?.toLowerCase().trim()===cNom.toLowerCase().trim())
              if(si){
                const nq=si.quantite-tot
                await supabase.from("stock").update({quantite:nq,updated_at:new Date().toISOString()}).eq("id",si.id)
                try{await supabase.from("stock_history").insert({society_id:societyId,product_id:si.product_id,produit_nom:si.produit_nom,user_id:profile.id,action:"Sortie",quantite:tot,quantite_avant:si.quantite,quantite_apres:nq,notes:`Conv "${convention.nom}"`})}catch{}
                si.quantite=nq
              }
            }
          }else{
            const si=freshStock.find((s:any)=>(s.product_id&&s.product_id===item.product_id)||s.produit_nom?.toLowerCase().trim()===item.nom.toLowerCase().trim())
            if(si){
              const nq=si.quantite-item.quantite
              await supabase.from("stock").update({quantite:nq,updated_at:new Date().toISOString()}).eq("id",si.id)
              try{await supabase.from("stock_history").insert({society_id:societyId,product_id:item.product_id,produit_nom:item.nom,user_id:profile.id,action:"Sortie",quantite:item.quantite,quantite_avant:si.quantite,quantite_apres:nq,notes:`Conv "${convention.nom}"`})}catch{}
              si.quantite=nq
            }
          }
        }
        setAllStock(freshStock)
        setCart([]);setClientNom("");setNotes("");setPaiement("Especes")
        setSuccess(true);setView("catalogue")
        setTimeout(()=>{setSuccess(false);onDone()},2000)
      }
    }catch(e){console.error(e);alert("Erreur inattendue")}
    finally{setSaving(false)}
  }

  return(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#0d0d0d] border-l border-zinc-800 w-full max-w-xl h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800" style={{background:"linear-gradient(135deg,rgba(249,115,22,0.12),transparent)"}}>
          <div>
            <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">🎪 {convention.nom}</p>
            <h3 className="text-white font-bold text-base">Nouvelle vente convention</h3>
          </div>
          <div className="flex items-center gap-2">
            {cartCount>0&&(
              <button onClick={()=>setView(v=>v==="catalogue"?"panier":"catalogue")}
                className="flex items-center gap-1.5 bg-orange-500 text-black font-bold px-3 py-2 rounded-xl text-xs">
                <ShoppingCart size={13}/>{view==="catalogue"?`Panier (${cartCount})`:"← Catalogue"}
              </button>
            )}
            <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
          </div>
        </div>

        {/* CATALOGUE */}
        {view==="catalogue"&&(
          <>
            <div className="px-4 py-3 border-b border-zinc-800 space-y-2">
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {GAMMES_ALL.map(g=>(
                  <button key={g} onClick={()=>setActiveGamme(g)}
                    className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all"
                    style={activeGamme===g
                      ?{backgroundColor:(GAMME_COLOR[g]||"#f97316")+"25",borderColor:GAMME_COLOR[g]||"#f97316",color:GAMME_COLOR[g]||"#f97316"}
                      :{backgroundColor:"rgba(24,24,27,0.7)",borderColor:"rgba(63,63,70,0.5)",color:"#71717a"}}>
                    {g}{g!=="Tous"&&` (${products.filter(p=>p.gamme===g).length})`}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                <input type="text" placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50"/>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {loadingProds
                ?<div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"/></div>
                :filteredProds.length===0
                  ?<div className="text-center py-12 text-zinc-600"><Package size={32} className="mx-auto mb-3 opacity-20"/><p className="text-sm">Aucun produit</p></div>
                  :<div className="space-y-1.5">
                    {filteredProds.map(product=>{
                      const inCart=cart.find(i=>i.product_id===product.id)
                      const si=findStock(product.id,product.name)
                      const sqty=si?.quantite??null
                      const sOut=sqty!==null&&sqty<=0
                      const sLow=sqty!==null&&si?.seuil_alerte>0&&sqty<=si.seuil_alerte&&sqty>0
                      const gc=GAMME_COLOR[product.gamme]||"#f97316"
                      return(
                        <button key={product.id} onClick={()=>!sOut&&addToCart(product)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left${sOut?" opacity-50 cursor-not-allowed":""}`}
                          style={inCart?{borderColor:gc+"60",backgroundColor:gc+"12"}:{borderColor:"rgba(63,63,70,0.5)",backgroundColor:"rgba(24,24,27,0.7)"}}>
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{backgroundColor:gc+"20"}}>
                            {product.avatar_url?<img src={product.avatar_url} className="w-full h-full object-cover rounded-lg" alt={product.name}/>:<span className="text-base">{GAMME_EMOJI[product.gamme]||"📦"}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{product.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{backgroundColor:gc+"15",color:gc}}>{product.gamme}</span>
                              <span className="text-zinc-600 text-[10px]">CF:{Number(product.cf||0).toFixed(2)}€</span>
                              {sqty!==null&&<span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${sOut?"bg-red-500/15 text-red-400":sLow?"bg-orange-500/15 text-orange-400":"bg-green-500/10 text-green-400"}`}>{sOut?"Rupture":sLow?`⚠ ${sqty}`:`Stock:${sqty}`}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-base font-black" style={{color:gc}}>{Number(product.pv).toFixed(2)}€</span>
                            {inCart
                              ?<div className="w-7 h-7 rounded-full flex items-center justify-center text-black text-xs font-black" style={{backgroundColor:gc}}>{inCart.quantite}</div>
                              :<div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 hover:border-zinc-500 transition-colors"><Plus size={13}/></div>
                            }
                          </div>
                        </button>
                      )
                    })}
                  </div>
              }
            </div>
            {cartCount>0&&(
              <div className="border-t border-zinc-800 px-4 py-3 flex items-center justify-between bg-zinc-900/80">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={14} className="text-orange-400"/>
                  <span className="text-zinc-300 text-sm">{cartCount} article{cartCount>1?"s":""}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-orange-400 font-black text-lg">{totalHT.toFixed(2)}€</span>
                  <button onClick={()=>setView("panier")} className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1.5">
                    Valider<ChevronDown size={13} className="-rotate-90"/>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* PANIER */}
        {view==="panier"&&(
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Articles ({cartCount})</p>
              {cart.map(item=>{
                const gc=GAMME_COLOR[item.gamme]||"#f97316"
                const prixModif=item.pv!==item.pv_original
                const sqty=item.stock_qty
                const sLow=sqty!==null&&sqty>0&&sqty<=item.quantite
                const sOut=sqty!==null&&sqty<=0
                return(
                  <div key={item.product_id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-white text-sm font-semibold truncate">{item.nom}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{backgroundColor:gc+"15",color:gc}}>{item.gamme}</span>
                          {sqty!==null&&<span className={`text-[9px] font-semibold ${sOut?"text-red-400":sLow?"text-orange-400":"text-green-500"}`}>{sOut?"⚠ Rupture":sLow?`⚠ Stock:${sqty}`:`Stock:${sqty}`}</span>}
                        </div>
                      </div>
                      <button onClick={()=>setCart(p=>p.filter(i=>i.product_id!==item.product_id))} className="text-zinc-700 hover:text-red-400 shrink-0"><X size={13}/></button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-zinc-800 rounded-lg shrink-0">
                        <button onClick={()=>{if(item.quantite<=1)setCart(p=>p.filter(i=>i.product_id!==item.product_id));else setCart(p=>p.map(i=>i.product_id===item.product_id?{...i,quantite:i.quantite-1}:i))}} className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white"><Minus size={11}/></button>
                        <span className="text-white text-sm font-bold w-6 text-center">{item.quantite}</span>
                        <button onClick={()=>setCart(p=>p.map(i=>i.product_id===item.product_id?{...i,quantite:i.quantite+1}:i))} className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white"><Plus size={11}/></button>
                      </div>
                      <div className="flex-1">
                        <div className="relative">
                          <input type="number" step="0.01" min="0" value={item.pv}
                            onChange={e=>setCart(p=>p.map(i=>i.product_id===item.product_id?{...i,pv:parseFloat(e.target.value)||0}:i))}
                            className="w-full bg-zinc-800 border rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none"
                            style={{borderColor:prixModif?"#f97316":"#3f3f46"}}/>
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 text-[10px]">€</span>
                        </div>
                        {prixModif&&(
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-orange-400 text-[9px]">Original:{item.pv_original.toFixed(2)}€</span>
                            <button onClick={()=>setCart(p=>p.map(i=>i.product_id===item.product_id?{...i,pv:i.pv_original}:i))} className="text-zinc-600 hover:text-zinc-300 text-[9px]">↺</button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-black w-16 text-right shrink-0" style={{color:gc}}>{(item.pv*item.quantite).toFixed(2)}€</p>
                    </div>
                  </div>
                )
              })}
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">Client (optionnel)</label>
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                  <input type="text" placeholder="Nom du client..." value={clientNom} onChange={e=>setClientNom(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/40"/>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">Notes</label>
                <input type="text" placeholder="Notes..." value={notes} onChange={e=>setNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">Paiement</label>
                <div className="flex gap-1.5 flex-wrap">
                  {PAIEMENTS_CONV.map(p=>(
                    <button key={p} onClick={()=>setPaiement(p)}
                      className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all min-w-[70px] ${paiement===p?"bg-orange-500 text-black border-orange-500":"bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-1">
                <div className="flex justify-between text-[11px] text-zinc-500"><span>Sous-total</span><span>{totalHT.toFixed(2)}€</span></div>
                <div className="flex justify-between text-[11px] text-zinc-600"><span>URSSAF {(urssafRate*100).toFixed(1)}%</span><span>-{urssaf.toFixed(2)}€</span></div>
                <div className="flex justify-between text-[11px] text-zinc-600"><span>CF total</span><span>-{cfTotal.toFixed(2)}€</span></div>
                <div className={`flex justify-between text-sm font-bold border-t border-zinc-800 pt-1.5 mt-1 ${resultat>=0?"text-green-400":"text-red-400"}`}>
                  <span>Résultat net</span><span>{resultat.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-zinc-800">
                  <span className="text-white font-bold text-sm">Total client</span>
                  <span className="text-orange-400 text-xl font-black">{totalHT.toFixed(2)}€</span>
                </div>
              </div>
              {cart.some(i=>i.stock_qty!==null&&i.stock_qty!==undefined&&i.stock_qty<=i.quantite)&&(
                <div className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/25 rounded-xl px-3 py-2.5">
                  <AlertTriangle size={14} className="text-orange-400 shrink-0 mt-0.5"/>
                  <p className="text-orange-300 text-xs">Attention : certains produits ont un stock faible ou insuffisant.</p>
                </div>
              )}
            </div>
            <div className="border-t border-zinc-800 p-4 space-y-2">
              <button onClick={saveVente} disabled={saving||!cart.length}
                className={`w-full font-black py-4 rounded-xl text-base transition-all flex items-center justify-center gap-2 shadow-lg ${success?"bg-green-500 text-white shadow-green-500/20":"bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-black shadow-orange-500/20"}`}>
                {success?<><Check size={18}/>Vente enregistrée !</>:saving?<div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"/>:<><ShoppingCart size={18}/>Valider · {totalHT.toFixed(2)}€</>}
              </button>
              <button onClick={()=>setView("catalogue")} className="w-full py-2.5 rounded-xl text-zinc-400 font-semibold text-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-800">← Retour au catalogue</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* FORM */
function ConventionForm({ societyId, profile, convention, onClose, onDone }: {
  societyId:string; profile:any; convention?:any; onClose:()=>void; onDone:()=>void
}) {
  const [nom,setNom]=useState(convention?.nom||"")
  const [lieu,setLieu]=useState(convention?.lieu||"")
  const [dateDebut,setDateDebut]=useState(convention?.date_debut||"")
  const [dateFin,setDateFin]=useState(convention?.date_fin||"")
  const [notes,setNotes]=useState(convention?.notes||"")
  const [saving,setSaving]=useState(false)

  const save=async()=>{
    if(!nom.trim()||!dateDebut||!dateFin)return
    setSaving(true)
    const data:any={society_id:societyId,nom:nom.trim(),lieu:lieu||null,date_debut:dateDebut,date_fin:dateFin,notes:notes||null,statut:"planifiee"}
    let err=null
    if(convention?.id){const{error}=await supabase.from("conventions").update(data).eq("id",convention.id);err=error}
    else{const{error}=await supabase.from("conventions").insert(data);err=error}
    setSaving(false)
    if(err){alert("Erreur: "+err.message);return}
    onDone();onClose()
  }

  return(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white">{convention?"Modifier":"Nouvelle"} convention</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          {[{label:"Nom *",value:nom,set:setNom,placeholder:"Ex: Japan Expo 2025"},{label:"Lieu",value:lieu,set:setLieu,placeholder:"Ex: Paris Le Bourget"}].map(({label,value,set,placeholder})=>(
            <div key={label}>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
              <input type="text" value={value} onChange={e=>set(e.target.value)} placeholder={placeholder}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/60"/>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {[{label:"Date début *",value:dateDebut,set:setDateDebut},{label:"Date fin *",value:dateFin,set:setDateFin}].map(({label,value,set})=>(
              <div key={label}>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
                <input type="date" value={value} onChange={e=>set(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/60"/>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Infos sur la convention..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"/>
          </div>
        </div>
        <div className="p-6 border-t border-zinc-800 flex gap-3">
          <button onClick={save} disabled={saving||!nom.trim()||!dateDebut||!dateFin} className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm">
            {saving?"Sauvegarde...":convention?"Modifier":"Créer"}
          </button>
          <button onClick={onClose} className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* MAIN */
export default function ConventionModule({ activeSociety, profile }: Props) {
  const [conventions,setConventions]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [showForm,setShowForm]=useState(false)
  const [editConv,setEditConv]=useState<any>(null)
  const [venteConv,setVenteConv]=useState<any>(null)
  const [caisseConv,setCaisseConv]=useState<any>(null)
  const [filter,setFilter]=useState<"all"|"active"|"upcoming"|"past">("all")

  const load=useCallback(async()=>{
    if(!activeSociety?.id)return
    setLoading(true)
    const{data}=await supabase.from("conventions").select("*").eq("society_id",activeSociety.id).order("date_debut",{ascending:false})
    setConventions(data||[])
    setLoading(false)
  },[activeSociety?.id])

  useEffect(()=>{load()},[load])

  const del=async(id:string)=>{
    if(!confirm("Supprimer cette convention ?"))return
    await supabase.from("conventions").delete().eq("id",id);load()
  }

  const todayStr=new Date().toISOString().split("T")[0]

  const filtered=conventions.filter(c=>{
    if(filter==="all")return true
    const debut=(c.date_debut||"").slice(0,10);const fin=(c.date_fin||"").slice(0,10)
    if(filter==="active")return debut<=todayStr&&fin>=todayStr
    if(filter==="upcoming")return debut>todayStr
    if(filter==="past")return fin<todayStr
    return true
  })

  const activeNow=conventions.find(c=>{
    const debut=(c.date_debut||"").slice(0,10);const fin=(c.date_fin||"").slice(0,10)
    return debut<=todayStr&&fin>=todayStr
  })

  return(
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">🎪 Conventions</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{conventions.length} convention{conventions.length>1?"s":""}</p>
          </div>
          <button onClick={()=>setShowForm(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-orange-500/20">
            <Plus size={16}/>Nouvelle convention
          </button>
        </div>

        {activeNow&&(
          <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"/><p className="text-orange-400 text-sm font-bold uppercase tracking-wider">Convention en cours</p></div>
                <h2 className="text-white text-xl font-bold mb-1">{activeNow.nom}</h2>
                {activeNow.lieu&&<p className="text-zinc-400 text-sm">📍 {activeNow.lieu}</p>}
                <p className="text-zinc-500 text-xs mt-1">{new Date(activeNow.date_debut+"T00:00:00").toLocaleDateString("fr-FR")} → {new Date(activeNow.date_fin+"T00:00:00").toLocaleDateString("fr-FR")}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={()=>setCaisseConv(activeNow)} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm border border-zinc-700"><Wallet size={15}/>Caisse</button>
                <button onClick={()=>setVenteConv(activeNow)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm"><ShoppingCart size={15}/>Vendre</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-5 flex-wrap">
          {[{id:"all",label:"Toutes"},{id:"active",label:"🟢 En cours"},{id:"upcoming",label:"🔵 À venir"},{id:"past",label:"⚫ Passées"}].map(f=>(
            <button key={f.id} onClick={()=>setFilter(f.id as any)} className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${filter===f.id?"bg-orange-500 text-black border-orange-500":"bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"}`}>{f.label}</button>
          ))}
        </div>

        {loading
          ?<div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"/></div>
          :filtered.length===0
            ?<div className="text-center py-24 text-zinc-600"><p className="text-5xl mb-4">🎪</p><p className="text-sm">Aucune convention</p></div>
            :<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(c=>{
                const debut=(c.date_debut||"").slice(0,10);const fin=(c.date_fin||"").slice(0,10)
                const isActive=debut<=todayStr&&fin>=todayStr
                const isUpcoming=debut>todayStr
                const isPast=fin<todayStr
                const daysUntil=isUpcoming?Math.ceil((new Date(debut).getTime()-Date.now())/86400000):0
                const duration=debut&&fin?Math.ceil((new Date(fin+"T00:00:00").getTime()-new Date(debut+"T00:00:00").getTime())/86400000)+1:0
                return(
                  <div key={c.id} className={`bg-zinc-900 border rounded-2xl p-5 ${isActive?"border-orange-500/40":"border-zinc-800"}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-white font-bold">{c.nom}</h3>
                          {isActive&&<span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-1.5 py-0.5 rounded-full animate-pulse">En cours</span>}
                          {isUpcoming&&<span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 border border-blue-400/20 px-1.5 py-0.5 rounded-full">J-{daysUntil}</span>}
                          {isPast&&<span className="text-[10px] font-bold text-zinc-500 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded-full">Terminée</span>}
                        </div>
                        {c.lieu&&<p className="text-zinc-500 text-xs">📍 {c.lieu}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isActive&&(
                          <>
                            <button onClick={()=>setCaisseConv(c)} className="flex items-center gap-1 text-[11px] font-bold text-white bg-zinc-800 border border-zinc-700 px-2 py-1.5 rounded-lg hover:bg-zinc-700"><Wallet size={11}/>Caisse</button>
                            <button onClick={()=>setVenteConv(c)} className="flex items-center gap-1 text-[11px] font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-1.5 rounded-lg hover:bg-orange-400/20"><ShoppingCart size={11}/>Vendre</button>
                          </>
                        )}
                        <button onClick={()=>{setEditConv(c);setShowForm(true)}} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"><Pencil size={13}/></button>
                        <button onClick={()=>del(c.id)} className="p-1.5 text-red-500 hover:text-red-400 rounded-lg hover:bg-red-500/10"><Trash2 size={13}/></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-800 rounded-xl px-3 py-2">
                        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">Début</p>
                        <p className="text-white font-semibold text-xs">{debut?new Date(debut+"T00:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"}):"—"}</p>
                      </div>
                      <div className="bg-zinc-800 rounded-xl px-3 py-2">
                        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">Fin</p>
                        <p className="text-white font-semibold text-xs">{fin?new Date(fin+"T00:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"}):"—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                      {duration>0&&<span>📅 {duration}j</span>}
                      {c.notes&&<span className="italic truncate">{c.notes}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
        }
      </div>

      {showForm&&<ConventionForm societyId={activeSociety.id} profile={profile} convention={editConv} onClose={()=>{setShowForm(false);setEditConv(null)}} onDone={load}/>}
      {venteConv&&<VenteConventionPanel societyId={activeSociety.id} profile={profile} convention={venteConv} onClose={()=>setVenteConv(null)} onDone={load}/>}
      {caisseConv&&<CaissePanel societyId={activeSociety.id} convention={caisseConv} onClose={()=>setCaisseConv(null)}/>}
    </div>
  )
}