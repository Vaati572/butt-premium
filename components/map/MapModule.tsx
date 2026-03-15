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

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  prospect:  { label: "Prospects",  color: "#3b82f6", icon: "🎯" },
  client:    { label: "Clients",    color: "#eab308", icon: "👤" },
  pharmacie: { label: "Pharmacies", color: "#22c55e", icon: "🏥" },
}

declare global {
  interface Window { L: any }
}

export default function MapModule({ activeSociety, profile, focusProspect, activeTournee, onClearFocus }: Props) {
  const mapRef     = useRef<HTMLDivElement>(null)
  const mapInst    = useRef<any>(null)
  const markers    = useRef<any[]>([])
  const [items, setItems]       = useState<MapItem[]>([])
  const [selected, setSelected] = useState<MapItem|null>(null)
  const [search, setSearch]     = useState("")
  const [layers, setLayers]     = useState({ prospect: true, client: true, pharmacie: true })
  const [loading, setLoading]   = useState(true)
  const [mapReady, setMapReady] = useState(false)

  // Load Leaflet from CDN
  useEffect(() => {
    const loadLeaflet = () => {
      if (window.L) { setMapReady(true); return }

      // CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      // JS
      const script = document.createElement("script")
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      script.onload = () => setMapReady(true)
      document.head.appendChild(script)
    }

    loadLeaflet()
  }, [])

  // Init map once Leaflet is ready
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInst.current) return

    const L = window.L
    const map = L.map(mapRef.current, { center: [46.8566, 2.3522], zoom: 6 })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map)

    mapInst.current = map
  }, [mapReady])

  // Load data
  const loadData = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const [{ data: prospects }, { data: clients }, { data: pharmacies }] = await Promise.all([
      supabase.from("prospects").select("id,nom,entreprise,latitude,longitude,adresse,ville,tel,statut")
        .eq("society_id", activeSociety.id).not("latitude","is",null).not("longitude","is",null),
      supabase.from("clients").select("id,nom,prenom,latitude,longitude,adresse,ville,telephone")
        .eq("society_id", activeSociety.id).not("latitude","is",null).not("longitude","is",null),
      supabase.from("pharmacies").select("id,nom,latitude,longitude,adresse,ville,telephone")
        .eq("society_id", activeSociety.id).not("latitude","is",null).not("longitude","is",null),
    ])
    const all: MapItem[] = [
      ...(prospects||[]).map((p:any) => ({ id:p.id, type:"prospect" as const, nom:p.entreprise||p.nom, lat:p.latitude, lng:p.longitude, adresse:p.adresse, ville:p.ville, telephone:p.tel, statut:p.statut, color:"#3b82f6", icon:"🎯" })),
      ...(clients||[]).map((c:any) => ({ id:c.id, type:"client" as const, nom:c.prenom?`${c.prenom} ${c.nom}`:c.nom, lat:c.latitude, lng:c.longitude, adresse:c.adresse, ville:c.ville, telephone:c.telephone, color:"#eab308", icon:"👤" })),
      ...(pharmacies||[]).map((p:any) => ({ id:p.id, type:"pharmacie" as const, nom:p.nom, lat:p.latitude, lng:p.longitude, adresse:p.adresse, ville:p.ville, telephone:p.telephone, color:"#22c55e", icon:"🏥" })),
    ]
    setItems(all)
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { loadData() }, [loadData])

  // Update markers
  useEffect(() => {
    if (!mapInst.current || !window.L) return
    const L = window.L

    // Remove old
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
        html: `<div style="width:34px;height:34px;border-radius:50%;background:${item.color};border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;">${item.icon}</div>`,
        className: "",
        iconSize: [34,34],
        iconAnchor: [17,34],
      })
      const marker = L.marker([item.lat, item.lng], { icon })
        .addTo(mapInst.current)
        .on("click", () => setSelected(item))
      markers.current.push(marker)
    })

    if (filtered.length > 0) {
      try {
        const group = L.featureGroup(markers.current)
        mapInst.current.fitBounds(group.getBounds().pad(0.15))
      } catch {}
    }
  }, [items, layers, search, mapReady])

  // Focus prospect
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
        <div className="flex items-center gap-1 bg-zinc-800/60 rounded-xl p-1 flex-wrap">
          <span className="text-zinc-500 text-xs px-1 flex items-center gap-1"><Filter size={11}/> Couches</span>
          {(Object.entries(TYPE_CONFIG) as [string, any][]).map(([key, cfg]) => {
            const count = items.filter(i => i.type===key).length
            const active = layers[key as keyof typeof layers]
            return (
              <button key={key} onClick={()=>setLayers(p=>({...p,[key]:!p[key as keyof typeof layers]}))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active?"text-black":"text-zinc-500 opacity-50"}`}
                style={active?{backgroundColor:cfg.color}:{}}>
                {active?<Eye size={11}/>:<EyeOff size={11}/>}
                {cfg.icon} {cfg.label} ({count})
              </button>
            )
          })}
        </div>
        <p className="text-zinc-600 text-xs">{visibleCount} visible{visibleCount>1?"s":""}</p>
      </div>

      {/* Map container */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={mapRef} className="w-full h-full" style={{zIndex:1}}/>

        {/* Loading */}
        {(!mapReady || loading) && (
          <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center z-10">
            <div className="flex items-center gap-3 text-zinc-400">
              <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
              <span className="text-sm">Chargement de la carte...</span>
            </div>
          </div>
        )}

        {/* No data */}
        {mapReady && !loading && items.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#111111] border border-zinc-700 rounded-xl px-5 py-3 z-10 shadow-xl text-center">
            <p className="text-zinc-300 text-sm font-semibold">📍 Aucune adresse géolocalisée</p>
            <p className="text-zinc-600 text-xs mt-1">Ajoute latitude/longitude sur tes fiches clients, pharmacies et prospects</p>
          </div>
        )}

        {/* Selected info panel */}
        {selected && (
          <div className="absolute right-3 top-3 w-72 bg-[#111111] border border-zinc-700 rounded-2xl shadow-2xl z-10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800"
              style={{background:`linear-gradient(135deg,${selected.color}25,transparent)`}}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{selected.icon}</span>
                <div>
                  <p className="text-white font-bold text-sm">{selected.nom}</p>
                  <p className="text-xs font-semibold" style={{color:selected.color}}>{TYPE_CONFIG[selected.type].label}</p>
                </div>
              </div>
              <button onClick={()=>setSelected(null)} className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800"><X size={15}/></button>
            </div>
            <div className="p-4 space-y-2">
              {(selected.adresse||selected.ville) && (
                <div className="flex items-start gap-2">
                  <MapPin size={13} className="text-zinc-500 mt-0.5 shrink-0"/>
                  <p className="text-zinc-300 text-xs">{[selected.adresse,selected.ville].filter(Boolean).join(", ")}</p>
                </div>
              )}
              {selected.telephone && (
                <a href={`tel:${selected.telephone}`} className="flex items-center gap-2 hover:text-white">
                  <Phone size={13} className="text-zinc-500 shrink-0"/>
                  <p className="text-zinc-300 text-xs">{selected.telephone}</p>
                </a>
              )}
              {selected.statut && <p className="text-zinc-500 text-xs">Statut : <span className="text-zinc-300">{selected.statut}</span></p>}
              <div className="flex gap-2 pt-1">
                <button onClick={()=>mapInst.current?.setView([selected.lat,selected.lng],16)}
                  className="flex-1 text-xs py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold flex items-center justify-center gap-1">
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