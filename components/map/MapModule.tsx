"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Search, Eye, EyeOff, MapPin, Phone, X, Navigation, Filter } from "lucide-react"

interface Props {
  activeSociety: any
  profile: any
  focusProspect?: any
  activeTournee?: any
  onClearFocus?: () => void
  onSwitchToProspects?: () => void
}

interface MapItem {
  id: string
  nom: string
  type: "prospect" | "client" | "pharmacie"
  lat: number
  lng: number
  adresse?: string
  ville?: string
  telephone?: string
  statut?: string
  color: string
  icon: string
}

// Couleurs statuts prospects
const PROSPECT_STATUT_COLORS: Record<string, string> = {
  a_faire:   "#3b82f6", // bleu
  demarchee: "#f97316", // orange
  attente:   "#eab308", // jaune
  converti:  "#22c55e", // vert
  perdu:     "#ef4444", // rouge
}
const getProspectColor = (statut?: string) => PROSPECT_STATUT_COLORS[statut || "a_faire"] || "#3b82f6"

const TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  prospect:  { label: "Prospects",  icon: "🎯" },
  client:    { label: "Clients",    icon: "👤" },
  pharmacie: { label: "Pharmacies", icon: "🏥" },
}

// Couleur fixe par type (pour la légende)
const TYPE_COLOR: Record<string, string> = {
  prospect:  "#3b82f6",
  client:    "#eab308",
  pharmacie: "#22c55e",
}

declare global { interface Window { L: any } }

