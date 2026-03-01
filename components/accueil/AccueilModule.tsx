"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  TrendingUp, ShoppingCart, AlertTriangle, Target,
  FileText, Star, Users, Trophy, Zap, Settings,
  RefreshCw, X, Check, Package,
} from "lucide-react"

interface Props { activeSociety: any; profile: any }

const ALL_WIDGETS = [
  { key: "ca_jour",          label: "💰 CA du jour",           desc: "Chiffre d'affaires aujourd'hui" },
  { key: "nb_ventes",        label: "🛒 Ventes du jour",       desc: "Nombre de ventes passées" },
  { key: "net_jour",         label: "📈 Net URSSAF",           desc: "CA net après charges (14%)" },
  { key: "stock_alerte",     label: "⚠ Stocks critiques",     desc: "Produits sous le seuil d'alerte" },
  { key: "objectif",         label: "🎯 Objectif mensuel",     desc: "Progression vers l'objectif CA" },
  { key: "memo",             label: "📝 Mon mémo",             desc: "Ton mémo personnel du jour" },
  { key: "favoris",          label: "⭐ Accès rapide",         desc: "Tes produits favoris" },
  { key: "derniers_clients", label: "👤 Derniers clients",     desc: "Clients vus aujourd'hui" },
  { key: "top_produits",     label: "🏆 Top produits",         desc: "Produits les plus vendus ce mois" },
  { key: "activite_session", label: "⚡ Activité session",     desc: "Résumé de ta session en cours" },
]

const DEFAULT_WIDGETS = ["ca_jour", "nb_ventes", "stock_alerte", "memo", "favoris", "objectif"]

const URSSAF = 0.14

