"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
  Plus, X, Search, Phone, Mail, Globe, MapPin, ChevronLeft,
  Pencil, Trash2, User, Users, Calendar, RefreshCw, Building2,
  Clock, Table2, LayoutGrid,
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
  },
  demarchee: {
    label: "Démarchée",
    color: "#f97316",
    bg: "rgba(249,115,22,0.10)",
    border: "rgba(249,115,22,0.30)",
    gradient: "linear-gradient(135deg, rgba(249,115,22,0.14) 0%, rgba(249,115,22,0.05) 60%, transparent 100%)",
  },
  client: {
    label: "Client",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.10)",
    border: "rgba(34,197,94,0.30)",
    gradient: "linear-gradient(135deg, rgba(34,197,94,0.14) 0%, rgba(34,197,94,0.05) 60%, transparent 100%)",
  },
  refusee: {
    label: "Refusée",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.10)",
    border: "rgba(239,68,68,0.25)",
    gradient: "linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.04) 60%, transparent 100%)",
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

const DEPT_LABEL = (num: string) => DEPARTEMENTS.find(d => d.num === num)?.nom || num

interface Pharmacie {
  id: string; nom: string; enseigne?: string | null; type_officine?: string | null
  statut: StatutKey; departement?: string | null; adresse?: string | null
  cp?: string | null; ville?: string | null; latitude?: number | null; longitude?: number | null
  telephone?: string | null; telephone2?: string | null; email?: string | null; site_web?: string | null
  titulaire?: string | null; pharmacien_responsable?: string | null; nb_collaborateurs?: number | null
  specialites?: string | null; horaires?: string | null; contrat?: string | null; remise?: number | null
  ca_realise?: number | null; date_premier_contact?: string | null; date_dernier_contact?: string | null
  date_relance?: string | null; representant?: string | null; notes?: string | null
  compte_rendu?: string | null; created_at?: string
}

