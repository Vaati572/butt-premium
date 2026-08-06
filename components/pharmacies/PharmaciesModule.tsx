"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
  Plus, X, Search, Phone, Mail, Globe, MapPin, ChevronLeft,
  Pencil, Trash2, User, Users, Calendar, RefreshCw, Building2,
  Euro, FileText, Clock,
} from "lucide-react"

interface Props { activeSociety: any; profile: any }

/* ── STATUTS ── */
const STATUTS = {
  non_demarchee: {
    label: "Non-démarchée",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.10)",
    border: "rgba(56,189,248,0.30)",
    gradient: "linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.04) 60%, transparent 100%)",
    dot: "#38bdf8",
  },
  demarchee: {
    label: "Démarchée",
    color: "#f97316",
    bg: "rgba(249,115,22,0.10)",
    border: "rgba(249,115,22,0.30)",
    gradient: "linear-gradient(135deg, rgba(249,115,22,0.14) 0%, rgba(249,115,22,0.05) 60%, transparent 100%)",
    dot: "#f97316",
  },
  client: {
    label: "Client",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.10)",
    border: "rgba(34,197,94,0.30)",
    gradient: "linear-gradient(135deg, rgba(34,197,94,0.14) 0%, rgba(34,197,94,0.05) 60%, transparent 100%)",
    dot: "#22c55e",
  },
  refusee: {
    label: "Refusée",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.10)",
    border: "rgba(239,68,68,0.25)",
    gradient: "linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.04) 60%, transparent 100%)",
    dot: "#ef4444",
  },
}
type StatutKey = keyof typeof STATUTS

/* ── DÉPARTEMENTS ── */
const DEPARTEMENTS = [
  { num: "01", nom: "Ain" }, { num: "02", nom: "Aisne" }, { num: "03", nom: "Allier" },
  { num: "04", nom: "Alpes-de-Haute-Provence" }, { num: "05", nom: "Hautes-Alpes" },
  { num: "06", nom: "Alpes-Maritimes" }, { num: "07", nom: "Ardèche" }, { num: "08", nom: "Ardennes" },
  { num: "09", nom: "Ariège" }, { num: "10", nom: "Aube" }, { num: "11", nom: "Aude" },
  { num: "12", nom: "Aveyron" }, { num: "13", nom: "Bouches-du-Rhône" }, { num: "14", nom: "Calvados" },
  { num: "15", nom: "Cantal" }, { num: "16", nom: "Charente" }, { num: "17", nom: "Charente-Maritime" },
  { num: "18", nom: "Cher" }, { num: "19", nom: "Corrèze" }, { num: "2A", nom: "Corse-du-Sud" },
  { num: "2B", nom: "Haute-Corse" }, { num: "21", nom: "Côte-d'Or" }, { num: "22", nom: "Côtes-d'Armor" },
  { num: "23", nom: "Creuse" }, { num: "24", nom: "Dordogne" }, { num: "25", nom: "Doubs" },
  { num: "26", nom: "Drôme" }, { num: "27", nom: "Eure" }, { num: "28", nom: "Eure-et-Loir" },
  { num: "29", nom: "Finistère" }, { num: "30", nom: "Gard" }, { num: "31", nom: "Haute-Garonne" },
  { num: "32", nom: "Gers" }, { num: "33", nom: "Gironde" }, { num: "34", nom: "Hérault" },
  { num: "35", nom: "Ille-et-Vilaine" }, { num: "36", nom: "Indre" }, { num: "37", nom: "Indre-et-Loire" },
  { num: "38", nom: "Isère" }, { num: "39", nom: "Jura" }, { num: "40", nom: "Landes" },
  { num: "41", nom: "Loir-et-Cher" }, { num: "42", nom: "Loire" }, { num: "43", nom: "Haute-Loire" },
  { num: "44", nom: "Loire-Atlantique" }, { num: "45", nom: "Loiret" }, { num: "46", nom: "Lot" },
  { num: "47", nom: "Lot-et-Garonne" }, { num: "48", nom: "Lozère" }, { num: "49", nom: "Maine-et-Loire" },
  { num: "50", nom: "Manche" }, { num: "51", nom: "Marne" }, { num: "52", nom: "Haute-Marne" },
  { num: "53", nom: "Mayenne" }, { num: "54", nom: "Meurthe-et-Moselle" }, { num: "55", nom: "Meuse" },
  { num: "56", nom: "Morbihan" }, { num: "57", nom: "Moselle" }, { num: "58", nom: "Nièvre" },
  { num: "59", nom: "Nord" }, { num: "60", nom: "Oise" }, { num: "61", nom: "Orne" },
  { num: "62", nom: "Pas-de-Calais" }, { num: "63", nom: "Puy-de-Dôme" },
  { num: "64", nom: "Pyrénées-Atlantiques" }, { num: "65", nom: "Hautes-Pyrénées" },
  { num: "66", nom: "Pyrénées-Orientales" }, { num: "67", nom: "Bas-Rhin" }, { num: "68", nom: "Haut-Rhin" },
  { num: "69", nom: "Rhône" }, { num: "70", nom: "Haute-Saône" }, { num: "71", nom: "Saône-et-Loire" },
  { num: "72", nom: "Sarthe" }, { num: "73", nom: "Savoie" }, { num: "74", nom: "Haute-Savoie" },
  { num: "75", nom: "Paris" }, { num: "76", nom: "Seine-Maritime" }, { num: "77", nom: "Seine-et-Marne" },
  { num: "78", nom: "Yvelines" }, { num: "79", nom: "Deux-Sèvres" }, { num: "80", nom: "Somme" },
  { num: "81", nom: "Tarn" }, { num: "82", nom: "Tarn-et-Garonne" }, { num: "83", nom: "Var" },
  { num: "84", nom: "Vaucluse" }, { num: "85", nom: "Vendée" }, { num: "86", nom: "Vienne" },
  { num: "87", nom: "Haute-Vienne" }, { num: "88", nom: "Vosges" }, { num: "89", nom: "Yonne" },
  { num: "90", nom: "Territoire de Belfort" }, { num: "91", nom: "Essonne" },
  { num: "92", nom: "Hauts-de-Seine" }, { num: "93", nom: "Seine-Saint-Denis" },
  { num: "94", nom: "Val-de-Marne" }, { num: "95", nom: "Val-d'Oise" },
  { num: "971", nom: "Guadeloupe" }, { num: "972", nom: "Martinique" }, { num: "973", nom: "Guyane" },
  { num: "974", nom: "La Réunion" }, { num: "976", nom: "Mayotte" },
]

