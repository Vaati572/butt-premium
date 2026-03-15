"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Search, Eye, EyeOff, MapPin, Phone, X, Navigation, Filter, ChevronDown } from "lucide-react"

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

const PROSPECT_STATUTS: Record<string, { label: string; color: string }> = {
  a_faire:   { label: "À faire",    color: "#3b82f6" },
  demarchee: { label: "Démarchée",  color: "#f97316" },
  attente:   { label: "En attente", color: "#eab308" },
  converti:  { label: "Converti",   color: "#22c55e" },
  perdu:     { label: "Perdu",      color: "#ef4444" },
}
const getProspectColor = (statut?: string) => PROSPECT_STATUTS[statut || "a_faire"]?.color || "#3b82f6"

const TYPE_BASE_COLOR: Record<string, string> = {
  prospect:  "#3b82f6",
  client:    "#eab308",
  pharmacie: "#22c55e",
}

declare global { interface Window { L: any } }

export default function MapModule({ activeSociety, profile, focusProspect, onClearFocus }: Props) {
  const mapRef  = useRef<HTMLDivElement>(null)
  const mapInst = useRef<any>(null)
  const markers = useRef<any[]>([])

  const [items, setItems]       = useState<MapItem[]>([])
  const [selected, setSelected] = useState<MapItem|null>(null)
  const [search, setSearch]     = useState("")
  const [loading, setLoading]   = useState(true)
  const [mapReady, setMapReady] = useState(false)

  // Layer toggles: type + statut prospects
  const [showTypes, setShowTypes]   = useState({ prospect: true, client: true, pharmacie: true })
  const [showStatuts, setShowStatuts] = useState<Record<string,boolean>>(
    Object.fromEntries(Object.keys(PROSPECT_STATUTS).map(k => [k, true]))
  )
  const [showFilters, setShowFilters] = useState(false)

  // Load Leaflet CDN
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

  // Load data — clients sans filtre lat/lng (on filtre côté JS)
  const loadData = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const [{ data: prospects }, { data: clients }, { data: pharmacies }] = await Promise.all([
      supabase.from("prospects")
        .select("id,nom,entreprise,latitude,longitude,adresse,ville,tel,statut")
        .eq("society_id", activeSociety.id),
      supabase.from("clients")
        .select("id,nom,prenom,latitude,longitude,adresse,ville,telephone,contrat")
        .eq("society_id", activeSociety.id),
      supabase.from("pharmacies")
        .select("id,nom,latitude,longitude,adresse,ville,telephone")
        .eq("society_id", activeSociety.id),
    ])

    const all: MapItem[] = []

    // Prospects avec lat/lng
    ;(prospects||[]).forEach((p:any) => {
      if (!p.latitude || !p.longitude) return
      all.push({
        id: p.id, type: "prospect",
        nom: p.entreprise || p.nom,
        lat: p.latitude, lng: p.longitude,
        adresse: p.adresse, ville: p.ville, telephone: p.tel,
        statut: p.statut,
        color: getProspectColor(p.statut), icon: "🎯",
      })
    })

    // Clients avec lat/lng
    ;(clients||[]).forEach((c:any) => {
      if (!c.latitude || !c.longitude) return
      all.push({
        id: c.id, type: "client",
        nom: c.prenom ? `${c.prenom} ${c.nom}` : c.nom,
        lat: c.latitude, lng: c.longitude,
        adresse: c.adresse, ville: c.ville, telephone: c.telephone,
        statut: c.contrat,
        color: "#eab308", icon: "👤",
      })
    })

    // Pharmacies avec lat/lng
    ;(pharmacies||[]).forEach((p:any) => {
      if (!p.latitude || !p.longitude) return
      all.push({
        id: p.id, type: "pharmacie",
        nom: p.nom, lat: p.latitude, lng: p.longitude,
        adresse: p.adresse, ville: p.ville, telephone: p.telephone,
        color: "#22c55e", icon: "🏥",
      })
    })

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
      if (!showTypes[item.type]) return false
      // Filter prospects by statut
      if (item.type === "prospect" && item.statut && !showStatuts[item.statut]) return false
      if (search) {
        const s = search.toLowerCase()
        if (!item.nom.toLowerCase().includes(s) && !item.ville?.toLowerCase().includes(s)) return false
      }
      return true
    })

    filtered.forEach(item => {
      const icon = L.divIcon({
        html: `<div style="width:36px;height:36px;border-radius:50%;background:${item.color};border:3px solid white;box-shadow:0 2px 12px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;">${item.icon}</div>`,
        className: "", iconSize: [36,36], iconAnchor: [18,36],
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
  }, [items, showTypes, showStatuts, search, mapReady])

  useEffect(() => {
    if (!focusProspect || !mapInst.current) return
    const item = items.find(i => i.id === focusProspect.id)
    if (item) { mapInst.current.setView([item.lat, item.lng], 15); setSelected(item) }
  }, [focusProspect, items])

  const counts = {
    prospect:  items.filter(i => i.type==="prospect").length,
    client:    items.filter(i => i.type==="client").length,
    pharmacie: items.filter(i => i.type==="pharmacie").length,
  }
  const visibleCount = items.filter(i =>
    showTypes[i.type] && (i.type !== "prospect" || !i.statut || showStatuts[i.statut])
  ).length

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-zinc-800 bg-[#111111] flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
        </div>

        {/* Filtres toggle */}
        <button onClick={()=>setShowFilters(p=>!p)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${showFilters?"bg-yellow-500 text-black border-yellow-500":"bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500"}`}>
          <Filter size={12}/> Filtres <ChevronDown size={12} className={`transition-transform ${showFilters?"rotate-180":""}`}/>
        </button>

        <p className="text-zinc-600 text-xs">{visibleCount} ping{visibleCount>1?"s":""}</p>
      </div>

      {/* Panneau filtres */}
      {showFilters && (
        <div className="bg-[#0d0d0d] border-b border-zinc-800 px-4 py-3 space-y-3">
          {/* Types */}
          <div>
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider mb-2">Afficher</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(counts) as [string,number][]).map(([type, count]) => {
                const active = showTypes[type as keyof typeof showTypes]
                const cfg = { prospect: {icon:"🎯",label:"Prospects"}, client: {icon:"👤",label:"Clients"}, pharmacie: {icon:"🏥",label:"Pharmacies"} }[type]!
                return (
                  <button key={type} onClick={()=>setShowTypes(p=>({...p,[type]:!p[type as keyof typeof p]}))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${active?"text-black border-transparent":"text-zinc-500 border-zinc-800 opacity-60"}`}
                    style={active?{backgroundColor:TYPE_BASE_COLOR[type]}:{}}>
                    {active?<Eye size={11}/>:<EyeOff size={11}/>}
                    {cfg.icon} {cfg.label} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          {/* Statuts prospects */}
          {showTypes.prospect && (
            <div>
              <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider mb-2">Statuts prospects</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(PROSPECT_STATUTS).map(([key, cfg]) => {
                  const active = showStatuts[key]
                  const cnt = items.filter(i=>i.type==="prospect"&&i.statut===key).length
                  return (
                    <button key={key} onClick={()=>setShowStatuts(p=>({...p,[key]:!p[key]}))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${active?"text-black border-transparent":"text-zinc-500 border-zinc-800 opacity-60"}`}
                      style={active?{backgroundColor:cfg.color}:{}}>
                      {active?<Eye size={11}/>:<EyeOff size={11}/>}
                      {cfg.label} ({cnt})
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={mapRef} className="w-full h-full" style={{zIndex:1}}/>

        {(!mapReady||loading) && (
          <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center z-10">
            <div className="flex items-center gap-3 text-zinc-400">
              <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
              <span className="text-sm">Chargement...</span>
            </div>
          </div>
        )}

        {mapReady && !loading && items.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#111111] border border-zinc-700 rounded-xl px-5 py-3 z-10 shadow-xl text-center">
            <p className="text-zinc-300 text-sm font-semibold">📍 Aucune adresse géolocalisée</p>
            <p className="text-zinc-600 text-xs mt-1">Ajoute latitude/longitude sur tes fiches clients, pharmacies et prospects</p>
          </div>
        )}

        {/* Info panel — fond noir total */}
        {selected && (
          <div className="absolute right-3 top-3 w-72 rounded-2xl shadow-2xl z-10 overflow-hidden"
            style={{backgroundColor:"#000000", border:`1px solid ${selected.color}50`}}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5"
              style={{background:`linear-gradient(135deg,${selected.color}25,${selected.color}08)`}}>
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{selected.icon}</span>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">{selected.nom}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor:selected.color}}/>
                    <p className="text-[11px] font-semibold capitalize" style={{color:selected.color}}>
                      {selected.type === "prospect"
                        ? (PROSPECT_STATUTS[selected.statut||""]?.label || selected.statut || "Prospect")
                        : selected.statut || { client:"Client", pharmacie:"Pharmacie" }[selected.type]}
                    </p>
                  </div>
                </div>
              </div>
              <button onClick={()=>setSelected(null)} className="text-zinc-600 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"><X size={15}/></button>
            </div>
            <div className="p-4 space-y-2.5" style={{backgroundColor:"#000000"}}>
              {(selected.adresse||selected.ville) && (
                <div className="flex items-start gap-2">
                  <MapPin size={13} className="text-zinc-500 mt-0.5 shrink-0"/>
                  <p className="text-zinc-300 text-xs">{[selected.adresse,selected.ville].filter(Boolean).join(", ")}</p>
                </div>
              )}
              {selected.telephone && (
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-zinc-500 shrink-0"/>
                  <p className="text-zinc-300 text-xs">{selected.telephone}</p>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={()=>mapInst.current?.setView([selected.lat,selected.lng],16)}
                  className="flex-1 text-xs py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold flex items-center justify-center gap-1 border border-zinc-800 transition-colors">
                  <Navigation size={12}/> Centrer
                </button>
                {selected.telephone && (
                  <a href={`tel:${selected.telephone}`}
                    className="flex-1 text-xs py-2 rounded-xl flex items-center justify-center gap-1 font-semibold text-black transition-opacity hover:opacity-90"
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