/* ── Composants form réutilisables — DÉFINIS EN DEHORS pour éviter le bug de focus ── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{children}</label>
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest pt-1">{children}</p>
}
const inputCls = "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50"
const selectCls = "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/50"

/* ══════════════════════════════════════════════
   FORMULAIRE
══════════════════════════════════════════════ */
function PharmacieForm({ societyId, profile, pharmacie, defaultDept, onClose, onDone }: {
  societyId: string; profile: any; pharmacie?: Pharmacie | null
  defaultDept?: string; onClose: () => void; onDone: () => void
}) {
  const [nom, setNom]                 = useState(pharmacie?.nom || "")
  const [enseigne, setEnseigne]       = useState(pharmacie?.enseigne || "")
  const [typeOfficine, setTypeOfficine] = useState(pharmacie?.type_officine || "Indépendante")
  const [statut, setStatut]           = useState<StatutKey>(pharmacie?.statut || "non_demarchee")
  const [departement, setDepartement] = useState(pharmacie?.departement || defaultDept || "")
  const [adresse, setAdresse]         = useState(pharmacie?.adresse || "")
  const [cp, setCp]                   = useState(pharmacie?.cp || "")
  const [ville, setVille]             = useState(pharmacie?.ville || "")
  const [latitude, setLatitude]       = useState(pharmacie?.latitude?.toString() || "")
  const [longitude, setLongitude]     = useState(pharmacie?.longitude?.toString() || "")
  const [telephone, setTelephone]     = useState(pharmacie?.telephone || "")
  const [telephone2, setTelephone2]   = useState(pharmacie?.telephone2 || "")
  const [email, setEmail]             = useState(pharmacie?.email || "")
  const [siteWeb, setSiteWeb]         = useState(pharmacie?.site_web || "")
  const [titulaire, setTitulaire]     = useState(pharmacie?.titulaire || "")
  const [pharmResp, setPharmResp]     = useState(pharmacie?.pharmacien_responsable || "")
  const [nbCollab, setNbCollab]       = useState(pharmacie?.nb_collaborateurs?.toString() || "")
  const [specialites, setSpecialites] = useState(pharmacie?.specialites || "")
  const [horaires, setHoraires]       = useState(pharmacie?.horaires || "")
  const [contrat, setContrat]         = useState(pharmacie?.contrat || "Aucun")
  const [remise, setRemise]           = useState(pharmacie?.remise?.toString() || "")
  const [caRealise, setCaRealise]     = useState(pharmacie?.ca_realise?.toString() || "")
  const [datePremier, setDatePremier] = useState(pharmacie?.date_premier_contact || "")
  const [dateDernier, setDateDernier] = useState(pharmacie?.date_dernier_contact || "")
  const [dateRelance, setDateRelance] = useState(pharmacie?.date_relance || "")
  const [representant, setRepresentant] = useState(pharmacie?.representant || "")
  const [notes, setNotes]             = useState(pharmacie?.notes || "")
  const [compteRendu, setCompteRendu] = useState(pharmacie?.compte_rendu || "")
  const [saving, setSaving]           = useState(false)

  const cfg = STATUTS[statut]

  const save = async () => {
    if (!nom.trim()) return
    setSaving(true)
    const payload = {
      society_id: societyId, created_by: profile?.id,
      nom: nom.trim(), enseigne: enseigne || null, type_officine: typeOfficine,
      statut, departement: departement || null, adresse: adresse || null,
      cp: cp || null, ville: ville || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      telephone: telephone || null, telephone2: telephone2 || null,
      email: email || null, site_web: siteWeb || null,
      titulaire: titulaire || null, pharmacien_responsable: pharmResp || null,
      nb_collaborateurs: nbCollab ? parseInt(nbCollab) : null,
      specialites: specialites || null, horaires: horaires || null,
      contrat, remise: remise ? parseFloat(remise) : null,
      ca_realise: caRealise ? parseFloat(caRealise) : null,
      date_premier_contact: datePremier || null,
      date_dernier_contact: dateDernier || null,
      date_relance: dateRelance || null,
      representant: representant || null,
      notes: notes || null, compte_rendu: compteRendu || null,
    }
    if (pharmacie?.id) await supabase.from("pharmacies_new").update(payload).eq("id", pharmacie.id)
    else await supabase.from("pharmacies_new").insert(payload)
    setSaving(false); onDone(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#0f0f0f] border-l border-zinc-800 w-full max-w-xl h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0"
          style={{ background: cfg.gradient }}>
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">
              {pharmacie ? "Modifier la fiche" : "Nouvelle fiche pharmacie"}
            </p>
            <h2 className="text-white font-bold text-base">{nom || "Sans nom"}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Statut */}
          <div>
            <FieldLabel>Statut</FieldLabel>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.entries(STATUTS) as [StatutKey, typeof STATUTS.client][]).map(([key, s]) => (
                <button key={key} onClick={() => setStatut(key)}
                  className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-[10px] font-bold transition-all"
                  style={{
                    backgroundColor: statut === key ? s.bg : "rgba(39,39,42,0.5)",
                    borderColor: statut === key ? s.border : "rgba(63,63,70,0.4)",
                    color: statut === key ? s.color : "#52525b",
                  }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}/>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Identification */}
          <div className="space-y-3">
            <SectionTitle>🏥 Identification</SectionTitle>
            <div>
              <FieldLabel>Nom de la pharmacie *</FieldLabel>
              <input className={inputCls} value={nom} onChange={e => setNom(e.target.value)} placeholder="Pharmacie du Centre"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Enseigne / Réseau</FieldLabel>
                <input className={inputCls} value={enseigne} onChange={e => setEnseigne(e.target.value)} placeholder="Welcoop, PHR, Alphega..."/>
              </div>
              <div>
                <FieldLabel>Type</FieldLabel>
                <select className={selectCls} value={typeOfficine} onChange={e => setTypeOfficine(e.target.value)}>
                  {["Indépendante", "Groupe", "Enseigne nationale", "Clinique", "Hôpital", "Mutualiste"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Localisation */}
          <div className="space-y-3">
            <SectionTitle>📍 Localisation</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <FieldLabel>Département</FieldLabel>
                <select className={selectCls} value={departement} onChange={e => setDepartement(e.target.value)}>
                  <option value="">— Sans département —</option>
                  {DEPARTEMENTS.map(d => <option key={d.num} value={d.num}>{d.num} – {d.nom}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Code postal</FieldLabel>
                <input className={inputCls} value={cp} onChange={e => setCp(e.target.value)} placeholder="75001"/>
              </div>
              <div>
                <FieldLabel>Ville</FieldLabel>
                <input className={inputCls} value={ville} onChange={e => setVille(e.target.value)} placeholder="Paris"/>
              </div>
            </div>
            <div>
              <FieldLabel>Adresse complète</FieldLabel>
              <input className={inputCls} value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="12 rue de la Paix"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Latitude (GPS)</FieldLabel>
                <input className={inputCls} type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="48.8566"/>
              </div>
              <div>
                <FieldLabel>Longitude (GPS)</FieldLabel>
                <input className={inputCls} type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="2.3522"/>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <SectionTitle>📞 Contact</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Téléphone principal</FieldLabel>
                <input className={inputCls} value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="03 xx xx xx xx"/>
              </div>
              <div>
                <FieldLabel>Téléphone secondaire</FieldLabel>
                <input className={inputCls} value={telephone2} onChange={e => setTelephone2(e.target.value)} placeholder="06 xx xx xx xx"/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Email</FieldLabel>
                <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@pharmacie.fr"/>
              </div>
              <div>
                <FieldLabel>Site web</FieldLabel>
                <input className={inputCls} value={siteWeb} onChange={e => setSiteWeb(e.target.value)} placeholder="www.pharmacie.fr"/>
              </div>
            </div>
          </div>

          {/* Personnel */}
          <div className="space-y-3">
            <SectionTitle>👤 Personnel</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Titulaire / Gérant</FieldLabel>
                <input className={inputCls} value={titulaire} onChange={e => setTitulaire(e.target.value)} placeholder="Dr. Martin"/>
              </div>
              <div>
                <FieldLabel>Pharmacien responsable</FieldLabel>
                <input className={inputCls} value={pharmResp} onChange={e => setPharmResp(e.target.value)} placeholder="Dr. Dupont"/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Nb collaborateurs</FieldLabel>
                <input className={inputCls} type="number" min="0" value={nbCollab} onChange={e => setNbCollab(e.target.value)} placeholder="8"/>
              </div>
              <div>
                <FieldLabel>Représentant assigné</FieldLabel>
                <input className={inputCls} value={representant} onChange={e => setRepresentant(e.target.value)} placeholder="Yohan"/>
              </div>
            </div>
            <div>
              <FieldLabel>Spécialités</FieldLabel>
              <input className={inputCls} value={specialites} onChange={e => setSpecialites(e.target.value)} placeholder="Médecine douce, Dermatologie, Tatouage..."/>
            </div>
            <div>
              <FieldLabel>Horaires d'ouverture</FieldLabel>
              <input className={inputCls} value={horaires} onChange={e => setHoraires(e.target.value)} placeholder="Lun-Sam 9h-19h / Dim 9h-12h"/>
            </div>
          </div>

          {/* Commercial */}
          <div className="space-y-3">
            <SectionTitle>💰 Commercial</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Contrat</FieldLabel>
                <select className={selectCls} value={contrat} onChange={e => setContrat(e.target.value)}>
                  {["Aucun", "Dépôt-vente", "Grossiste", "Partenaire", "Revendeur agréé"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Remise accordée (%)</FieldLabel>
                <input className={inputCls} type="number" min="0" max="100" step="0.5" value={remise} onChange={e => setRemise(e.target.value)} placeholder="0"/>
              </div>
            </div>
            <div>
              <FieldLabel>CA réalisé (€)</FieldLabel>
              <input className={inputCls} type="number" min="0" step="0.01" value={caRealise} onChange={e => setCaRealise(e.target.value)} placeholder="0.00"/>
            </div>
          </div>

          {/* Suivi */}
          <div className="space-y-3">
            <SectionTitle>📅 Suivi</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <FieldLabel>Premier contact</FieldLabel>
                <input className={inputCls} type="date" value={datePremier} onChange={e => setDatePremier(e.target.value)}/>
              </div>
              <div>
                <FieldLabel>Dernier contact</FieldLabel>
                <input className={inputCls} type="date" value={dateDernier} onChange={e => setDateDernier(e.target.value)}/>
              </div>
              <div>
                <FieldLabel>Prochaine relance</FieldLabel>
                <input className={inputCls} type="date" value={dateRelance} onChange={e => setDateRelance(e.target.value)}/>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <SectionTitle>📝 Notes & Compte-rendu</SectionTitle>
            <div>
              <FieldLabel>Notes générales</FieldLabel>
              <textarea className={`${inputCls} resize-none`} rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Infos générales..."/>
            </div>
            <div>
              <FieldLabel>Compte-rendu de visite</FieldLabel>
              <textarea className={`${inputCls} resize-none`} rows={4} value={compteRendu} onChange={e => setCompteRendu(e.target.value)} placeholder="Détails de la dernière visite, retours, prochaines étapes..."/>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 flex gap-2 shrink-0">
          <button onClick={save} disabled={saving || !nom.trim()}
            className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
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
    <div className="rounded-2xl border overflow-hidden transition-all" style={{ background: cfg.gradient, borderColor: cfg.border }}>
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
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {ph.contrat && ph.contrat !== "Aucun" && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{ph.contrat}</span>}
          {ph.remise && ph.remise > 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-800 text-blue-400">-{ph.remise}%</span>}
          {ph.ca_realise && ph.ca_realise > 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-800 text-green-400">{Number(ph.ca_realise).toFixed(0)}€ CA</span>}
          {ph.specialites && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 truncate max-w-[120px]">{ph.specialites}</span>}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-3 space-y-1.5 border-t" style={{ borderColor: cfg.border + "40" }}>
          <div className="pt-2.5 space-y-1.5">
            {ph.email && <div className="flex items-center gap-2"><Mail size={11} style={{ color: cfg.color, opacity: 0.7 }}/><a href={`mailto:${ph.email}`} className="text-xs text-zinc-400 hover:text-white truncate">{ph.email}</a></div>}
            {ph.site_web && <div className="flex items-center gap-2"><Globe size={11} style={{ color: cfg.color, opacity: 0.7 }}/><a href={ph.site_web.startsWith("http") ? ph.site_web : "https://" + ph.site_web} target="_blank" rel="noreferrer" className="text-xs text-zinc-400 hover:text-white truncate">{ph.site_web}</a></div>}
            {ph.telephone2 && <div className="flex items-center gap-2"><Phone size={11} style={{ color: cfg.color, opacity: 0.7 }}/><a href={`tel:${ph.telephone2}`} className="text-xs text-zinc-400 hover:text-white">{ph.telephone2} (2)</a></div>}
            {ph.pharmacien_responsable && <div className="flex items-center gap-2"><User size={11} style={{ color: cfg.color, opacity: 0.7 }}/><span className="text-xs text-zinc-400">{ph.pharmacien_responsable} (resp.)</span></div>}
            {ph.nb_collaborateurs && <div className="flex items-center gap-2"><Users size={11} style={{ color: cfg.color, opacity: 0.7 }}/><span className="text-xs text-zinc-400">{ph.nb_collaborateurs} collaborateurs</span></div>}
            {ph.horaires && <div className="flex items-start gap-2"><Clock size={11} style={{ color: cfg.color, opacity: 0.7 }} className="mt-0.5 shrink-0"/><span className="text-xs text-zinc-500">{ph.horaires}</span></div>}
            {ph.date_premier_contact && <div className="flex items-center gap-2"><Calendar size={11} style={{ color: cfg.color, opacity: 0.7 }}/><span className="text-xs text-zinc-500">Premier contact : {new Date(ph.date_premier_contact + "T00:00:00").toLocaleDateString("fr-FR")}</span></div>}
            {ph.date_dernier_contact && <div className="flex items-center gap-2"><RefreshCw size={11} style={{ color: cfg.color, opacity: 0.7 }}/><span className="text-xs text-zinc-500">Dernier contact : {new Date(ph.date_dernier_contact + "T00:00:00").toLocaleDateString("fr-FR")}</span></div>}
            {ph.notes && <div className="bg-zinc-900/60 rounded-lg px-3 py-2 mt-1"><p className="text-[10px] text-zinc-600 mb-1">Notes</p><p className="text-xs text-zinc-400 leading-relaxed">{ph.notes}</p></div>}
            {ph.compte_rendu && <div className="bg-zinc-900/60 rounded-lg px-3 py-2"><p className="text-[10px] text-zinc-600 mb-1">Compte-rendu</p><p className="text-xs text-zinc-400 leading-relaxed">{ph.compte_rendu}</p></div>}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-2.5 border-t" style={{ borderColor: cfg.border + "40" }}>
        <button onClick={() => setExpanded(p => !p)} className="text-[10px] font-bold" style={{ color: cfg.color + "99" }}>
          {expanded ? "Réduire ↑" : "Voir tout ↓"}
        </button>
        <div className="flex items-center gap-0.5">
          <button onClick={onEdit} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors"><Pencil size={12}/></button>
          <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={12}/></button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   VUE TABLEAU FLAT (toutes pharmacies)
══════════════════════════════════════════════ */
function VueTableau({ pharmacies, onEdit, onDelete }: {
  pharmacies: Pharmacie[]; onEdit: (p: Pharmacie) => void; onDelete: (id: string) => void
}) {
  const [search, setSearch]         = useState("")
  const [filterStatut, setFilterStatut] = useState<StatutKey | "toutes">("toutes")
  const [sortBy, setSortBy]         = useState<"nom" | "dept" | "relance">("dept")

  const list = pharmacies
    .filter(p => filterStatut === "toutes" || p.statut === filterStatut)
    .filter(p => !search || p.nom.toLowerCase().includes(search.toLowerCase())
      || (p.ville || "").toLowerCase().includes(search.toLowerCase())
      || (p.titulaire || "").toLowerCase().includes(search.toLowerCase())
      || (p.departement || "").includes(search))
    .sort((a, b) => {
      if (sortBy === "nom") return a.nom.localeCompare(b.nom)
      if (sortBy === "dept") return (a.departement || "zz").localeCompare(b.departement || "zz")
      if (sortBy === "relance") return (a.date_relance || "9999").localeCompare(b.date_relance || "9999")
      return 0
    })

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-zinc-900 flex items-center gap-2 flex-wrap shrink-0">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, ville, dépt, titulaire..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/40"/>
        </div>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value as any)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
          <option value="toutes">Tous statuts</option>
          {(Object.entries(STATUTS) as [StatutKey, typeof STATUTS.client][]).map(([k, s]) =>
            <option key={k} value={k}>{s.label}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
          <option value="dept">Trier par dépt</option>
          <option value="nom">Trier par nom</option>
          <option value="relance">Trier par relance</option>
        </select>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth: "900px" }}>
          <thead className="sticky top-0 z-10 bg-[#0d0d0d]">
            <tr>
              {["Statut", "Nom / Enseigne", "Dépt · Ville", "Titulaire", "Téléphone", "Dernier contact", "Relance", "Contrat", ""].map(h => (
                <th key={h} className="border-b border-zinc-800 px-3 py-2.5 text-left text-[10px] font-bold text-zinc-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-16 text-zinc-600 text-sm">Aucun résultat</td></tr>
            ) : list.map(p => {
              const cfg = STATUTS[p.statut] || STATUTS.non_demarchee
              const today = new Date().toISOString().slice(0, 10)
              const relanceUrgente = p.date_relance && p.date_relance <= today
              return (
                <tr key={p.id} className="group border-b border-zinc-900/60 hover:bg-zinc-900/30 transition-colors"
                  style={{ borderLeft: `2px solid ${cfg.color}40` }}>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit"
                      style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }}/>{cfg.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-white font-semibold">{p.nom}</p>
                    {p.enseigne && <p className="text-zinc-500 text-[11px]">{p.enseigne}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-400 text-xs whitespace-nowrap">
                    {p.departement ? <><span className="font-bold text-zinc-300">{p.departement}</span> · </> : <span className="text-zinc-700">— · </span>}
                    {p.ville || <span className="text-zinc-700">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-400 text-xs">{p.titulaire || <span className="text-zinc-700">—</span>}</td>
                  <td className="px-3 py-2.5">
                    {p.telephone ? <a href={`tel:${p.telephone}`} className="text-zinc-400 text-xs hover:text-white">{p.telephone}</a> : <span className="text-zinc-700 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-500 text-xs whitespace-nowrap">
                    {p.date_dernier_contact ? new Date(p.date_dernier_contact + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : <span className="text-zinc-700">—</span>}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {p.date_relance
                      ? <span className={`text-xs font-semibold ${relanceUrgente ? "text-red-400" : "text-yellow-400"}`}>
                          {relanceUrgente ? "⚠ " : ""}{new Date(p.date_relance + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </span>
                      : <span className="text-zinc-700 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    {p.contrat && p.contrat !== "Aucun"
                      ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{p.contrat}</span>
                      : <span className="text-zinc-700 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(p)} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-700"><Pencil size={12}/></button>
                      <button onClick={() => onDelete(p.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-700 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={12}/></button>
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
}

/* ══════════════════════════════════════════════
   VUE DÉPARTEMENT
══════════════════════════════════════════════ */
function DeptView({ dept, societyId, profile, onBack, allPharmacies, onRefresh }: {
  dept: { num: string; nom: string }; societyId: string; profile: any
  onBack: () => void; allPharmacies: Pharmacie[]; onRefresh: () => void
}) {
  const [editPh, setEditPh]   = useState<Pharmacie | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch]   = useState("")
  const [filterStatut, setFilterStatut] = useState<StatutKey | "toutes">("toutes")

  const isSansDept = dept.num === "__sans__"
  const list = allPharmacies
    .filter(p => isSansDept ? (!p.departement || p.departement === "") : p.departement === dept.num)
    .filter(p => filterStatut === "toutes" || p.statut === filterStatut)
    .filter(p => !search || p.nom.toLowerCase().includes(search.toLowerCase()) || (p.ville || "").toLowerCase().includes(search.toLowerCase()) || (p.titulaire || "").toLowerCase().includes(search.toLowerCase()))

  const total = allPharmacies.filter(p => isSansDept ? (!p.departement || p.departement === "") : p.departement === dept.num).length
  const countByStatut = (k: StatutKey) => allPharmacies.filter(p => {
    const inDept = isSansDept ? (!p.departement || p.departement === "") : p.departement === dept.num
    return inDept && p.statut === k
  }).length

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
          <h2 className="text-white font-bold">{isSansDept ? "Sans département" : `${dept.num} – ${dept.nom}`}</h2>
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
                {cfg && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }}/>}
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
            <p className="text-zinc-500 text-sm font-semibold mb-1">Aucune pharmacie{search ? " trouvée" : ""}</p>
            {!search && <button onClick={() => { setEditPh(null); setShowForm(true) }} className="mt-4 flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm"><Plus size={14}/> Créer une fiche</button>}
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
        <PharmacieForm societyId={societyId} profile={profile} pharmacie={editPh}
          defaultDept={isSansDept ? "" : dept.num}
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
  const [editPh, setEditPh]         = useState<Pharmacie | null>(null)
  const [viewMode, setViewMode]     = useState<"departements" | "tableau">("departements")

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const { data } = await supabase.from("pharmacies_new").select("*").eq("society_id", activeSociety.id)
    setPharmacies(data || [])
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { load() }, [load])

  const deletePh = async (id: string) => {
    if (!confirm("Supprimer cette fiche ?")) return
    await supabase.from("pharmacies_new").delete().eq("id", id)
    setPharmacies(prev => prev.filter(p => p.id !== id))
  }

  const deptMap = new Map<string, { total: number; byStatut: Record<StatutKey, number> }>()
  pharmacies.forEach(p => {
    const d = p.departement || ""
    if (!deptMap.has(d)) deptMap.set(d, { total: 0, byStatut: { non_demarchee: 0, demarchee: 0, client: 0, refusee: 0 } })
    const entry = deptMap.get(d)!
    entry.total++
    if (p.statut in STATUTS) entry.byStatut[p.statut as StatutKey]++
  })

  const sansDept = pharmacies.filter(p => !p.departement || p.departement === "")
  const totalPharmacies = pharmacies.length
  const today = new Date().toISOString().slice(0, 10)

  const filteredDepts = DEPARTEMENTS.filter(d =>
    d.nom.toLowerCase().includes(searchDept.toLowerCase()) || d.num.includes(searchDept)
  )

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
            <p className="text-zinc-500 text-xs mt-0.5">{totalPharmacies} pharmacies dans {deptMap.size > (sansDept.length > 0 ? 1 : 0) ? deptMap.size - (sansDept.length > 0 ? 1 : 0) : deptMap.size} département{deptMap.size > 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              <button onClick={() => setViewMode("departements")} title="Par département"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ backgroundColor: viewMode === "departements" ? "#eab30820" : "transparent", color: viewMode === "departements" ? "#eab308" : "#52525b" }}>
                <LayoutGrid size={14}/>
              </button>
              <button onClick={() => setViewMode("tableau")} title="Vue tableau"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ backgroundColor: viewMode === "tableau" ? "#eab30820" : "transparent", color: viewMode === "tableau" ? "#eab308" : "#52525b" }}>
                <Table2 size={14}/>
              </button>
            </div>
            <button onClick={() => { setEditPh(null); setShowForm(true) }}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-yellow-500/20">
              <Plus size={15}/> Créer fiche pharmacie
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { label: "Total",        value: String(totalPharmacies),                                              color: "text-zinc-300"  },
            { label: "Clients",      value: String(pharmacies.filter(p => p.statut === "client").length),         color: "text-green-400" },
            { label: "Démarchées",   value: String(pharmacies.filter(p => p.statut === "demarchee").length),      color: "text-orange-400"},
            { label: "Non-dém.",     value: String(pharmacies.filter(p => p.statut === "non_demarchee").length),  color: "text-sky-400"   },
            { label: "Refusées",     value: String(pharmacies.filter(p => p.statut === "refusee").length),        color: "text-red-400"   },
            { label: "Relances imm.", value: String(pharmacies.filter(p => p.date_relance && p.date_relance <= today).length), color: "text-yellow-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="shrink-0 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 flex items-center gap-2">
              <p className={`text-sm font-black ${color}`}>{value}</p>
              <p className="text-zinc-600 text-[10px]">{label}</p>
            </div>
          ))}
        </div>

        {viewMode === "departements" && (
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input type="text" value={searchDept} onChange={e => setSearchDept(e.target.value)}
              placeholder="Rechercher un département (nom ou numéro)..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/40"/>
            {searchDept && <button onClick={() => setSearchDept("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"><X size={12}/></button>}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : viewMode === "tableau" ? (
        <VueTableau pharmacies={pharmacies}
          onEdit={p => { setEditPh(p); setShowForm(true) }}
          onDelete={deletePh}/>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
            {/* Case "Sans département" — visible si au moins une fiche sans dépt */}
            {sansDept.length > 0 && (
              <button onClick={() => setSelectedDept({ num: "__sans__", nom: "Sans département" })}
                className="flex flex-col gap-2 rounded-2xl border p-3 text-left transition-all hover:scale-[1.02] hover:shadow-lg"
                style={{ backgroundColor: "rgba(113,113,122,0.08)", borderColor: "rgba(113,113,122,0.30)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-zinc-400">—</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{sansDept.length}</span>
                </div>
                <p className="text-xs font-semibold text-zinc-400">Sans département</p>
                <div className="flex gap-1 flex-wrap">
                  {(Object.keys(STATUTS) as StatutKey[]).map(k => {
                    const count = sansDept.filter(p => p.statut === k).length
                    return count > 0 ? <span key={k} className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUTS[k].color }}/> : null
                  })}
                </div>
              </button>
            )}
            {filteredDepts.map(dept => {
              const info = deptMap.get(dept.num)
              const hasData = !!info && info.total > 0
              const domColor = hasData
                ? info!.byStatut.client > 0 ? "#22c55e"
                : info!.byStatut.demarchee > 0 ? "#f97316"
                : "#38bdf8"
                : "#27272a"
              return (
                <button key={dept.num} onClick={() => setSelectedDept(dept)}
                  className="flex flex-col gap-2 rounded-2xl border p-3 text-left transition-all hover:scale-[1.02] hover:shadow-lg"
                  style={{ backgroundColor: hasData ? `${domColor}0d` : "#111", borderColor: hasData ? `${domColor}40` : "#27272a" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black" style={{ color: hasData ? domColor : "#3f3f46" }}>{dept.num}</span>
                    {hasData && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${domColor}20`, color: domColor }}>{info!.total}</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold leading-tight" style={{ color: hasData ? "#d4d4d8" : "#52525b" }}>{dept.nom}</p>
                  {hasData && (
                    <div className="flex gap-1 flex-wrap">
                      {(Object.keys(STATUTS) as StatutKey[]).map(k => info!.byStatut[k] > 0 ? (
                        <span key={k} className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUTS[k].color }}/>
                      ) : null)}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {showForm && (
        <PharmacieForm societyId={activeSociety.id} profile={profile} pharmacie={editPh}
          onClose={() => { setShowForm(false); setEditPh(null) }} onDone={load}/>
      )}
    </div>
  )
}
