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
  email?: string
  statut?: string
  color: string
  icon: string
}

const TYPE_CONFIG = {
  prospect:  { label: "Prospects",  color: "#3b82f6", icon: "🎯", defaultShow: true },
  client:    { label: "Clients",    color: "#eab308", icon: "👤", defaultShow: true },
  pharmacie: { label: "Pharmacies", color: "#22c55e", icon: "🏥", defaultShow: true },
}

export default function MapModule({ activeSociety, profile, focusProspect, activeTournee, onClearFocus, onSwitchToProspects }: Props) {
  const mapRef      = useRef<HTMLDivElement>(null)
  const leafletMap  = useRef<any>(null)
  const markersRef  = useRef<any[]>([])
  const [items, setItems]       = useState<MapItem[]>([])
  const [selected, setSelected] = useState<MapItem|null>(null)
  const [search, setSearch]     = useState("")
  const [layers, setLayers]     = useState<Record<string,boolean>>({
    prospect: true, client: true, pharmacie: true,
  })
  const [loading, setLoading]   = useState(true)

  // Load all geo data
  const loadData = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)

    const [
      { data: prospects },
      { data: clients },
      { data: pharmacies },
    ] = await Promise.all([
      supabase.from("prospects").select("id,nom,entreprise,latitude,longitude,adresse,cp,ville,tel,email,statut")
        .eq("society_id", activeSociety.id)
        .not("latitude", "is", null).not("longitude", "is", null),
      supabase.from("clients").select("id,nom,prenom,latitude,longitude,adresse,cp,ville,telephone,email")
        .eq("society_id", activeSociety.id)
        .not("latitude", "is", null).not("longitude", "is", null),
      supabase.from("pharmacies").select("id,nom,latitude,longitude,adresse,cp,ville,telephone,email")
        .eq("society_id", activeSociety.id)
        .not("latitude", "is", null).not("longitude", "is", null),
    ])

    const all: MapItem[] = [
      ...(prospects||[]).map((p:any) => ({
        id: p.id, type: "prospect" as const,
        nom: p.entreprise || p.nom, lat: p.latitude, lng: p.longitude,
        adresse: p.adresse, ville: p.ville, telephone: p.tel, email: p.email,
        statut: p.statut, color: "#3b82f6", icon: "🎯",
      })),
      ...(clients||[]).map((c:any) => ({
        id: c.id, type: "client" as const,
        nom: c.prenom ? `${c.prenom} ${c.nom}` : c.nom,
        lat: c.latitude, lng: c.longitude,
        adresse: c.adresse, ville: c.ville, telephone: c.telephone, email: c.email,
        color: "#eab308", icon: "👤",
      })),
      ...(pharmacies||[]).map((p:any) => ({
        id: p.id, type: "pharmacie" as const,
        nom: p.nom, lat: p.latitude, lng: p.longitude,
        adresse: p.adresse, ville: p.ville, telephone: p.telephone, email: p.email,
        color: "#22c55e", icon: "🏥",
      })),
    ]

    setItems(all)
    setLoading(false)
    return all
  }, [activeSociety?.id])

  // Init Leaflet map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return

    const initMap = async () => {
      const L = await import("leaflet" as any).catch(() => null)
      if (!L) return

      // Fix default icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const map = L.map(mapRef.current!, {
        center: [46.8566, 2.3522],
        zoom: 6,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map)

      leafletMap.current = map

      // Load CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }
    }

    initMap()

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove()
        leafletMap.current = null
      }
    }
  }, [])

  // Update markers when items or layers change
  useEffect(() => {
    const updateMarkers = async () => {
      if (!leafletMap.current) return
      const L = await import("leaflet" as any).catch(() => null)
      if (!L) return

      // Clear existing markers
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      const filtered = items.filter(item => {
        if (!layers[item.type]) return false
        if (search && !item.nom.toLowerCase().includes(search.toLowerCase()) &&
            !item.ville?.toLowerCase().includes(search.toLowerCase())) return false
        return true
      })

      filtered.forEach(item => {
        const icon = L.divIcon({
          html: `<div style="
            width:32px;height:32px;border-radius:50%;
            background:${item.color};
            border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.4);
            display:flex;align-items:center;justify-content:center;
            font-size:14px;cursor:pointer;
          ">${item.icon}</div>`,
          className: "",
          iconSize: [32,32],
          iconAnchor: [16,32],
        })

        const marker = L.marker([item.lat, item.lng], { icon })
          .addTo(leafletMap.current)
          .on("click", () => setSelected(item))

        markersRef.current.push(marker)
      })

      // Auto-fit bounds if we have markers
      if (filtered.length > 0 && markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current)
        leafletMap.current.fitBounds(group.getBounds().pad(0.1))
      }
    }

    updateMarkers()
  }, [items, layers, search])

  // Focus on specific prospect
  useEffect(() => {
    if (!focusProspect || !leafletMap.current) return
    const item = items.find(i => i.id === focusProspect.id)
    if (item) {
      leafletMap.current.setView([item.lat, item.lng], 15)
      setSelected(item)
    }
  }, [focusProspect, items])

  useEffect(() => { loadData() }, [loadData])

  const visibleCount = items.filter(i => layers[i.type]).length

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-zinc-800 bg-[#111111] flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher sur la map..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50"/>
        </div>

        {/* Layer toggles */}
        <div className="flex items-center gap-1 bg-zinc-800/60 rounded-xl p-1">
          <span className="text-zinc-500 text-xs px-2"><Filter size={11} className="inline mr-1"/>Couches</span>
          {(Object.entries(TYPE_CONFIG) as [string, any][]).map(([key, cfg]) => {
            const count = items.filter(i=>i.type===key).length
            const active = layers[key]
            return (
              <button key={key} onClick={()=>setLayers(prev=>({...prev,[key]:!prev[key]}))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active?"text-black":"text-zinc-500 opacity-50"}`}
                style={active?{backgroundColor:cfg.color}:{}}>
                {active?<Eye size={11}/>:<EyeOff size={11}/>}
                {cfg.icon} {cfg.label} ({count})
              </button>
            )
          })}
        </div>

        <p className="text-zinc-600 text-xs shrink-0">{visibleCount} visible{visibleCount>1?"s":""}</p>
      </div>

      {/* Map + Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Map */}
        <div ref={mapRef} className="flex-1" style={{zIndex:1}}/>

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 px-5 py-3 rounded-xl">
              <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
              <span className="text-zinc-300 text-sm">Chargement de la carte...</span>
            </div>
          </div>
        )}

        {/* No geo data warning */}
        {!loading && items.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#111111] border border-zinc-700 rounded-xl px-5 py-3 z-10 text-center shadow-xl">
            <p className="text-zinc-300 text-sm font-semibold">📍 Aucune adresse géolocalisée</p>
            <p className="text-zinc-600 text-xs mt-1">Ajoute des coordonnées (lat/lng) sur tes fiches clients, pharmacies et prospects</p>
          </div>
        )}

        {/* Selected panel */}
        {selected && (
          <div className="absolute right-3 top-3 w-72 bg-[#111111] border border-zinc-700 rounded-2xl shadow-2xl z-10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800"
              style={{ background: `linear-gradient(135deg, ${selected.color}20, transparent)` }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{selected.icon}</span>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">{selected.nom}</p>
                  <p className="text-xs font-semibold" style={{color:selected.color}}>{TYPE_CONFIG[selected.type].label}</p>
                </div>
              </div>
              <button onClick={()=>setSelected(null)} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800"><X size={15}/></button>
            </div>
            <div className="p-4 space-y-2.5">
              {(selected.adresse||selected.ville) && (
                <div className="flex items-start gap-2">
                  <MapPin size={13} className="text-zinc-500 mt-0.5 shrink-0"/>
                  <p className="text-zinc-300 text-xs">
                    {[selected.adresse, selected.ville].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}
              {selected.telephone && (
                <a href={`tel:${selected.telephone}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone size={13} className="text-zinc-500 shrink-0"/>
                  <p className="text-zinc-300 text-xs">{selected.telephone}</p>
                </a>
              )}
              {selected.statut && (
                <p className="text-xs text-zinc-500">Statut : <span className="text-zinc-300">{selected.statut}</span></p>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={()=>{
                  if (leafletMap.current) leafletMap.current.setView([selected.lat,selected.lng],16)
                }} className="flex-1 text-xs py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold flex items-center justify-center gap-1">
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