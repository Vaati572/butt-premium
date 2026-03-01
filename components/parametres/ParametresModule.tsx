"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useUserSettings, USER_DEFAULTS, UserSettings } from "@/lib/UserSettingsContext"
import {
  Save, User, Palette, Layout, Sidebar, Keyboard, Bell, Shield,
  Globe, StickyNote, Star, Eye, EyeOff, ChevronRight, Camera,
  Check, Monitor, Zap, MessageSquare, Printer, Lock,
  Accessibility, ShoppingCart, Hash,
} from "lucide-react"

interface Props { activeSociety: any; profile: any }

type US = UserSettings

/* ────────────────────────────────────────────── */
function Section({ title, icon: Icon, color, desc, children }: {
  title: string; icon: any; color: string; desc?: string; children: React.ReactNode
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + "22" }}>
          <Icon size={14} style={{ color }} />
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">{title}</h3>
          {desc && <p className="text-zinc-500 text-[11px] mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, sub, children, flex = true }: { label: string; sub?: string; children: React.ReactNode; flex?: boolean }) {
  if (!flex) return (
    <div>
      <p className="text-zinc-300 text-sm mb-1">{label}</p>
      {sub && <p className="text-zinc-600 text-[11px] mb-2">{sub}</p>}
      {children}
    </div>
  )
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-zinc-300 text-sm">{label}</p>
        {sub && <p className="text-zinc-600 text-[11px] mt-0.5">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ value, onChange, accent }: { value: boolean; onChange: (v: boolean) => void; accent: string }) {
  return (
    <button onClick={() => onChange(!value)}
      className="relative w-11 h-6 rounded-full transition-colors duration-200"
      style={{ backgroundColor: value ? accent : "#3f3f46" }}>
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 left-0.5"
        style={{ transform: value ? "translateX(20px)" : "translateX(0)" }} />
    </button>
  )
}

function Sel({ value, onChange, options, width = "auto" }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[] | string[]
  width?: string
}) {
  const opts = (typeof options[0] === "string" ? (options as string[]).map(o => ({ value: o, label: o })) : options) as { value: string; label: string }[]
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ width: width !== "auto" ? width : undefined }}
      className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-yellow-500/60">
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function ColorRow({ colors, value, onChange }: { colors: string[]; value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map(c => (
        <button key={c} onClick={() => onChange(c)}
          className={`w-8 h-8 rounded-full transition-all ${value === c ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110" : "hover:scale-105"}`}
          style={{ backgroundColor: c }} />
      ))}
      <label className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-600 flex items-center justify-center cursor-pointer hover:border-zinc-400 transition-colors">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="sr-only" />
        <span className="text-zinc-500 text-xs">+</span>
      </label>
    </div>
  )
}

