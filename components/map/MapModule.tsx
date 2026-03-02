"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { X, MapPin, Navigation, Route, ExternalLink, Filter, RotateCcw, Check } from "lucide-react"
import type { Prospect } from "@/components/prospects/ProspectsModule"

interface Props {
  activeSociety: any
  profile: any
  focusProspect?: Prospect | null
  activeTournee?: any | null
  onClearFocus?: () => void
  onSwitchToProspects?: () => void
}

const STATUTS: Record<string, { label: string; color: string; hex: string }> = {
  a_faire:   { label: "À faire",    color: "blue",   hex: "#3b82f6" },
  demarchee: { label: "Démarchée",  color: "orange", hex: "#f97316" },
  attente:   { label: "En attente", color: "yellow", hex: "#eab308" },
  converti:  { label: "Converti",   color: "green",  hex: "#22c55e" },
  perdu:     { label: "Perdu",      color: "red",    hex: "#ef4444" },
}

// SVG marker factory — couleur dynamique
const makeMarkerSVG = (color: string, selected = false) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${selected ? 36 : 28}" height="${selected ? 44 : 36}" viewBox="0 0 28 36">
  <filter id="shadow">
    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
  </filter>
  <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.27 21.73 0 14 0z"
    fill="${color}" filter="url(#shadow)" />
  <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
  ${selected ? '<circle cx="14" cy="14" r="3" fill="' + color + '"/>' : ''}