export default function MapModule({ activeSociety, profile, focusProspect, activeTournee, onClearFocus }: Props) {
  const mapRef    = useRef<HTMLDivElement>(null)
  const mapInst   = useRef<any>(null)
  const markers   = useRef<any[]>([])
  const [items, setItems]       = useState<MapItem[]>([])
  const [selected, setSelected] = useState<MapItem|null>(null)
  const [search, setSearch]     = useState("")
  const [layers, setLayers]     = useState({ prospect: true, client: true, pharmacie: true })
  const [loading, setLoading]   = useState(true)
  const [mapReady, setMapReady] = useState(false)

  // Load Leaflet from CDN
  useEffect(() => {
    if (window.L) { setMapReady(true); return }
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link")
      link.id = "leaflet-css"; link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)
    }
    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.onload = () => setMapReady(true)
    document.head.appendChild(script)
  }, [])

  // Init map
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInst.current) return
    const L = window.L
    const map = L.map(mapRef.current, { center: [46.8566, 2.3522], zoom: 6 })
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap", maxZoom: 19,
    }).addTo(map)
    mapInst.current = map
  }, [mapReady])

  // Load data
  const loadData = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const [{ data: prospects }, { data: clients }, { data: pharmacies }] = await Promise.all([
      supabase.from("prospects")
        .select("id,nom,entreprise,latitude,longitude,adresse,ville,tel,statut")
        .eq("society_id", activeSociety.id)
        .not("latitude","is",null).not("longitude","is",null),
      supabase.from("clients")
        .select("id,nom,prenom,latitude,longitude,adresse,ville,telephone,contrat")
        .eq("society_id", activeSociety.id)
        .not("latitude","is",null).not("longitude","is",null),
      supabase.from("pharmacies")
        .select("id,nom,latitude,longitude,adresse,ville,telephone")
        .eq("society_id", activeSociety.id)
        .not("latitude","is",null).not("longitude","is",null),
    ])
    const all: MapItem[] = [
      ...(prospects||[]).map((p:any) => ({
        id: p.id, type: "prospect" as const,
        nom: p.entreprise || p.nom,
        lat: p.latitude, lng: p.longitude,
        adresse: p.adresse, ville: p.ville, telephone: p.tel,
        statut: p.statut,
        color: getProspectColor(p.statut), // couleur selon statut
        icon: "🎯",
      })),
      ...(clients||[]).map((c:any) => ({
        id: c.id, type: "client" as const,
        nom: c.prenom ? `${c.prenom} ${c.nom}` : c.nom,
        lat: c.latitude, lng: c.longitude,
        adresse: c.adresse, ville: c.ville, telephone: c.telephone,
        statut: c.contrat,
        color: "#eab308", icon: "👤",
      })),
      ...(pharmacies||[]).map((p:any) => ({
        id: p.id, type: "pharmacie" as const,
        nom: p.nom, lat: p.latitude, lng: p.longitude,
        adresse: p.adresse, ville: p.ville, telephone: p.telephone,
        color: "#22c55e", icon: "🏥",
      })),
    ]
    setItems(all)
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { loadData() }, [loadData])

  // Update markers
  useEffect(() => {
    if (!mapInst.current || !window.L) return
    const L = window.L
    markers.current.forEach(m => m.remove())
    markers.current = []

    const filtered = items.filter(item => {
      if (!layers[item.type]) return false
      if (search) {
        const s = search.toLowerCase()
        if (!item.nom.toLowerCase().includes(s) && !item.ville?.toLowerCase().includes(s)) return false
      }
      return true
    })

    filtered.forEach(item => {
      const icon = L.divIcon({
        html: `<div style="
          width:36px;height:36px;border-radius:50%;
          background:${item.color};
          border:3px solid white;
          box-shadow:0 2px 12px rgba(0,0,0,0.5);
          display:flex;align-items:center;justify-content:center;
          font-size:16px;cursor:pointer;
          transition:transform 0.15s;
        ">${item.icon}</div>`,
        className: "",
        iconSize: [36,36],
        iconAnchor: [18,36],
      })
      const marker = L.marker([item.lat, item.lng], { icon })
        .addTo(mapInst.current)
        .on("click", () => setSelected(item))
      markers.current.push(marker)
    })

    if (filtered.length > 0 && markers.current.length > 0) {
      try {
        const group = L.featureGroup(markers.current)
        mapInst.current.fitBounds(group.getBounds().pad(0.15))
      } catch {}
    }
  }, [items, layers, search, mapReady])

  useEffect(() => {
    if (!focusProspect || !mapInst.current) return
    const item = items.find(i => i.id === focusProspect.id)
    if (item) { mapInst.current.setView([item.lat, item.lng], 15); setSelected(item) }
  }, [focusProspect, items])

  const visibleCount = items.filter(i => layers[i.type]).length

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-zinc-800 bg-[#111111] flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
        </div>

        {/* Layer toggles */}
        <div className="flex items-center gap-1 bg-zinc-800/60 rounded-xl p-1">
          <span className="text-zinc-500 text-xs px-1 flex items-center gap-1"><Filter size={11}/> Couches</span>
          {(Object.entries(TYPE_CONFIG) as [string,any][]).map(([key, cfg]) => {
            const count = items.filter(i=>i.type===key).length
            const active = layers[key as keyof typeof layers]
            return (
              <button key={key} onClick={()=>setLayers(p=>({...p,[key]:!p[key as keyof typeof layers]}))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active?"text-black":"text-zinc-500 opacity-50"}`}
                style={active?{backgroundColor:TYPE_COLOR[key]}:{}}>
                {active?<Eye size={11}/>:<EyeOff size={11}/>}
                {cfg.icon} {cfg.label} ({count})
              </button>
            )
          })}
        </div>

        <p className="text-zinc-600 text-xs">{visibleCount} visible{visibleCount>1?"s":""}</p>
      </div>

      {/* Légende statuts prospects */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#0d0d0d] border-b border-zinc-800/50 flex-wrap">
        <span className="text-zinc-600 text-[10px] font-semibold uppercase tracking-wider">Prospects :</span>
        {Object.entries(PROSPECT_STATUT_COLORS).map(([statut, color]) => (
          <div key={statut} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border border-white/30" style={{backgroundColor:color}}/>
            <span className="text-zinc-500 text-[10px] capitalize">{statut.replace("_"," ")}</span>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={mapRef} className="w-full h-full" style={{zIndex:1}}/>

        {(!mapReady||loading) && (
          <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center z-10">
            <div className="flex items-center gap-3 text-zinc-400">
              <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
              <span className="text-sm">Chargement de la carte...</span>
            </div>
          </div>
        )}

        {mapReady && !loading && items.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#111111] border border-zinc-700 rounded-xl px-5 py-3 z-10 shadow-xl text-center">
            <p className="text-zinc-300 text-sm font-semibold">📍 Aucune adresse géolocalisée</p>
            <p className="text-zinc-600 text-xs mt-1">Ajoute latitude/longitude sur tes fiches clients, pharmacies et prospects</p>
          </div>
        )}

        {/* Info panel — fond noir opaque */}
        {selected && (
          <div className="absolute right-3 top-3 w-72 rounded-2xl shadow-2xl z-10 overflow-hidden"
            style={{ backgroundColor: "#000000", border: `1px solid ${selected.color}40` }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5"
              style={{ background: `linear-gradient(135deg,${selected.color}30,${selected.color}10)` }}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{selected.icon}</span>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">{selected.nom}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2.5 h-2.5 rounded-full border border-white/30" style={{backgroundColor:selected.color}}/>
                    <p className="text-xs font-semibold" style={{color:selected.color}}>
                      {TYPE_CONFIG[selected.type].label}
                      {selected.statut && ` · ${selected.statut.replace("_"," ")}`}
                    </p>
                  </div>
                </div>
              </div>
              <button onClick={()=>setSelected(null)} className="text-zinc-500 hover:text-white p-1 rounded hover:bg-white/10"><X size={15}/></button>
            </div>
            <div className="p-4 space-y-2.5" style={{backgroundColor:"#000000"}}>
              {(selected.adresse||selected.ville) && (
                <div className="flex items-start gap-2">
                  <MapPin size={13} className="text-zinc-500 mt-0.5 shrink-0"/>
                  <p className="text-zinc-300 text-xs">{[selected.adresse,selected.ville].filter(Boolean).join(", ")}</p>
                </div>
              )}
              {selected.telephone && (
                <a href={`tel:${selected.telephone}`} className="flex items-center gap-2 hover:text-white group">
                  <Phone size={13} className="text-zinc-500 shrink-0"/>
                  <p className="text-zinc-300 text-xs group-hover:text-white transition-colors">{selected.telephone}</p>
                </a>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={()=>mapInst.current?.setView([selected.lat,selected.lng],16)}
                  className="flex-1 text-xs py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold flex items-center justify-center gap-1 border border-zinc-800">
                  <Navigation size={12}/> Centrer
                </button>
                {selected.telephone && (
                  <a href={`tel:${selected.telephone}`}
                    className="flex-1 text-xs py-2 rounded-xl flex items-center justify-center gap-1 font-semibold text-black"
                    style={{backgroundColor:selected.color}}>
                    <Phone size={12}/> Appeler
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}