/* ── PANEL CONFIG ────────────────────────────── */
function ConfigPanel({ activeWidgets, objectif, memo, onSave, onClose }: {
  activeWidgets: string[]
  objectif: number
  memo: string
  onSave: (widgets: string[], obj: number, memo: string) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<string[]>(activeWidgets)
  const [obj, setObj] = useState(objectif.toString())
  const [memoText, setMemoText] = useState(memo)

  const toggle = (key: string) => {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">⚙ Configurer l'accueil</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Choisis les widgets à afficher</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Widgets */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Widgets</label>
            <div className="space-y-2">
              {ALL_WIDGETS.map(w => (
                <button key={w.key} onClick={() => toggle(w.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${selected.includes(w.key) ? "bg-yellow-500/10 border-yellow-500/40" : "bg-zinc-800 border-zinc-700 hover:border-zinc-600"}`}>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-colors ${selected.includes(w.key) ? "bg-yellow-500 border-yellow-500" : "border-zinc-600"}`}>
                    {selected.includes(w.key) && <Check size={12} className="text-black" />}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{w.label}</p>
                    <p className="text-zinc-500 text-[11px]">{w.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Objectif mensuel */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Objectif CA mensuel (€)</label>
            <input type="number" value={obj} onChange={e => setObj(e.target.value)} placeholder="5000"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" />
          </div>

          {/* Mémo */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Mon mémo du jour</label>
            <textarea value={memoText} onChange={e => setMemoText(e.target.value)} rows={4}
              placeholder="Rappels, notes, objectifs du jour..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 resize-none" />
          </div>
        </div>
        <div className="p-5 border-t border-zinc-800 space-y-3">
          <button onClick={() => onSave(selected, parseFloat(obj) || 5000, memoText)}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
            <Check size={15} /> Appliquer
          </button>
          <button onClick={onClose} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-xl text-sm">
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── WIDGET CARD ─────────────────────────────── */
function WidgetCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-800">
        <p className="text-sm font-bold text-zinc-300">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

/* ── MAIN ───────────────────────────────────── */
export default function AccueilModule({ activeSociety, profile }: Props) {
  const [loading, setLoading] = useState(true)
  const [showConfig, setShowConfig] = useState(false)

  // Config utilisateur
  const [activeWidgets, setActiveWidgets] = useState<string[]>(DEFAULT_WIDGETS)
  const [objectif, setObjectif] = useState(5000)
  const [memo, setMemo] = useState("")

  // Données
  const [ventesJour, setVentesJour] = useState<any[]>([])
  const [ventesMois, setVentesMois] = useState<any[]>([])
  const [stockAlerts, setStockAlerts] = useState<any[]>([])
  const [topProduits, setTopProduits] = useState<{ nom: string; qty: number }[]>([])
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => { if (activeSociety && profile) { loadPrefs(); loadData() } }, [activeSociety, profile])

  const loadPrefs = async () => {
    const key = `accueil_prefs_${profile.id}`
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const prefs = JSON.parse(raw)
        if (prefs.widgets) setActiveWidgets(prefs.widgets)
        if (prefs.objectif) setObjectif(prefs.objectif)
        if (prefs.memo !== undefined) setMemo(prefs.memo)
      }
    } catch {}
  }

  const savePrefs = (widgets: string[], obj: number, memoText: string) => {
    const key = `accueil_prefs_${profile.id}`
    try { localStorage.setItem(key, JSON.stringify({ widgets, objectif: obj, memo: memoText })) } catch {}
    setActiveWidgets(widgets)
    setObjectif(obj)
    setMemo(memoText)
    setShowConfig(false)
  }

  const loadData = async () => {
    setLoading(true)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const [{ data: vJour }, { data: vMois }, { data: stock }, { data: prods }, { data: vItems }] = await Promise.all([
      supabase.from("ventes").select("*, vente_items(*)").eq("society_id", activeSociety.id).gte("created_at", today.toISOString()),
      supabase.from("ventes").select("total_ttc").eq("society_id", activeSociety.id).gte("created_at", firstOfMonth.toISOString()),
      supabase.from("stock").select("*").eq("society_id", activeSociety.id),
      supabase.from("products").select("id, name, gamme, pv, avatar_url").eq("society_id", activeSociety.id),
      supabase.from("vente_items").select("produit_nom, quantite, vente_id").in(
        "vente_id",
        (await supabase.from("ventes").select("id").eq("society_id", activeSociety.id).gte("created_at", firstOfMonth.toISOString())).data?.map(v => v.id) || []
      ),
    ])

    setVentesJour(vJour || [])
    setVentesMois(vMois || [])
    setProducts(prods || [])

    // Stocks en alerte
    const alerts = (stock || []).filter(s => s.quantite < 0 || (s.seuil_alerte > 0 && s.quantite <= s.seuil_alerte))
    setStockAlerts(alerts)

    // Top produits du mois
    const counts: Record<string, number> = {}
    for (const item of (vItems || [])) {
      counts[item.produit_nom] = (counts[item.produit_nom] || 0) + item.quantite
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nom, qty]) => ({ nom, qty }))
    setTopProduits(sorted)

    setLoading(false)
  }

  // Calculs KPI
  const caJour = ventesJour.reduce((s, v) => s + Number(v.total_ttc), 0)
  const caMois = ventesMois.reduce((s, v) => s + Number(v.total_ttc), 0)
  const netJour = caJour - caJour * URSSAF
  const nbVentes = ventesJour.length
  const pctObjectif = objectif > 0 ? Math.min(100, caMois / objectif * 100) : 0

  // Salutation
  const hour = new Date().getHours()
  const salut = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir"
  const dateStr = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  const isActive = (key: string) => activeWidgets.includes(key)

  // Clients du jour (uniques)
  const clientsJour = Array.from(new Map(ventesJour.map(v => [v.client_nom, v])).values()).slice(0, 5)

  // Produits favoris (10 premiers du catalogue)
  const produitsFavoris = products.slice(0, 8)

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="p-8 max-w-6xl mx-auto">

        {/* Header salutation */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-yellow-500">{salut}, {profile.username?.split(" ")[0]} 👋</h1>
            <p className="text-zinc-500 mt-1 capitalize">{dateStr}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadData}
              className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl hover:border-zinc-600 transition-colors">
              <RefreshCw size={13} /> Actualiser
            </button>
            <button onClick={() => setShowConfig(true)}
              className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl hover:border-zinc-600 transition-colors">
              <Settings size={13} /> Configurer
            </button>
          </div>
        </div>

        {/* KPI rapides — toujours visibles */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {isActive("ca_jour") && (
            <div className="bg-zinc-900 border border-yellow-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp size={15} className="text-yellow-500" />
                </div>
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">CA aujourd'hui</p>
              </div>
              <p className="text-3xl font-bold text-yellow-500">{caJour.toFixed(2)}€</p>
              <p className="text-zinc-600 text-xs mt-1">Mois : {caMois.toFixed(2)}€</p>
            </div>
          )}
          {isActive("nb_ventes") && (
            <div className="bg-zinc-900 border border-blue-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <ShoppingCart size={15} className="text-blue-400" />
                </div>
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Ventes du jour</p>
              </div>
              <p className="text-3xl font-bold text-blue-400">{nbVentes}</p>
              <p className="text-zinc-600 text-xs mt-1">{nbVentes === 0 ? "Aucune vente" : nbVentes === 1 ? "1 vente passée" : `${nbVentes} ventes passées`}</p>
            </div>
          )}
          {isActive("net_jour") && (
            <div className="bg-zinc-900 border border-green-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp size={15} className="text-green-400" />
                </div>
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Net URSSAF</p>
              </div>
              <p className="text-3xl font-bold text-green-400">{netJour.toFixed(2)}€</p>
              <p className="text-zinc-600 text-xs mt-1">Après {(URSSAF * 100).toFixed(0)}% de charges</p>
            </div>
          )}
        </div>

        {/* Grille 2 colonnes pour les widgets */}
        <div className="grid grid-cols-2 gap-5">

          {/* OBJECTIF */}
          {isActive("objectif") && (
            <WidgetCard title="🎯 Objectif mensuel">
              <div className="flex justify-between mb-2">
                <span className="text-zinc-400 text-sm">{caMois.toFixed(0)}€</span>
                <span className="text-zinc-500 text-sm">/ {objectif.toFixed(0)}€</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-3 mb-2 overflow-hidden">
                <div className={`h-3 rounded-full transition-all duration-500 ${pctObjectif >= 100 ? "bg-green-500" : "bg-yellow-500"}`}
                  style={{ width: `${pctObjectif}%` }} />
              </div>
              <p className={`text-sm font-bold ${pctObjectif >= 100 ? "text-green-400" : "text-yellow-500"}`}>
                {pctObjectif.toFixed(0)}% atteint
                {pctObjectif >= 100 && " 🎉"}
              </p>
              {pctObjectif < 100 && (
                <p className="text-zinc-600 text-xs mt-1">Il reste {(objectif - caMois).toFixed(0)}€ à faire</p>
              )}
            </WidgetCard>
          )}

          {/* STOCKS CRITIQUES */}
          {isActive("stock_alerte") && (
            <WidgetCard title={`⚠ Stocks critiques (${stockAlerts.length})`}>
              {stockAlerts.length === 0 ? (
                <div className="flex items-center gap-2 text-green-400">
                  <Check size={16} />
                  <p className="text-sm font-semibold">Tout est OK !</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stockAlerts.slice(0, 6).map(s => (
                    <div key={s.id} className="flex justify-between items-center">
                      <span className="text-zinc-300 text-sm">{s.produit_nom}</span>
                      <span className={`text-sm font-bold ${s.quantite < 0 ? "text-red-400" : "text-orange-400"}`}>
                        {s.quantite} u.
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </WidgetCard>
          )}

          {/* MÉMO */}
          {isActive("memo") && (
            <WidgetCard title="📝 Mon mémo du jour">
              {memo.trim() ? (
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">{memo}</p>
              ) : (
                <div>
                  <p className="text-zinc-600 text-sm italic mb-3">Aucun mémo — configure-le via ⚙ Configurer</p>
                </div>
              )}
              <button onClick={() => setShowConfig(true)}
                className="mt-3 text-yellow-500 text-xs hover:underline">
                ✏ Modifier le mémo
              </button>
            </WidgetCard>
          )}

          {/* ACCÈS RAPIDE PRODUITS */}
          {isActive("favoris") && (
            <WidgetCard title="⭐ Accès rapide — Produits">
              {produitsFavoris.length === 0 ? (
                <p className="text-zinc-600 text-sm italic">Aucun produit disponible</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {produitsFavoris.map(p => (
                    <div key={p.id} className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt={p.name} className="w-5 h-5 rounded-md object-cover" />
                      ) : (
                        <Package size={12} className="text-yellow-500" />
                      )}
                      <span className="text-white text-xs font-semibold">{p.name}</span>
                      <span className="text-yellow-500 text-xs">{Number(p.pv).toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
              )}
            </WidgetCard>
          )}

          {/* DERNIERS CLIENTS DU JOUR */}
          {isActive("derniers_clients") && (
            <WidgetCard title="👤 Clients du jour">
              {clientsJour.length === 0 ? (
                <p className="text-zinc-600 text-sm italic">Aucun client aujourd'hui</p>
              ) : (
                <div className="space-y-2">
                  {clientsJour.map((v, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-zinc-800 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-yellow-500/10 rounded-lg flex items-center justify-center shrink-0">
                          <Users size={12} className="text-yellow-500" />
                        </div>
                        <span className="text-zinc-300 text-sm">{v.client_nom}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-500 text-sm font-bold">{Number(v.total_ttc).toFixed(2)}€</p>
                        <p className="text-zinc-600 text-[10px]">{new Date(v.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </WidgetCard>
          )}

          {/* TOP PRODUITS DU MOIS */}
          {isActive("top_produits") && (
            <WidgetCard title="🏆 Top produits ce mois">
              {topProduits.length === 0 ? (
                <p className="text-zinc-600 text-sm italic">Pas encore de données ce mois</p>
              ) : (
                <div className="space-y-2">
                  {topProduits.map((p, i) => (
                    <div key={p.nom} className="flex items-center gap-3">
                      <span className={`text-sm font-bold w-5 text-center ${i === 0 ? "text-yellow-500" : i === 1 ? "text-zinc-400" : i === 2 ? "text-orange-600" : "text-zinc-600"}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-zinc-300 text-sm truncate">{p.nom}</span>
                          <span className="text-yellow-500 text-sm font-bold ml-2 shrink-0">{p.qty} u.</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5">
                          <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${(p.qty / topProduits[0].qty) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </WidgetCard>
          )}

          {/* ACTIVITÉ SESSION */}
          {isActive("activite_session") && (
            <WidgetCard title="⚡ Activité de la session">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-500">{nbVentes}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">Ventes</p>
                </div>
                <div className="bg-zinc-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-500">{caJour.toFixed(0)}€</p>
                  <p className="text-zinc-500 text-xs mt-0.5">CA généré</p>
                </div>
                <div className="bg-zinc-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">{netJour.toFixed(0)}€</p>
                  <p className="text-zinc-500 text-xs mt-0.5">Net URSSAF</p>
                </div>
                <div className="bg-zinc-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-400">{clientsJour.length}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">Clients</p>
                </div>
              </div>
            </WidgetCard>
          )}

        </div>
      </div>

      {showConfig && (
        <ConfigPanel
          activeWidgets={activeWidgets}
          objectif={objectif}
          memo={memo}
          onSave={savePrefs}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  )
}