interface Pharmacie {
  id: string
  nom: string
  enseigne?: string | null
  type_officine?: string | null
  statut: StatutKey
  departement?: string | null
  adresse?: string | null
  cp?: string | null
  ville?: string | null
  latitude?: number | null
  longitude?: number | null
  telephone?: string | null
  telephone2?: string | null
  email?: string | null
  site_web?: string | null
  titulaire?: string | null
  pharmacien_responsable?: string | null
  nb_collaborateurs?: number | null
  specialites?: string | null
  horaires?: string | null
  contrat?: string | null
  remise?: number | null
  ca_realise?: number | null
  date_premier_contact?: string | null
  date_dernier_contact?: string | null
  date_relance?: string | null
  representant?: string | null
  notes?: string | null
  compte_rendu?: string | null
  created_at?: string
}

const BLANK_FORM: Omit<Pharmacie, "id" | "created_at"> = {
  nom: "", enseigne: "", type_officine: "Indépendante", statut: "non_demarchee",
  departement: "", adresse: "", cp: "", ville: "", latitude: null, longitude: null,
  telephone: "", telephone2: "", email: "", site_web: "",
  titulaire: "", pharmacien_responsable: "", nb_collaborateurs: null, specialites: "", horaires: "",
  contrat: "Aucun", remise: null, ca_realise: null,
  date_premier_contact: "", date_dernier_contact: "", date_relance: "", representant: "",
  notes: "", compte_rendu: "",
}