/* ══════════════════════════════════════════════ */
export default function ParametresModule({ activeSociety, profile }: Props) {
  const { settings: us, updateSetting, saveSettings, saving, saved } = useUserSettings()
  const set = updateSetting

  const [nom, setNom] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [profileColor, setProfileColor] = useState("#d97706")
  const [adresseDepart, setAdresseDepart] = useState("")
  const [activeSection, setActiveSection] = useState("profil")
  const [sidebarOpen, setNavOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const ACCENT = us.accent_color

  const SECTIONS = [
    { id: "profil",          label: "Mon profil",          icon: User,          color: ACCENT },
    { id: "apparence",       label: "Apparence",           icon: Palette,       color: "#a855f7" },
    { id: "messagerie",      label: "Messagerie",          icon: MessageSquare, color: "#3b82f6" },
    { id: "dashboard",       label: "Tableau de bord",     icon: Monitor,       color: "#06b6d4" },
    { id: "navigation",      label: "Navigation",          icon: Sidebar,       color: "#22c55e" },
    { id: "affichage",       label: "Affichage",           icon: Eye,           color: "#f97316" },
    { id: "vente",           label: "Vente rapide",        icon: ShoppingCart,  color: "#84cc16" },
    { id: "raccourcis",      label: "Raccourcis clavier",  icon: Keyboard,      color: "#eab308" },
    { id: "notifications",   label: "Notifications",       icon: Bell,          color: "#ec4899" },
    { id: "impression",      label: "Impression & Export", icon: Printer,       color: "#64748b" },
    { id: "confidentialite", label: "Confidentialité",     icon: Lock,          color: "#8b5cf6" },
    { id: "accessibilite",   label: "Accessibilité",       icon: Accessibility, color: "#14b8a6" },
    { id: "favoris",         label: "Favoris",             icon: Star,          color: "#f59e0b" },
    { id: "memo",            label: "Mémo personnel",      icon: StickyNote,    color: "#84cc16" },
    { id: "systeme",         label: "Système",             icon: Zap,           color: "#ef4444" },
  ]

  const ALL_TABS = [
    "accueil","vente","clients","stocks","commandes","depenses",
    "contrats","pharmacies","stats","historique","messages","notes","documents",
  ]
  const TAB_LABELS: Record<string, string> = {
    accueil: "🏠 Accueil", vente: "🛒 Vente", clients: "👤 Clients",
    stocks: "📦 Stock", commandes: "📋 Commandes", depenses: "💸 Dépenses & Offerts",
    contrats: "📑 Contrats", pharmacies: "🏥 Pharmacies", stats: "📊 Statistiques",
    historique: "🕓 Historique", messages: "💬 Messages", notes: "📝 Notes", documents: "📁 Documents",
  }
  const WIDGETS = [
    { id: "ca_jour",       label: "💰 CA du jour" },
    { id: "nb_ventes",     label: "🛒 Ventes" },
    { id: "stock_alerte",  label: "📦 Stock alerte" },
    { id: "relances",      label: "📞 Relances" },
    { id: "ca_mois",       label: "📈 CA du mois" },
    { id: "top_produit",   label: "🏆 Top produit" },
    { id: "depenses_mois", label: "💸 Dépenses mois" },
    { id: "messages_nlus", label: "💬 Messages non lus" },
    { id: "nouveaux_clients", label: "👤 Nouveaux clients" },
    { id: "objectif_bar",  label: "🎯 Barre objectif" },
  ]
  const PALETTE = ["#eab308","#f97316","#ef4444","#ec4899","#a855f7","#3b82f6","#06b6d4","#22c55e","#84cc16","#14b8a6","#8b5cf6","#f43f5e"]
  const BG_OPTIONS = ["#0a0a0a","#050505","#0d0d12","#0d1117","#0f0e17","#111827"]

  // Load profile info (settings already loaded via context)
  useEffect(() => {
    const loadProfile = async () => {
      const { data: p } = await supabase.from("profiles").select("nom, avatar_url, color, adresse_depart").eq("id", profile.id).single()
      if (p) { setNom(p.nom || ""); setAvatarUrl(p.avatar_url || ""); setProfileColor(p.color || "#d97706"); setAdresseDepart(p.adresse_depart || "") }
    }
    loadProfile()
  }, [profile])

  const save = async () => {
    await supabase.from("profiles").update({ nom, color: profileColor, adresse_depart: adresseDepart }).eq("id", profile.id)
    await saveSettings()
  }

  const uploadAvatar = async (file: File) => {
    const ext = file.name.split(".").pop()
    const path = `profiles/${profile.id}_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path)
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", profile.id)
      setAvatarUrl(data.publicUrl)
    }
  }

  const toggleList = (key: "hidden_tabs" | "dashboard_widgets" | "quick_products" | "fav_clients" | "fav_products", id: string) => {
    const arr = us[key] as string[]
    set(key, arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id])
  }

  const addTag = (key: "fav_clients" | "fav_products" | "quick_products") => {
    if (!tagInput.trim()) return
    set(key, [...(us[key] as string[]), tagInput.trim()]); setTagInput("")
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const renderSection = () => { switch (activeSection) {

    /* ── PROFIL ─────────────────────────────── */
    case "profil": return (<div className="space-y-4">
      <Section title="Identité" icon={User} color={ACCENT} desc="Visible par votre équipe">
        <div className="flex items-start gap-5">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-zinc-700 flex items-center justify-center"
              style={{ backgroundColor: avatarUrl ? undefined : profileColor }}>
              {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <span className="text-black font-black text-2xl">{nom?.slice(0,2).toUpperCase() || "?"}</span>}
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition"
              style={{ backgroundColor: ACCENT }}>
              <Camera size={12} className="text-black" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Nom affiché</label>
              <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre nom"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/60" />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Biographie / Poste</label>
              <input value={us.bio} onChange={e => set("bio", e.target.value)} placeholder="Ex: Responsable commercial..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/60" />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Badge / Statut texte</label>
              <input value={us.user_badge} onChange={e => set("user_badge", e.target.value)} placeholder="Ex: 🔥 Top vendeur"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/60" />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1">📍 Adresse de départ (tournées)</label>
              <input value={adresseDepart} onChange={e => setAdresseDepart(e.target.value)}
                placeholder="Ex: 12 rue de la Paix, 75001 Paris"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/60" />
              <p className="text-zinc-600 text-[10px] mt-1">Utilisée comme point de départ lors de la planification de vos tournées</p>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Couleur de profil</label>
          <ColorRow colors={PALETTE} value={profileColor} onChange={setProfileColor} />
        </div>
      </Section>

      <Section title="Aperçu" icon={User} color={ACCENT}>
        <div className="bg-zinc-800 rounded-xl p-4 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-zinc-600"
              style={{ backgroundColor: avatarUrl ? undefined : profileColor }}>
              {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <span className="text-black font-bold text-sm">{nom?.slice(0,2).toUpperCase() || "?"}</span>}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 ring-2 ring-zinc-800" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{nom || "Votre nom"}</p>
            <p className="text-zinc-400 text-xs">{us.user_badge || us.bio || "En ligne"}</p>
          </div>
        </div>
      </Section>
    </div>)

    /* ── APPARENCE ──────────────────────────── */
    case "apparence": return (<div className="space-y-4">
      <Section title="Couleur d'accentuation" icon={Palette} color="#a855f7" desc="Couleur principale de votre interface">
        <ColorRow colors={PALETTE} value={ACCENT} onChange={v => set("accent_color", v)} />
        <div className="bg-zinc-800 rounded-xl p-3 flex items-center gap-3 mt-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-black font-bold text-sm" style={{ backgroundColor: ACCENT }}>B</div>
          <div className="flex-1 space-y-1.5">
            <div className="h-2 rounded-full" style={{ backgroundColor: ACCENT + "50", width: "70%" }} />
            <div className="h-1.5 rounded-full bg-zinc-700 w-1/2" />
          </div>
          <button className="px-3 py-1 rounded-lg text-black text-xs font-bold" style={{ backgroundColor: ACCENT }}>Aperçu</button>
        </div>
      </Section>

      <Section title="Fond de l'application" icon={Monitor} color="#a855f7" desc="Couleur d'arrière-plan principale">
        <div className="grid grid-cols-6 gap-2">
          {BG_OPTIONS.map(c => (
            <button key={c} onClick={() => set("background", c)}
              className={`h-10 rounded-xl border-2 transition-all ${us.background === c ? "ring-2 ring-white ring-offset-1 ring-offset-zinc-900" : "border-zinc-700 hover:border-zinc-500"}`}
              style={{ backgroundColor: c }}>
              {us.background === c && <Check size={12} className="text-white mx-auto" />}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Style des cartes" icon={Layout} color="#a855f7">
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "rounded",  label: "Arrondi",  radius: "12px" },
            { value: "sharp",    label: "Angulaire",radius: "4px"  },
            { value: "pill",     label: "Doux",     radius: "20px" },
          ].map(s => (
            <button key={s.value} onClick={() => set("card_style", s.value)}
              className={`p-3 border text-center transition-all ${us.card_style === s.value ? "border-2 bg-zinc-800" : "border-zinc-800 hover:border-zinc-600"}`}
              style={{ borderRadius: s.radius, borderColor: us.card_style === s.value ? ACCENT : undefined }}>
              <div className="w-full h-6 bg-zinc-700 mb-2" style={{ borderRadius: s.radius }} />
              <p className="text-zinc-300 text-xs font-semibold">{s.label}</p>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Densité" icon={Monitor} color="#a855f7">
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "compact",      label: "Compact",     desc: "Plus d'infos à l'écran" },
            { value: "normal",       label: "Normal",      desc: "Équilibré" },
            { value: "comfortable",  label: "Aéré",        desc: "Plus d'espace" },
          ].map(d => (
            <button key={d.value} onClick={() => set("density", d.value)}
              className={`p-3 rounded-xl border text-left transition-all ${us.density === d.value ? "border-2 bg-zinc-800" : "border-zinc-800 hover:border-zinc-600"}`}
              style={{ borderColor: us.density === d.value ? ACCENT : undefined }}>
              <p className="text-white text-xs font-semibold">{d.label}</p>
              <p className="text-zinc-500 text-[10px] mt-0.5">{d.desc}</p>
              {us.density === d.value && <p className="text-[10px] font-bold mt-1" style={{ color: ACCENT }}>✓ Actif</p>}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Taille du texte" icon={Monitor} color="#a855f7">
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "small",  label: "Petit",  sample: "text-xs" },
            { value: "normal", label: "Normal", sample: "text-sm" },
            { value: "large",  label: "Grand",  sample: "text-base" },
          ].map(f => (
            <button key={f.value} onClick={() => set("font_size", f.value)}
              className={`p-4 rounded-xl border text-center transition-all ${us.font_size === f.value ? "border-2 bg-zinc-800" : "border-zinc-800 hover:border-zinc-600"}`}
              style={{ borderColor: us.font_size === f.value ? ACCENT : undefined }}>
              <p className={`text-white font-bold ${f.sample} mb-1`}>Aa</p>
              <p className="text-zinc-500 text-[10px]">{f.label}</p>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Options visuelles" icon={Palette} color="#a855f7">
        <Field label="Animations & transitions">
          <Toggle value={us.animations} onChange={v => set("animations", v)} accent={ACCENT} />
        </Field>
        <Field label="Couleur d'accent sur la sidebar" sub="Colore la barre latérale avec votre couleur principale">
          <Toggle value={us.sidebar_accent} onChange={v => set("sidebar_accent", v)} accent={ACCENT} />
        </Field>
        <Field label="Icônes dans les sections" sub="Affiche les icônes dans les titres de section">
          <Toggle value={us.show_section_icons} onChange={v => set("show_section_icons", v)} accent={ACCENT} />
        </Field>
      </Section>
    </div>)

    /* ── MESSAGERIE ─────────────────────────── */
    case "messagerie": return (<div className="space-y-4">
      <Section title="Apparence des bulles" icon={MessageSquare} color="#3b82f6">
        <Field label="Couleur de mes messages">
          <ColorRow colors={PALETTE} value={us.msg_bubble_me} onChange={v => set("msg_bubble_me", v)} />
        </Field>
        <Field label="Couleur des messages reçus">
          <ColorRow colors={["#27272a","#1c1c1e","#18181b","#292524","#1e1b4b","#134e4a"]} value={us.msg_bubble_rx} onChange={v => set("msg_bubble_rx", v)} />
        </Field>
        <div className="bg-zinc-800 rounded-xl p-3 space-y-2 mt-2">
          <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Aperçu</p>
          <div className="flex justify-start">
            <div className="max-w-[60%] px-3 py-2 rounded-2xl rounded-bl-sm text-sm text-white" style={{ backgroundColor: us.msg_bubble_rx }}>
              Bonjour, comment ça va ?
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[60%] px-3 py-2 rounded-2xl rounded-br-sm text-sm font-medium" style={{ backgroundColor: us.msg_bubble_me, color: us.msg_bubble_me === "#ffffff" ? "#000" : "white" }}>
              Très bien merci ! 😊
            </div>
          </div>
        </div>
      </Section>

      <Section title="Comportement" icon={MessageSquare} color="#3b82f6">
        <Field label="Taille du texte dans les messages">
          <Sel value={us.msg_font_size} onChange={v => set("msg_font_size", v)} options={[
            { value: "small", label: "Petit" }, { value: "normal", label: "Normal" }, { value: "large", label: "Grand" }
          ]} />
        </Field>
        <Field label="Afficher l'horodatage" sub="Heure sous chaque message">
          <Toggle value={us.msg_show_ts} onChange={v => set("msg_show_ts", v)} accent={ACCENT} />
        </Field>
        <Field label="Mode compact" sub="Réduit l'espace entre les messages">
          <Toggle value={us.msg_compact} onChange={v => set("msg_compact", v)} accent={ACCENT} />
        </Field>
        <Field label="Entrée pour envoyer" sub="Sinon, utiliser Ctrl+Entrée">
          <Toggle value={us.msg_enter_to_send} onChange={v => set("msg_enter_to_send", v)} accent={ACCENT} />
        </Field>
      </Section>
    </div>)

    /* ── DASHBOARD ──────────────────────────── */
    case "dashboard": return (<div className="space-y-4">
      <Section title="Page de démarrage" icon={Monitor} color="#06b6d4">
        <Sel value={us.start_page} onChange={v => set("start_page", v)} options={[
          { value: "accueil", label: "🏠 Accueil" },
          { value: "vente", label: "🛒 Vente" },
          { value: "clients", label: "👤 Clients" },
          { value: "stocks", label: "📦 Stock" },
          { value: "stats", label: "📊 Statistiques" },
          { value: "messages", label: "💬 Messages" },
        ]} />
      </Section>

      <Section title="Widgets affichés" icon={Layout} color="#06b6d4" desc="Sélectionnez les indicateurs sur votre accueil">
        <div className="grid grid-cols-2 gap-2">
          {WIDGETS.map(w => {
            const active = us.dashboard_widgets.includes(w.id)
            return (
              <button key={w.id} onClick={() => toggleList("dashboard_widgets", w.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${active ? "bg-zinc-800 border-zinc-600" : "border-zinc-800 hover:border-zinc-700"}`}>
                <div className="w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors"
                  style={{ backgroundColor: active ? ACCENT : undefined, borderColor: active ? ACCENT : "#52525b" }}>
                  {active && <Check size={10} className="text-black" />}
                </div>
                <span className="text-sm text-zinc-300">{w.label}</span>
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Mise en page" icon={Layout} color="#06b6d4">
        <Field label="Colonnes de widgets">
          <Sel value={us.dashboard_columns} onChange={v => set("dashboard_columns", v)} options={[
            { value: "2", label: "2 colonnes" },
            { value: "3", label: "3 colonnes" },
            { value: "4", label: "4 colonnes" },
          ]} />
        </Field>
      </Section>
    </div>)

    /* ── NAVIGATION ─────────────────────────── */
    case "navigation": return (<div className="space-y-4">
      <Section title="Onglets visibles" icon={Sidebar} color="#22c55e" desc="Masquez les modules que vous n'utilisez pas">
        <div className="space-y-1">
          {ALL_TABS.map(id => {
            const hidden = us.hidden_tabs.includes(id)
            return (
              <div key={id} className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${hidden ? "opacity-40" : "hover:bg-zinc-800/40"}`}>
                <span className="text-zinc-300 text-sm">{TAB_LABELS[id]}</span>
                <button onClick={() => toggleList("hidden_tabs", id)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${hidden ? "text-red-400 border-red-500/30 bg-red-500/10" : "text-green-400 border-green-500/30 bg-green-500/10"}`}>
                  {hidden ? <><EyeOff size={11} /> Masqué</> : <><Eye size={11} /> Visible</>}
                </button>
              </div>
            )
          })}
        </div>
        {us.hidden_tabs.length > 0 && (
          <button onClick={() => set("hidden_tabs", [])} className="text-xs text-zinc-500 hover:text-zinc-300 underline transition-colors">
            Tout réafficher ({us.hidden_tabs.length} masqué{us.hidden_tabs.length > 1 ? "s" : ""})
          </button>
        )}
      </Section>
    </div>)

    /* ── AFFICHAGE ──────────────────────────── */
    case "affichage": return (<div className="space-y-4">
      <Section title="Données visibles" icon={Eye} color="#f97316">
        <Field label="Prix dans le module Stock" sub="PV et CF visibles dans l'inventaire">
          <Toggle value={us.show_prices_in_stock} onChange={v => set("show_prices_in_stock", v)} accent={ACCENT} />
        </Field>
        <Field label="Coût de fabrication dans la Vente">
          <Toggle value={us.show_cf_in_vente} onChange={v => set("show_cf_in_vente", v)} accent={ACCENT} />
        </Field>
        <Field label="Marge brute dans la Vente">
          <Toggle value={us.show_marge_in_vente} onChange={v => set("show_marge_in_vente", v)} accent={ACCENT} />
        </Field>
        <Field label="Stock disponible dans la Vente" sub="Quantité restante visible lors de la sélection">
          <Toggle value={us.show_stock_in_vente} onChange={v => set("show_stock_in_vente", v)} accent={ACCENT} />
        </Field>
      </Section>

      <Section title="Valeurs par défaut" icon={Eye} color="#f97316">
        <Field label="Mode de paiement par défaut">
          <Sel value={us.default_payment} onChange={v => set("default_payment", v)} options={["Espèces","CB","Chèque","Virement","PayPal"]} />
        </Field>
        <Field label="Format de date">
          <Sel value={us.date_format} onChange={v => set("date_format", v)} options={["DD/MM/YYYY","MM/DD/YYYY","YYYY-MM-DD"]} />
        </Field>
        <Field label="Affichage de la devise">
          <Sel value={us.currency_display} onChange={v => set("currency_display", v)} options={["€","$ USD","£ GBP","CHF"]} />
        </Field>
        <Field label="Éléments par page">
          <Sel value={us.nb_items_per_page} onChange={v => set("nb_items_per_page", v)} options={["10","20","50","100"]} />
        </Field>
      </Section>

      <Section title="Interactions" icon={Eye} color="#f97316">
        <Field label="Fenêtres de confirmation" sub="Demander confirmation avant chaque action critique">
          <Toggle value={us.show_confirmations} onChange={v => set("show_confirmations", v)} accent={ACCENT} />
        </Field>
      </Section>
    </div>)

    /* ── VENTE RAPIDE ───────────────────────── */
    case "vente": return (<div className="space-y-4">
      <Section title="Options de vente" icon={ShoppingCart} color="#84cc16">
        <Field label="Focus automatique sur la recherche" sub="La barre de recherche est activée dès l'ouverture">
          <Toggle value={us.vente_auto_focus_search} onChange={v => set("vente_auto_focus_search", v)} accent={ACCENT} />
        </Field>
        <Field label="Afficher la composition des produits" sub="Liste les composants utilisés pour chaque produit">
          <Toggle value={us.vente_show_composition} onChange={v => set("vente_show_composition", v)} accent={ACCENT} />
        </Field>
        <Field label="Afficher le total TTC" sub="Affiche le montant toutes taxes comprises">
          <Toggle value={us.vente_show_total_ttc} onChange={v => set("vente_show_total_ttc", v)} accent={ACCENT} />
        </Field>
        <Field label="Client par défaut" sub="Pré-sélectionné à l'ouverture d'une vente">
          <input value={us.vente_default_client} onChange={e => set("vente_default_client", e.target.value)}
            placeholder="Nom du client..."
            className="w-40 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" />
        </Field>
      </Section>

      <Section title="Produits en accès rapide" icon={Zap} color="#84cc16" desc="Affichés en premier dans la liste de vente">
        <div className="flex flex-wrap gap-2 mb-3">
          {us.quick_products.length === 0 && <p className="text-zinc-600 text-sm">Aucun produit configuré</p>}
          {us.quick_products.map(p => (
            <span key={p} className="flex items-center gap-1.5 bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-lg border border-zinc-700">
              ⚡ {p}
              <button onClick={() => set("quick_products", us.quick_products.filter(x => x !== p))} className="text-zinc-500 hover:text-red-400 transition-colors ml-1">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={tagInput} onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTag("quick_products")}
            placeholder="Nom du produit..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
          <button onClick={() => addTag("quick_products")} className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-xl text-sm transition-colors">+</button>
        </div>
      </Section>
    </div>)

    /* ── RACCOURCIS ─────────────────────────── */
    case "raccourcis": return (<div className="space-y-4">
      <Section title="Touches de fonction" icon={Keyboard} color="#eab308" desc="Touche assignée à chaque module">
        <div className="space-y-3">
          {[
            { key: "shortcut_vente",      label: "🛒 Vente" },
            { key: "shortcut_clients",    label: "👤 Clients" },
            { key: "shortcut_stocks",     label: "📦 Stock" },
            { key: "shortcut_stats",      label: "📊 Statistiques" },
            { key: "shortcut_messages",   label: "💬 Messages" },
            { key: "shortcut_notes",      label: "📝 Notes" },
            { key: "shortcut_parametres", label: "⚙️ Paramètres" },
          ].map(({ key, label }) => (
            <Field key={key} label={label}>
              <Sel value={(us as any)[key]} onChange={v => set(key as keyof US, v)}
                options={["F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12"]} />
            </Field>
          ))}
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-3">
          <p className="text-zinc-500 text-[11px]">💡 Actifs depuis n'importe quelle page. Évitez les doublons.</p>
        </div>
      </Section>
    </div>)

    /* ── NOTIFICATIONS ──────────────────────── */
    case "notifications": return (<div className="space-y-4">
      <Section title="Alertes" icon={Bell} color="#ec4899">
        <Field label="Relances clients" sub="Clients dépassant leur délai de relance">
          <Toggle value={us.notif_relance} onChange={v => set("notif_relance", v)} accent={ACCENT} />
        </Field>
        <Field label="Stock bas" sub="Produits sous le seuil critique">
          <Toggle value={us.notif_stock_bas} onChange={v => set("notif_stock_bas", v)} accent={ACCENT} />
        </Field>
        <Field label="Nouveaux messages" sub="Badge non-lu sur l'onglet Messages">
          <Toggle value={us.notif_message} onChange={v => set("notif_message", v)} accent={ACCENT} />
        </Field>
        <Field label="Objectifs atteints">
          <Toggle value={us.notif_objectif} onChange={v => set("notif_objectif", v)} accent={ACCENT} />
        </Field>
        <Field label="Sons de notification">
          <Toggle value={us.notif_son} onChange={v => set("notif_son", v)} accent={ACCENT} />
        </Field>
        <Field label="Notifications bureau" sub="Notifications système hors de l'application">
          <Toggle value={us.notif_desktop} onChange={v => set("notif_desktop", v)} accent={ACCENT} />
        </Field>
        <Field label="Badge avec compteur" sub="Affiche le nombre de notifications non lues">
          <Toggle value={us.notif_badge_count} onChange={v => set("notif_badge_count", v)} accent={ACCENT} />
        </Field>
      </Section>
      <Section title="Rapport quotidien" icon={Bell} color="#ec4899">
        <Field label="Activer le rapport de fin de journée">
          <Toggle value={us.eod_enabled} onChange={v => set("eod_enabled", v)} accent={ACCENT} />
        </Field>
        {us.eod_enabled && (
          <Field label="Heure du rapport">
            <div className="flex items-center gap-2">
              <input type="number" min={0} max={23} value={us.eod_hour} onChange={e => set("eod_hour", Number(e.target.value))}
                className="w-20 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:border-yellow-500/60" />
              <span className="text-zinc-500 text-xs">h00</span>
            </div>
          </Field>
        )}
      </Section>
    </div>)

    /* ── IMPRESSION ─────────────────────────── */
    case "impression": return (<div className="space-y-4">
      <Section title="Impression" icon={Printer} color="#64748b">
        <Field label="Afficher l'en-tête sur les documents" sub="Nom de la société et logo en haut de page">
          <Toggle value={us.print_header} onChange={v => set("print_header", v)} accent={ACCENT} />
        </Field>
        <Field label="Inclure le logo" sub="Logo de la société sur les impressions">
          <Toggle value={us.print_logo} onChange={v => set("print_logo", v)} accent={ACCENT} />
        </Field>
        <Field label="Taille de police à l'impression">
          <Sel value={us.print_font_size} onChange={v => set("print_font_size", v)} options={[
            { value: "small", label: "Petite" }, { value: "normal", label: "Normale" }, { value: "large", label: "Grande" }
          ]} />
        </Field>
        <Field label="Texte de pied de page" flex={false}>
          <input value={us.print_footer_text} onChange={e => set("print_footer_text", e.target.value)}
            placeholder="Ex: Merci pour votre confiance..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/60 mt-2" />
        </Field>
      </Section>
      <Section title="Export" icon={Printer} color="#64748b">
        <Field label="Format d'export par défaut">
          <Sel value={us.export_format} onChange={v => set("export_format", v)} options={[
            { value: "xlsx", label: "Excel (.xlsx)" },
            { value: "csv",  label: "CSV (.csv)" },
            { value: "pdf",  label: "PDF (.pdf)" },
          ]} />
        </Field>
      </Section>
    </div>)

    /* ── CONFIDENTIALITE ────────────────────── */
    case "confidentialite": return (<div className="space-y-4">
      <Section title="Visibilité" icon={Lock} color="#8b5cf6" desc="Ce que vos collègues peuvent voir de vous">
        <Field label="Afficher mon statut de présence" sub="En ligne, Occupé, Absent...">
          <Toggle value={us.show_online_status} onChange={v => set("show_online_status", v)} accent={ACCENT} />
        </Field>
        <Field label="Afficher ma dernière connexion" sub="Date et heure de dernière activité">
          <Toggle value={us.show_last_seen} onChange={v => set("show_last_seen", v)} accent={ACCENT} />
        </Field>
        <Field label="Afficher ma biographie à l'équipe" sub="Poste et bio visible dans la messagerie">
          <Toggle value={us.show_bio_to_team} onChange={v => set("show_bio_to_team", v)} accent={ACCENT} />
        </Field>
        <Field label="Autoriser les messages directs" sub="Vos collègues peuvent vous écrire en direct">
          <Toggle value={us.allow_direct_messages} onChange={v => set("allow_direct_messages", v)} accent={ACCENT} />
        </Field>
      </Section>
    </div>)

    /* ── ACCESSIBILITE ──────────────────────── */
    case "accessibilite": return (<div className="space-y-4">
      <Section title="Accessibilité" icon={Accessibility} color="#14b8a6">
        <Field label="Contraste élevé" sub="Augmente le contraste des textes et bordures">
          <Toggle value={us.high_contrast} onChange={v => set("high_contrast", v)} accent={ACCENT} />
        </Field>
        <Field label="Réduire les animations" sub="Désactive les transitions pour limiter la fatigue visuelle">
          <Toggle value={us.reduce_motion} onChange={v => set("reduce_motion", v)} accent={ACCENT} />
        </Field>
        <Field label="Grandes zones de clic" sub="Agrandit les boutons et zones interactives">
          <Toggle value={us.large_click_targets} onChange={v => set("large_click_targets", v)} accent={ACCENT} />
        </Field>
        <Field label="Indicateurs de focus visibles" sub="Contour visible lors de la navigation clavier">
          <Toggle value={us.focus_indicators} onChange={v => set("focus_indicators", v)} accent={ACCENT} />
        </Field>
        <Field label="Délai des infobulles">
          <Sel value={us.tooltip_delay} onChange={v => set("tooltip_delay", v)} options={[
            { value: "instant", label: "Instantané" },
            { value: "normal",  label: "Normal (500ms)" },
            { value: "slow",    label: "Lent (1s)" },
          ]} />
        </Field>
      </Section>
    </div>)

    /* ── FAVORIS ────────────────────────────── */
    case "favoris": return (<div className="space-y-4">
      {(["fav_clients","fav_products"] as const).map(key => (
        <Section key={key} title={key === "fav_clients" ? "⭐ Clients favoris" : "⭐ Produits favoris"}
          icon={Star} color={ACCENT} desc="Accès rapide dans le module Vente">
          <div className="flex flex-wrap gap-2 mb-3">
            {(us[key] as string[]).length === 0 && <p className="text-zinc-600 text-sm">Aucun favori</p>}
            {(us[key] as string[]).map(item => (
              <span key={item} className="flex items-center gap-1.5 bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-lg border border-zinc-700">
                ⭐ {item}
                <button onClick={() => set(key, (us[key] as string[]).filter(x => x !== item))} className="text-zinc-500 hover:text-red-400 transition-colors ml-1">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTag(key)} placeholder="Ajouter..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
            <button onClick={() => addTag(key)} className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-xl text-sm transition-colors">+</button>
          </div>
        </Section>
      ))}
    </div>)

    /* ── MEMO ───────────────────────────────── */
    case "memo": return (<div className="space-y-4">
      <Section title="Mémo personnel" icon={StickyNote} color="#84cc16" desc="Note privée — visible uniquement par vous">
        <div>
          <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5">Couleur du mémo</label>
          <ColorRow colors={["#eab308","#22c55e","#3b82f6","#ec4899","#a855f7","#f97316","#ef4444","#84cc16"]} value={us.memo_color} onChange={v => set("memo_color", v)} />
        </div>
        <div className="rounded-xl overflow-hidden border-2" style={{ borderColor: us.memo_color + "50" }}>
          <div className="px-3 py-2 text-xs font-bold" style={{ backgroundColor: us.memo_color + "15", color: us.memo_color }}>
            📝 Mon mémo
          </div>
          <textarea value={us.memo} onChange={e => set("memo", e.target.value)} rows={10}
            placeholder="Vos notes personnelles, tâches du jour, rappels..."
            className="w-full bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none font-mono leading-relaxed" />
        </div>
        <Field label="Pop-up au lancement" sub="Affiche le mémo à l'ouverture si non vide">
          <Toggle value={us.memo_popup} onChange={v => set("memo_popup", v)} accent={ACCENT} />
        </Field>
      </Section>
    </div>)

    /* ── SYSTEME ────────────────────────────── */
    case "systeme": return (<div className="space-y-4">
      <Section title="Compte" icon={Zap} color="#ef4444">
        <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl">
          <div>
            <p className="text-white text-sm font-semibold">{profile.email}</p>
            <p className="text-zinc-500 text-xs mt-0.5">Compte connecté</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-green-400" />
        </div>
      </Section>
      <Section title="Réinitialisation" icon={Zap} color="#ef4444">
        <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400 font-semibold text-sm mb-1">Zone de réinitialisation</p>
          <p className="text-zinc-500 text-xs mb-3">Remet toutes vos préférences personnelles aux valeurs par défaut.</p>
          <button onClick={() => { if (confirm("Réinitialiser toutes vos préférences ?")) { Object.entries(USER_DEFAULTS).forEach(([k, v]) => updateSetting(k as any, v)) } }}
            className="text-xs text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
            Réinitialiser mes préférences
          </button>
        </div>
      </Section>
    </div>)

    default: return null
  }}

  const NavContent = () => (
    <>
      <div className="p-5 border-b border-zinc-900 flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-sm">⚙️ Mes paramètres</h2>
          <p className="text-zinc-500 text-[11px] mt-0.5">Personnalisation</p>
        </div>
        {/* Bouton fermer — mobile seulement */}
        <button onClick={() => setNavOpen(false)} className="md:hidden w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white text-sm">✕</button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {SECTIONS.map(s => {
          const Icon = s.icon
          const isActive = activeSection === s.id
          return (
            <button key={s.id} onClick={() => { setActiveSection(s.id); setNavOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all mb-0.5 relative ${isActive ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"}`}>
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full" style={{ backgroundColor: s.color }} />}
              <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: isActive ? s.color + "22" : "transparent" }}>
                <Icon size={11} style={{ color: isActive ? s.color : "currentColor" }} />
              </div>
              <span className="truncate text-[13px]">{s.label}</span>
              {isActive && <ChevronRight size={11} className="ml-auto shrink-0" style={{ color: s.color }} />}
            </button>
          )
        })}
      </nav>
    </>
  )

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0a0a0a] relative">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setNavOpen(false)} />
      )}

      {/* DESKTOP sidebar */}
      <div className="hidden md:flex w-56 bg-[#111111] border-r border-zinc-900 flex-col shrink-0">
        <NavContent />
      </div>

      {/* MOBILE sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed top-0 left-0 h-full w-64 bg-[#111111] border-r border-zinc-900 flex flex-col z-50 md:hidden">
          <NavContent />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Bouton hamburger paramètres — fixé sous le hamburger principal (top-16 = 64px) */}
        <button onClick={() => setNavOpen(true)}
          className="md:hidden fixed top-16 left-3 z-30 w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl shadow-xl border border-zinc-700"
          style={{ backgroundColor: "#111111" }}>
          <span className="w-4 h-0.5 rounded-full" style={{ backgroundColor: ACCENT }} />
          <span className="w-4 h-0.5 rounded-full" style={{ backgroundColor: ACCENT }} />
          <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: ACCENT }} />
          {/* Petit badge ⚙️ pour différencier */}
          <span className="absolute -bottom-1.5 -right-1.5 text-[9px]">⚙️</span>
        </button>
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-[#111111] gap-3">
          {/* Spacer mobile pour éviter chevauchement avec les boutons fixes */}
          <div className="md:hidden w-12 shrink-0" />
          <p className="text-zinc-500 text-xs flex-1 truncate">
            <span className="md:hidden font-semibold text-zinc-300">{SECTIONS.find(s => s.id === activeSection)?.label}</span>
            <span className="hidden md:inline">Paramètres personnels — uniquement pour votre compte</span>
          </p>
          <button onClick={save} disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 ${saved ? "bg-green-500/20 text-green-400 border border-green-500/30" : "text-black"}`}
            style={!saved ? { backgroundColor: ACCENT } : {}}>
            {saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
            <span className="hidden sm:inline">{saved ? "Sauvegardé !" : saving ? "En cours..." : "Sauvegarder"}</span>
            {!saving && !saved && <span className="sm:hidden"><Save size={14} /></span>}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto">{renderSection()}</div>
        </div>
      </div>
    </div>
  )
}