</svg>`

export default function MapModule({ activeSociety, profile, focusProspect, activeTournee, onClearFocus, onSwitchToProspects }: Props) {
  const mapRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Record<string, any>>({})
  const routeLayerRef = useRef<any>(null)
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatut, setFilterStatut] = useState<string[]>(["a_faire", "demarchee", "attente", "converti", "perdu"])
  const [selected, setSelected] = useState<Prospect | null>(null)
  const [tourMode, setTourMode] = useState(false)
  const [tourSelection, setTourSelection] = useState<Set<string>>(new Set())
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [homeAddress, setHomeAddress] = useState("")
  const [homeCoords, setHomeCoords] = useState<[number, number] | null>(null)
  const [geocodingHome, setGeocodingHome] = useState(false)
  const homeMarkerRef = useRef<any>(null)

  // Load Leaflet dynamically (no SSR issues)
  useEffect(() => {
    if (typeof window === "undefined") return
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    document.head.appendChild(link)

    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.onload = () => setLeafletLoaded(true)
    document.head.appendChild(script)
    return () => {}
  }, [])

  useEffect(() => { load(); loadHomeAddress() }, [activeSociety])

  const loadHomeAddress = async () => {
    const { data } = await supabase.from("profiles")
      .select("adresse_depart").eq("id", profile.id).single()
    if (data?.adresse_depart) {
      setHomeAddress(data.adresse_depart)
      geocodeHome(data.adresse_depart)
    }
  }

  const geocodeHome = async (address: string) => {
    if (!address.trim()) return
    setGeocodingHome(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`)
      const data = await res.json()
      if (data?.[0]) setHomeCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)])
    } catch {}
    setGeocodingHome(false)
  }

  const saveHomeAddress = async () => {
    await supabase.from("profiles").update({ adresse_depart: homeAddress }).eq("id", profile.id)
    geocodeHome(homeAddress)
  }

  const load = async () => {
    const { data } = await supabase.from("prospects")
      .select("*").eq("society_id", activeSociety.id)
      .not("latitude", "is", null)
    setProspects(data || [])
    setLoading(false)
  }

  // Init map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return
    const L = (window as any).L

    mapInstanceRef.current = L.map(mapRef.current, {
      center: [46.603354, 1.888334], // Centre France
      zoom: 6,
      zoomControl: true,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current)
  }, [leafletLoaded])

  // Add/update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletLoaded) return
    const L = (window as any).L
    const map = mapInstanceRef.current

    // Remove old markers
    Object.values(markersRef.current).forEach((m: any) => map.removeLayer(m))
    markersRef.current = {}

    const visible = prospects.filter(p => filterStatut.includes(p.statut))

    visible.forEach(p => {
      if (!p.latitude || !p.longitude) return
      const cfg = STATUTS[p.statut] || STATUTS.a_faire
      const isInTour = tourSelection.has(p.id)
      const isSel = selected?.id === p.id || focusProspect?.id === p.id

      const icon = L.divIcon({
        html: makeMarkerSVG(cfg.hex, isSel || isInTour),
        className: "",
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36],
      })

      const marker = L.marker([p.latitude, p.longitude], { icon })

      if (tourMode) {
        marker.on("click", () => {
          setTourSelection(prev => {
            const next = new Set(prev)
            if (next.has(p.id)) next.delete(p.id)
            else next.add(p.id)
            return next
          })
        })
      } else {
        marker.bindPopup(`
          <div style="font-family:sans-serif;min-width:180px;padding:4px">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">${p.nom}</div>
            ${p.entreprise ? `<div style="color:#888;font-size:12px;margin-bottom:4px">${p.entreprise}</div>` : ""}
            <div style="display:inline-block;background:${cfg.hex}20;color:${cfg.hex};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;margin-bottom:8px">${cfg.label}</div>
            ${p.ville ? `<div style="color:#666;font-size:12px">📍 ${p.cp || ""} ${p.ville}</div>` : ""}
            ${p.tel ? `<div style="color:#666;font-size:12px">📞 ${p.tel}</div>` : ""}
          </div>
        `, { maxWidth: 250 })
        marker.on("click", () => setSelected(p))
      }

      marker.addTo(map)
      markersRef.current[p.id] = marker
    })

    // Home marker
    if (homeMarkerRef.current) map.removeLayer(homeMarkerRef.current)
    if (homeCoords) {
      const homeIcon = L.divIcon({
        html: `<div style="background:#22c55e;border:3px solid white;border-radius:50%;width:16px;height:16px;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
        className: "",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })
      homeMarkerRef.current = L.marker(homeCoords, { icon: homeIcon, zIndexOffset: 2000 })
        .bindPopup("<b>🏠 Mon point de départ</b>")
        .addTo(map)
    }

    // Auto-fit bounds if prospects
    if (visible.length > 0 && !focusProspect) {
      const coords = visible.filter(p => p.latitude).map(p => [p.latitude!, p.longitude!])
      if (coords.length > 1) map.fitBounds(coords, { padding: [40, 40], maxZoom: 13 })
      else if (coords.length === 1) map.setView(coords[0] as any, 13)
    }
  }, [prospects, filterStatut, leafletLoaded, tourMode, tourSelection, homeCoords])

  // Focus on specific prospect
  useEffect(() => {
    if (!focusProspect || !mapInstanceRef.current) return
    if (focusProspect.latitude && focusProspect.longitude) {
      mapInstanceRef.current.setView([focusProspect.latitude, focusProspect.longitude], 15, { animate: true })
      setSelected(focusProspect)
      const marker = markersRef.current[focusProspect.id]
      if (marker) setTimeout(() => marker.openPopup(), 300)
    }
  }, [focusProspect, leafletLoaded])

  // Load saved tournee on map
  useEffect(() => {
    if (!activeTournee || !mapInstanceRef.current || !leafletLoaded) return
    const L = (window as any).L
    const map = mapInstanceRef.current

    // Remove old route
    if (routeLayerRef.current) { map.removeLayer(routeLayerRef.current); routeLayerRef.current = null }

    const etapes = activeTournee.etapes || []
    const isLivraison = activeTournee.mode === "livraison"

    // Sort by heure if livraison
    const sorted = isLivraison
      ? [...etapes].sort((a: any, b: any) => (a.heure || "99:99").localeCompare(b.heure || "99:99"))
      : etapes

    const coords: [number, number][] = [
      ...(homeCoords ? [homeCoords] : []),
      ...sorted.filter((e: any) => e.latitude && e.longitude).map((e: any) => [e.latitude, e.longitude] as [number, number])
    ]

    if (coords.length < 2) return

    // Draw route
    routeLayerRef.current = L.polyline(coords, { color: "#eab308", weight: 4, opacity: 0.9, dashArray: "10, 6" }).addTo(map)

    // Add numbered markers
    sorted.forEach((e: any, i: number) => {
      if (!e.latitude || !e.longitude) return
      const icon = L.divIcon({
        html: `<div style="background:${e.fait ? "#22c55e" : "#eab308"};color:#000;font-weight:900;font-size:11px;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #000;box-shadow:0 2px 8px rgba(0,0,0,0.5)">${i+1}</div>`,
        className: "", iconSize: [24, 24], iconAnchor: [12, 12],
      })
      L.marker([e.latitude, e.longitude], { icon }).bindPopup(
        `<div style="font-family:sans-serif;min-width:160px"><b style="font-size:14px">${e.nom}</b>${isLivraison && e.heure ? `<div style="color:#a78bfa;font-size:12px;margin-top:4px">⏰ ${e.heure}</div>` : ""}<div style="color:#666;font-size:11px;margin-top:4px">${e.ville || ""}</div></div>`
      ).addTo(map)
    })

    map.fitBounds(coords, { padding: [60, 60] })
  }, [activeTournee, leafletLoaded, homeCoords])

  // Draw route for tour
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletLoaded) return
    const L = (window as any).L
    const map = mapInstanceRef.current

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current)
      routeLayerRef.current = null
    }

    if (tourSelection.size < 2) { setRouteInfo(null); return }

    const stops = Array.from(tourSelection)
      .map(id => prospects.find(p => p.id === id))
      .filter(Boolean) as Prospect[]

    // Simple nearest-neighbor optimization (starting from home if available)
    const optimized: Prospect[] = []
    const remaining = [...stops]
    
    // Start from home or first stop
    let startLat = homeCoords ? homeCoords[0] : remaining[0]?.latitude!
    let startLng = homeCoords ? homeCoords[1] : remaining[0]?.longitude!
    if (!homeCoords) { optimized.push(remaining.shift()!) }
    
    let currentLat = startLat
    let currentLng = startLng
    while (remaining.length > 0) {
      let nearest = 0
      let minDist = Infinity
      remaining.forEach((p, i) => {
        const d = Math.hypot((p.latitude! - currentLat), (p.longitude! - currentLng))
        if (d < minDist) { minDist = d; nearest = i }
      })
      const next = remaining.splice(nearest, 1)[0]
      optimized.push(next)
      currentLat = next.latitude!
      currentLng = next.longitude!
    }
    
    // Dummy for compat
    let current = optimized[0]


    const coords = [
      ...(homeCoords ? [homeCoords] : []),
      ...optimized.map(p => [p.latitude!, p.longitude!] as [number, number])
    ]

    // Draw route line
    routeLayerRef.current = L.polyline(coords, {
      color: "#eab308",
      weight: 3,
      opacity: 0.8,
      dashArray: "8, 6",
    }).addTo(map)

    // Add step numbers
    optimized.forEach((p, i) => {
      const numIcon = L.divIcon({
        html: `<div style="background:#eab308;color:#000;font-weight:800;font-size:11px;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #000;position:relative;top:-10px;left:-10px">${i + 1}</div>`,
        className: "",
        iconSize: [20, 20],
        iconAnchor: [0, 0],
      })
      L.marker([p.latitude!, p.longitude!], { icon: numIcon, zIndexOffset: 1000 }).addTo(map)
    })

    map.fitBounds(coords, { padding: [60, 60] })

    // Estimate distance + duration
    let totalKm = 0
    for (let i = 0; i < coords.length - 1; i++) {
      const [lat1, lng1] = coords[i]
      const [lat2, lng2] = coords[i + 1]
      const R = 6371
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLng = (lng2 - lng1) * Math.PI / 180
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
      totalKm += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }
    setRouteInfo({ distance: Math.round(totalKm), duration: Math.round(totalKm / 60 * 60) })
  }, [tourSelection, prospects, leafletLoaded])

  const myPosition = () => {
    if (!mapInstanceRef.current) return
    navigator.geolocation.getCurrentPosition(pos => {
      mapInstanceRef.current.setView([pos.coords.latitude, pos.coords.longitude], 13)
    })
  }

  const openGoogleMaps = () => {
    const stops = Array.from(tourSelection).map(id => prospects.find(p => p.id === id)).filter(Boolean) as Prospect[]
    if (stops.length === 0) return
    const waypoints = stops.map(p => `${p.latitude},${p.longitude}`).join("/")
    window.open(`https://www.google.com/maps/dir/${waypoints}`, "_blank")
  }

  const openWaze = () => {
    const first = prospects.find(p => p.id === Array.from(tourSelection)[0])
    if (!first) return
    window.open(`https://waze.com/ul?ll=${first.latitude},${first.longitude}&navigate=yes`, "_blank")
  }

  const withCoords = prospects.filter(p => filterStatut.includes(p.statut))

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a] relative">

      {/* Header */}
      <div className="px-6 py-3 border-b border-zinc-900 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-bold text-lg">🗺️ Map Tournées</h1>
          <span className="text-zinc-500 text-xs">{withCoords.length} prospect{withCoords.length > 1 ? "s" : ""} sur la map</span>
        </div>
        <div className="flex items-center gap-2">
          {onSwitchToProspects && (
            <button onClick={onSwitchToProspects}
              className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors">
              ← Prospects
            </button>
          )}
          <button onClick={myPosition}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors">
            <Navigation size={12} /> Ma position
          </button>
          {/* Adresse de départ */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5">
            <span className="text-green-400 text-xs">🏠</span>
            <input
              value={homeAddress}
              onChange={e => setHomeAddress(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveHomeAddress()}
              placeholder="Mon adresse de départ..."
              className="bg-transparent text-xs text-white placeholder-zinc-600 focus:outline-none w-48"
            />
            <button onClick={saveHomeAddress} disabled={geocodingHome}
              className="text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors"
              style={{ backgroundColor: "#22c55e20", color: "#22c55e" }}>
              {geocodingHome ? "..." : "OK"}
            </button>
            {homeCoords && <span className="text-green-400 text-[10px]">✓</span>}
          </div>
          <button onClick={() => { setTourMode(!tourMode); setTourSelection(new Set()); setRouteInfo(null) }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all"
            style={tourMode
              ? { backgroundColor: "#eab30820", color: "#eab308", borderColor: "#eab30850" }
              : { backgroundColor: "#18181b", color: "#a1a1aa", borderColor: "#3f3f46" }}>
            <Route size={12} /> {tourMode ? "Mode tournée actif" : "Planifier tournée"}
          </button>
        </div>
      </div>

      {/* Filtres statuts */}
      <div className="px-6 py-2 flex gap-2 overflow-x-auto border-b border-zinc-900 shrink-0">
        {Object.entries(STATUTS).map(([id, cfg]) => {
          const count = prospects.filter(p => p.statut === id).length
          const active = filterStatut.includes(id)
          return (
            <button key={id} onClick={() => setFilterStatut(prev =>
              prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            )}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all"
              style={active
                ? { backgroundColor: cfg.hex + "20", color: cfg.hex, borderColor: cfg.hex + "50" }
                : { borderColor: "#27272a", color: "#52525b" }}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: active ? cfg.hex : "#52525b" }} />
              {cfg.label} {count > 0 && `· ${count}`}
            </button>
          )
        })}
      </div>

      {/* Map container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />

        {/* Tour mode panel */}
        {tourMode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4">
            <div className="bg-[#111111]/95 backdrop-blur-md border border-zinc-700 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-bold text-sm">🗺️ Planification de tournée</p>
                <button onClick={() => { setTourSelection(new Set()); setRouteInfo(null) }}
                  className="text-zinc-500 hover:text-white text-xs flex items-center gap-1">
                  <RotateCcw size={11} /> Reset
                </button>
              </div>

              {tourSelection.size === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-2">Cliquez sur les marqueurs pour ajouter des étapes</p>
              ) : (
                <>
                  {/* Étapes */}
                  <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
                    {Array.from(tourSelection).map((id, i) => {
                      const p = prospects.find(x => x.id === id)
                      if (!p) return null
                      return (
                        <div key={id} className="flex items-center gap-2 text-xs">
                          <span className="w-5 h-5 rounded-full bg-yellow-500 text-black font-black flex items-center justify-center text-[10px] shrink-0">{i + 1}</span>
                          <span className="text-zinc-200 truncate flex-1">{p.nom}</span>
                          {p.ville && <span className="text-zinc-500 truncate">{p.ville}</span>}
                          <button onClick={() => setTourSelection(prev => { const n = new Set(prev); n.delete(id); return n })}
                            className="text-zinc-600 hover:text-red-400"><X size={10} /></button>
                        </div>
                      )
                    })}
                  </div>

                  {routeInfo && (
                    <div className="flex gap-3 mb-3 p-2 bg-zinc-900 rounded-xl">
                      <div className="text-center flex-1">
                        <p className="text-yellow-400 font-black text-lg">{routeInfo.distance} km</p>
                        <p className="text-zinc-500 text-[10px]">Distance estimée</p>
                      </div>
                      <div className="w-px bg-zinc-800" />
                      <div className="text-center flex-1">
                        <p className="text-yellow-400 font-black text-lg">{Math.floor(routeInfo.duration / 60)}h{String(routeInfo.duration % 60).padStart(2, "0")}</p>
                        <p className="text-zinc-500 text-[10px]">Durée estimée</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={openGoogleMaps}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30 hover:bg-blue-500/30 transition-colors">
                      <ExternalLink size={11} /> Google Maps
                    </button>
                    <button onClick={openWaze}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors">
                      <Navigation size={11} /> Waze
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Active tournee banner */}
        {activeTournee && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
            <div className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-xl font-bold text-sm shadow-lg">
              🛣️ {activeTournee.nom} · {activeTournee.etapes?.length} étapes
              {onClearFocus && <button onClick={onClearFocus} className="ml-1 hover:opacity-70"><X size={12} /></button>}
            </div>
          </div>
        )}
        {/* Focus prospect banner */}
        {focusProspect && !activeTournee && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
            <div className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-xl font-bold text-sm shadow-lg">
              <MapPin size={14} /> Centré sur {focusProspect.nom}
              {onClearFocus && (
                <button onClick={onClearFocus} className="ml-1 hover:opacity-70"><X size={12} /></button>
              )}
            </div>
          </div>
        )}

        {/* Loading */}
        {(loading || !leafletLoaded) && (
          <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-10">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-zinc-500 text-sm">Chargement de la carte...</p>
          </div>
        )}

        {/* No prospects with coords */}
        {!loading && leafletLoaded && withCoords.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
            <div className="bg-zinc-900/90 border border-zinc-700 rounded-2xl p-6 text-center max-w-xs">
              <p className="text-3xl mb-2">📍</p>
              <p className="text-white font-bold mb-1">Aucun prospect géolocalisé</p>
              <p className="text-zinc-500 text-sm">Ajoutez une adresse et cliquez "Géolocaliser" dans la fiche prospect</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}