/* ══════════════════════════════════════════════
   FORMULAIRE COMPLET
══════════════════════════════════════════════ */
function PharmacieForm({ societyId, profile, pharmacie, defaultDept, onClose, onDone }: {
  societyId: string; profile: any; pharmacie?: Pharmacie | null
  defaultDept?: string; onClose: () => void; onDone: () => void
}) {
  const [form, setForm] = useState<Omit<Pharmacie, "id" | "created_at">>({
    ...BLANK_FORM,
    departement: defaultDept || "",
    ...(pharmacie ? { ...pharmacie } : {}),
  })
  const [saving, setSaving] = useState(false)
  const set = (k: keyof typeof form, v: any) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.nom.trim()) return
    setSaving(true)
    const payload = {
      society_id: societyId, created_by: profile?.id,
      ...form,
      nb_collaborateurs: form.nb_collaborateurs ? Number(form.nb_collaborateurs) : null,
      remise: form.remise ? Number(form.remise) : null,
      ca_realise: form.ca_realise ? Number(form.ca_realise) : null,
      date_premier_contact: form.date_premier_contact || null,
      date_dernier_contact: form.date_dernier_contact || null,
      date_relance: form.date_relance || null,
    }
    if (pharmacie?.id) await supabase.from("pharmacies_new").update(payload).eq("id", pharmacie.id)
    else await supabase.from("pharmacies_new").insert(payload)
    setSaving(false); onDone(); onClose()
  }

  const cfg = STATUTS[form.statut]

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  )
  const Input = ({ k, placeholder, type = "text" }: { k: keyof typeof form; placeholder?: string; type?: string }) => (
    <input type={type} value={(form[k] as string) || ""} onChange={e => set(k, e.target.value)}
      placeholder={placeholder}
      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50"/>
  )

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#0f0f0f] border-l border-zinc-800 w-full max-w-xl h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0"
          style={{ background: cfg.gradient }}>
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">
              {pharmacie ? "Modifier la fiche" : "Nouvelle fiche pharmacie"}
            </p>
            <h2 className="text-white font-bold text-base">{form.nom || "Sans nom"}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* ── Statut ── */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Statut</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.entries(STATUTS) as [StatutKey, typeof STATUTS.client][]).map(([key, s]) => (
                <button key={key} onClick={() => set("statut", key)}
                  className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-[10px] font-bold transition-all"
                  style={{
                    backgroundColor: form.statut === key ? s.bg : "rgba(39,39,42,0.5)",
                    borderColor: form.statut === key ? s.border : "rgba(63,63,70,0.4)",
                    color: form.statut === key ? s.color : "#52525b",
                  }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.dot }}/>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Identification ── */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">🏥 Identification</p>
            <Field label="Nom de la pharmacie *"><Input k="nom" placeholder="Pharmacie du Centre"/></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Enseigne / Réseau"><Input k="enseigne" placeholder="Welcoop, PHR, Alphega..."/></Field>
              <Field label="Type">
                <select value={form.type_officine || ""} onChange={e => set("type_officine", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                  {["Indépendante", "Groupe", "Enseigne nationale", "Clinique", "Hôpital", "Mutualiste"].map(t =>
                    <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* ── Localisation ── */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">📍 Localisation</p>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Département">
                <select value={form.departement || ""} onChange={e => set("departement", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2.5 text-sm text-white focus:outline-none">
                  <option value="">—</option>
                  {DEPARTEMENTS.map(d => <option key={d.num} value={d.num}>{d.num} – {d.nom}</option>)}
                </select>
              </Field>
              <Field label="Code postal"><Input k="cp" placeholder="75001"/></Field>
              <Field label="Ville"><Input k="ville" placeholder="Paris"/></Field>
            </div>
            <Field label="Adresse complète"><Input k="adresse" placeholder="12 rue de la Paix"/></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude (GPS)">
                <input type="number" step="any" value={form.latitude ?? ""} onChange={e => set("latitude", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="48.8566" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
              </Field>
              <Field label="Longitude (GPS)">
                <input type="number" step="any" value={form.longitude ?? ""} onChange={e => set("longitude", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="2.3522" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
              </Field>
            </div>
          </div>

          {/* ── Contact ── */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">📞 Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Téléphone principal"><Input k="telephone" placeholder="03 xx xx xx xx"/></Field>
              <Field label="Téléphone secondaire"><Input k="telephone2" placeholder="06 xx xx xx xx"/></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email"><Input k="email" placeholder="contact@pharmacie.fr"/></Field>
              <Field label="Site web"><Input k="site_web" placeholder="www.pharmacie.fr"/></Field>
            </div>
          </div>

          {/* ── Personnel ── */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">👤 Personnel</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Titulaire / Gérant"><Input k="titulaire" placeholder="Dr. Martin"/></Field>
              <Field label="Pharmacien responsable"><Input k="pharmacien_responsable" placeholder="Dr. Dupont"/></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nb collaborateurs">
                <input type="number" min="0" value={form.nb_collaborateurs ?? ""} onChange={e => set("nb_collaborateurs", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Ex: 8" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
              </Field>
              <Field label="Représentant assigné"><Input k="representant" placeholder="Yohan"/></Field>
            </div>
            <Field label="Spécialités (dermatologie, tatouage...)"><Input k="specialites" placeholder="Médecine douce, Dermatologie..."/></Field>
            <Field label="Horaires d'ouverture"><Input k="horaires" placeholder="Lun-Sam 9h-19h / Dim 9h-12h"/></Field>
          </div>

          {/* ── Commercial ── */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">💰 Commercial</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contrat">
                <select value={form.contrat || ""} onChange={e => set("contrat", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                  {["Aucun", "Dépôt-vente", "Grossiste", "Partenaire", "Revendeur agréé"].map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Remise accordée (%)">
                <input type="number" min="0" max="100" step="0.5" value={form.remise ?? ""} onChange={e => set("remise", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
              </Field>
            </div>
            <Field label="CA réalisé (€)">
              <input type="number" min="0" step="0.01" value={form.ca_realise ?? ""} onChange={e => set("ca_realise", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="0.00" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
            </Field>
          </div>

          {/* ── Suivi ── */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">📅 Suivi</p>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Premier contact"><Input k="date_premier_contact" type="date"/></Field>
              <Field label="Dernier contact"><Input k="date_dernier_contact" type="date"/></Field>
              <Field label="Prochaine relance"><Input k="date_relance" type="date"/></Field>
            </div>
          </div>

          {/* ── Notes ── */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">📝 Notes & Compte-rendu</p>
            <Field label="Notes générales">
              <textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={3}
                placeholder="Infos générales sur la pharmacie..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"/>
            </Field>
            <Field label="Compte-rendu de visite">
              <textarea value={form.compte_rendu || ""} onChange={e => set("compte_rendu", e.target.value)} rows={4}
                placeholder="Détails de la dernière visite, retours, prochaines étapes..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"/>
            </Field>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 flex gap-2 shrink-0">
          <button onClick={save} disabled={saving || !form.nom.trim()}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ backgroundColor: cfg.color, color: "#000" }}>
            {saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : pharmacie ? "Mettre à jour" : "Créer la fiche"}
          </button>
          <button onClick={onClose} className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   CARTE PHARMACIE
══════════════════════════════════════════════ */
function PharmacieCard({ ph, onEdit, onDelete }: { ph: Pharmacie; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = STATUTS[ph.statut] || STATUTS.non_demarchee

  return (
    <div className="rounded-2xl border overflow-hidden transition-all"
      style={{ background: cfg.gradient, borderColor: cfg.border }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0"
            style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            {ph.nom.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-white font-bold text-sm truncate">{ph.nom}</p>
                {ph.enseigne && <p className="text-[11px] truncate" style={{ color: cfg.color + "cc" }}>{ph.enseigne}</p>}
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                {cfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* Infos rapides */}
        <div className="mt-3 space-y-1.5">
          {(ph.ville || ph.cp) && (
            <div className="flex items-center gap-2">
              <MapPin size={11} style={{ color: cfg.color, opacity: 0.7 }}/>
              <span className="text-xs text-zinc-400 truncate">{[ph.adresse, ph.cp && ph.ville ? `${ph.cp} ${ph.ville}` : ph.ville].filter(Boolean).join(", ")}</span>
            </div>
          )}
          {ph.telephone && (
            <div className="flex items-center gap-2">
              <Phone size={11} style={{ color: cfg.color, opacity: 0.7 }}/>
              <a href={`tel:${ph.telephone}`} className="text-xs text-zinc-400 hover:text-white">{ph.telephone}</a>
            </div>
          )}
          {ph.titulaire && (
            <div className="flex items-center gap-2">
              <User size={11} style={{ color: cfg.color, opacity: 0.7 }}/>
              <span className="text-xs text-zinc-400 truncate">{ph.titulaire}</span>
            </div>
          )}
          {ph.date_relance && (
            <div className="flex items-center gap-2">
              <Clock size={11} className="text-yellow-500"/>
              <span className="text-xs text-yellow-400">Relance : {new Date(ph.date_relance + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {ph.contrat && ph.contrat !== "Aucun" && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{ph.contrat}</span>
          )}
          {ph.remise && ph.remise > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-800 text-blue-400">-{ph.remise}%</span>
          )}
          {ph.ca_realise && ph.ca_realise > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-800 text-green-400">{Number(ph.ca_realise).toFixed(0)}€ CA</span>
          )}
          {ph.specialites && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 truncate max-w-[120px]">{ph.specialites}</span>
          )}
        </div>
      </div>

      {/* Bloc expandable */}
      {expanded && (
        <div className="px-4 pb-3 space-y-2 border-t" style={{ borderColor: cfg.border + "40" }}>
          <div className="pt-3 space-y-1.5">
            {ph.email && (
              <div className="flex items-center gap-2">
                <Mail size={11} style={{ color: cfg.color, opacity: 0.7 }}/>
                <a href={`mailto:${ph.email}`} className="text-xs text-zinc-400 hover:text-white truncate">{ph.email}</a>
              </div>
            )}
            {ph.site_web && (
              <div className="flex items-center gap-2">
                <Globe size={11} style={{ color: cfg.color, opacity: 0.7 }}/>
                <a href={ph.site_web.startsWith("http") ? ph.site_web : "https://" + ph.site_web} target="_blank" rel="noreferrer" className="text-xs text-zinc-400 hover:text-white truncate">{ph.site_web}</a>
              </div>
            )}
            {ph.telephone2 && (
              <div className="flex items-center gap-2">
                <Phone size={11} style={{ color: cfg.color, opacity: 0.7 }}/>
                <a href={`tel:${ph.telephone2}`} className="text-xs text-zinc-400 hover:text-white">{ph.telephone2} (2)</a>
              </div>
            )}
            {ph.pharmacien_responsable && (
              <div className="flex items-center gap-2">
                <User size={11} style={{ color: cfg.color, opacity: 0.7 }}/>
                <span className="text-xs text-zinc-400">{ph.pharmacien_responsable} (resp.)</span>
              </div>
            )}
            {ph.nb_collaborateurs && (
              <div className="flex items-center gap-2">
                <Users size={11} style={{ color: cfg.color, opacity: 0.7 }}/>
                <span className="text-xs text-zinc-400">{ph.nb_collaborateurs} collaborateurs</span>
              </div>
            )}
            {ph.horaires && (
              <div className="flex items-start gap-2">
                <Clock size={11} style={{ color: cfg.color, opacity: 0.7 }} className="mt-0.5 shrink-0"/>
                <span className="text-xs text-zinc-500">{ph.horaires}</span>
              </div>
            )}
            {ph.date_premier_contact && (
              <div className="flex items-center gap-2">
                <Calendar size={11} style={{ color: cfg.color, opacity: 0.7 }}/>
                <span className="text-xs text-zinc-500">Premier contact : {new Date(ph.date_premier_contact + "T00:00:00").toLocaleDateString("fr-FR")}</span>
              </div>
            )}
            {ph.date_dernier_contact && (
              <div className="flex items-center gap-2">
                <RefreshCw size={11} style={{ color: cfg.color, opacity: 0.7 }}/>
                <span className="text-xs text-zinc-500">Dernier contact : {new Date(ph.date_dernier_contact + "T00:00:00").toLocaleDateString("fr-FR")}</span>
              </div>
            )}
            {ph.notes && (
              <div className="bg-zinc-900/60 rounded-lg px-3 py-2 mt-2">
                <p className="text-[10px] text-zinc-600 mb-1">Notes</p>
                <p className="text-xs text-zinc-400 leading-relaxed">{ph.notes}</p>
              </div>
            )}
            {ph.compte_rendu && (
              <div className="bg-zinc-900/60 rounded-lg px-3 py-2">
                <p className="text-[10px] text-zinc-600 mb-1">Compte-rendu</p>
                <p className="text-xs text-zinc-400 leading-relaxed">{ph.compte_rendu}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t" style={{ borderColor: cfg.border + "40" }}>
        <button onClick={() => setExpanded(p => !p)} className="text-[10px] font-bold flex items-center gap-1" style={{ color: cfg.color + "99" }}>
          {expanded ? "Réduire ↑" : "Voir tout ↓"}
        </button>
        <div className="flex items-center gap-0.5">
          <button onClick={onEdit} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors">
            <Pencil size={12}/>
          </button>
          <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 size={12}/>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   VUE DÉPARTEMENT (liste des pharmacies)
══════════════════════════════════════════════ */
function DeptView({ dept, societyId, profile, onBack, allPharmacies, onRefresh }: {
  dept: { num: string; nom: string }
  societyId: string; profile: any
  onBack: () => void
  allPharmacies: Pharmacie[]
  onRefresh: () => void
}) {
  const [editPh, setEditPh] = useState<Pharmacie | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [filterStatut, setFilterStatut] = useState<StatutKey | "toutes">("toutes")

  const list = allPharmacies
    .filter(p => p.departement === dept.num)
    .filter(p => filterStatut === "toutes" || p.statut === filterStatut)
    .filter(p => !search || p.nom.toLowerCase().includes(search.toLowerCase()) || (p.ville || "").toLowerCase().includes(search.toLowerCase()) || (p.titulaire || "").toLowerCase().includes(search.toLowerCase()))

  const countByStatut = (k: StatutKey) => allPharmacies.filter(p => p.departement === dept.num && p.statut === k).length
  const total = allPharmacies.filter(p => p.departement === dept.num).length

  const deletePh = async (id: string) => {
    if (!confirm("Supprimer cette fiche ?")) return
    await supabase.from("pharmacies_new").delete().eq("id", id)
    onRefresh()
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="border-b border-zinc-900 px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm font-semibold">
            <ChevronLeft size={16}/> Départements
          </button>
          <span className="text-zinc-700">/</span>
          <h2 className="text-white font-bold">{dept.num} – {dept.nom}</h2>
          <span className="text-zinc-500 text-sm">· {total} pharmacie{total > 1 ? "s" : ""}</span>
        </div>

        <div className="flex gap-1.5 flex-wrap mb-3">
          {(["toutes", ...Object.keys(STATUTS)] as (StatutKey | "toutes")[]).map(k => {
            const isAll = k === "toutes"
            const cfg = isAll ? null : STATUTS[k as StatutKey]
            const count = isAll ? total : countByStatut(k as StatutKey)
            const isActive = filterStatut === k
            return (
              <button key={k} onClick={() => setFilterStatut(k)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all"
                style={{
                  backgroundColor: isActive ? (cfg?.bg || "rgba(39,39,42,0.5)") : "rgba(39,39,42,0.3)",
                  borderColor: isActive ? (cfg?.border || "rgba(63,63,70,0.6)") : "rgba(63,63,70,0.3)",
                  color: isActive ? (cfg?.color || "#d4d4d8") : "#52525b",
                }}>
                {cfg && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }}/>}
                {isAll ? "Toutes" : cfg!.label} ({count})
              </button>
            )
          })}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, ville, titulaire..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/40"/>
          </div>
          <button onClick={() => { setEditPh(null); setShowForm(true) }}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl text-sm">
            <Plus size={14}/> Créer
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 size={36} className="text-zinc-700 mb-3"/>
            <p className="text-zinc-500 text-sm font-semibold mb-1">Aucune pharmacie{search ? " trouvée" : " dans ce département"}</p>
            {!search && <p className="text-zinc-600 text-xs mb-5">Commence par créer la première fiche</p>}
            {!search && (
              <button onClick={() => { setEditPh(null); setShowForm(true) }}
                className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm">
                <Plus size={14}/> Créer une fiche
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {list.map(p => (
              <PharmacieCard key={p.id} ph={p}
                onEdit={() => { setEditPh(p); setShowForm(true) }}
                onDelete={() => deletePh(p.id)}/>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <PharmacieForm societyId={societyId} profile={profile} pharmacie={editPh} defaultDept={dept.num}
          onClose={() => { setShowForm(false); setEditPh(null) }} onDone={onRefresh}/>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN MODULE
══════════════════════════════════════════════ */
export default function PharmaciesModule({ activeSociety, profile }: Props) {
  const [pharmacies, setPharmacies] = useState<Pharmacie[]>([])
  const [loading, setLoading]       = useState(true)
  const [searchDept, setSearchDept] = useState("")
  const [selectedDept, setSelectedDept] = useState<{ num: string; nom: string } | null>(null)
  const [showForm, setShowForm]     = useState(false)

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const { data } = await supabase.from("pharmacies_new").select("*").eq("society_id", activeSociety.id)
    setPharmacies(data || [])
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { load() }, [load])

  const deptMap = new Map<string, { total: number; byStatut: Record<StatutKey, number> }>()
  pharmacies.forEach(p => {
    const d = p.departement || ""
    if (!deptMap.has(d)) deptMap.set(d, { total: 0, byStatut: { non_demarchee: 0, demarchee: 0, client: 0, refusee: 0 } })
    const entry = deptMap.get(d)!
    entry.total++
    if (p.statut in STATUTS) entry.byStatut[p.statut as StatutKey]++
  })

  const filteredDepts = DEPARTEMENTS.filter(d =>
    d.nom.toLowerCase().includes(searchDept.toLowerCase()) || d.num.includes(searchDept)
  )

  const totalPharmacies = pharmacies.length
  const totalClients    = pharmacies.filter(p => p.statut === "client").length
  const totalRelances   = pharmacies.filter(p => p.date_relance && p.date_relance >= new Date().toISOString().slice(0, 10)).length

  if (selectedDept) {
    return (
      <DeptView dept={selectedDept} societyId={activeSociety.id} profile={profile}
        onBack={() => setSelectedDept(null)} allPharmacies={pharmacies} onRefresh={load}/>
    )
  }

  return (
    <div className="flex-1 overflow-hidden bg-[#0a0a0a] flex flex-col">
      <div className="border-b border-zinc-900 px-4 pt-4 pb-3 shrink-0 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-white font-bold text-xl">🏥 Pharmacies</h1>
            <p className="text-zinc-500 text-xs mt-0.5">{totalPharmacies} pharmacies dans {deptMap.size} département{deptMap.size > 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-yellow-500/20">
              <Plus size={15}/> Créer fiche pharmacie
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { label: "Total",      value: String(totalPharmacies),  color: "text-zinc-300" },
            { label: "Clients",    value: String(totalClients),     color: "text-green-400"  },
            { label: "Démarchées", value: String(pharmacies.filter(p => p.statut === "demarchee").length),     color: "text-orange-400" },
            { label: "Non-dém.",   value: String(pharmacies.filter(p => p.statut === "non_demarchee").length), color: "text-sky-400"    },
            { label: "Refusées",   value: String(pharmacies.filter(p => p.statut === "refusee").length),       color: "text-red-400"    },
            { label: "Relances J", value: String(totalRelances),    color: "text-yellow-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="shrink-0 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 flex items-center gap-2">
              <p className={`text-sm font-black ${color}`}>{value}</p>
              <p className="text-zinc-600 text-[10px]">{label}</p>
            </div>
          ))}
        </div>

        {/* Recherche département */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
          <input type="text" value={searchDept} onChange={e => setSearchDept(e.target.value)}
            placeholder="Rechercher un département (nom ou numéro)..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/40"/>
          {searchDept && <button onClick={() => setSearchDept("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"><X size={12}/></button>}
        </div>
      </div>

      {/* Grille départements */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
            {filteredDepts.map(dept => {
              const info = deptMap.get(dept.num)
              const hasData = !!info && info.total > 0
              const clientCount = info?.byStatut.client || 0
              const domColor = hasData
                ? clientCount > 0 ? "#22c55e"
                : info!.byStatut.demarchee > 0 ? "#f97316"
                : "#38bdf8"
                : "#27272a"
              return (
                <button key={dept.num} onClick={() => setSelectedDept(dept)}
                  className="flex flex-col gap-2 rounded-2xl border p-3 text-left transition-all hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    backgroundColor: hasData ? `${domColor}0d` : "#111",
                    borderColor: hasData ? `${domColor}40` : "#27272a",
                  }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black" style={{ color: hasData ? domColor : "#3f3f46" }}>{dept.num}</span>
                    {hasData && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${domColor}20`, color: domColor }}>
                        {info!.total}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold leading-tight" style={{ color: hasData ? "#d4d4d8" : "#52525b" }}>{dept.nom}</p>
                  {hasData && (
                    <div className="flex gap-1 flex-wrap">
                      {info!.byStatut.client > 0 && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUTS.client.dot }} title={`${info!.byStatut.client} client(s)`}/>}
                      {info!.byStatut.demarchee > 0 && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUTS.demarchee.dot }} title={`${info!.byStatut.demarchee} démarchée(s)`}/>}
                      {info!.byStatut.non_demarchee > 0 && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUTS.non_demarchee.dot }} title={`${info!.byStatut.non_demarchee} non-dém.`}/>}
                      {info!.byStatut.refusee > 0 && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUTS.refusee.dot }} title={`${info!.byStatut.refusee} refusée(s)`}/>}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {showForm && (
        <PharmacieForm societyId={activeSociety.id} profile={profile}
          onClose={() => setShowForm(false)} onDone={load}/>
      )}
    </div>
  )
}
