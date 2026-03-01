// ══════════════════════════════════════════════════════════════════
//  TYPES GLOBAUX — Butt Premium Web
// ══════════════════════════════════════════════════════════════════

export type Role = "admin" | "user"
export type ProfileType = "Admin" | "Gérant" | "Vendeur" | "Lecture"
export type ContratType = "Aucun" | "Essentielle" | "Avantage" | "Élite" | "ProTeam"
export type PageKey =
  | "accueil" | "vente" | "offerts" | "stocks" | "clients"
  | "pharmacies" | "contrats" | "depenses" | "stats" | "commandes"
  | "historique" | "notes" | "documents" | "prix" | "messages"
  | "parametres" | "admin"

export interface Society {
  id: string
  key: string
  name: string
  color: string
  template: "butt" | "strass"
  active: boolean
  created_at: string
}

export interface Profile {
  id: string
  username: string
  pin: string
  role: Role
  profile_type: ProfileType
  color: string
  avatar_url?: string
  status: string
  last_seen: string
  created_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  theme: string
  accent: string
  font_size: string
  font_family: string
  sidebar_order: string[]
  wallpaper?: string
}

export interface Product {
  id: string
  society_id: string
  name: string
  gamme: string
  pv: number
  cf: number
  photo_url?: string
  in_stock: boolean
  created_at: string
}

export interface Client {
  id: string
  society_id: string
  nom: string
  email?: string
  telephone?: string
  adresse?: string
  contrat: ContratType
  relance: number
  last_relance: string
  notes?: string
  avatar_url?: string
  active_relance: boolean
  is_passage: boolean
  created_at: string
}

export interface Pharmacie {
  id: string
  society_id: string
  nom: string
  email?: string
  telephone?: string
  adresse?: string
  contact?: string
  notes?: string
  created_at: string
}

export interface Vente {
  id: string
  society_id: string
  user_id: string
  client_id?: string
  client_nom?: string
  invoice_ref?: string
  total_ht: number
  port: number
  remise: number
  total_ttc: number
  paiement: string
  notes?: string
  created_at: string
  vente_items?: VenteItem[]
}

export interface VenteItem {
  id: string
  vente_id: string
  product_id?: string
  produit_nom: string
  gamme?: string
  quantite: number
  pv_unitaire: number
  cf_unitaire: number
  total: number
}

export interface Offert {
  id: string
  society_id: string
  user_id: string
  client_id?: string
  client_nom?: string
  produit_nom: string
  quantite: number
  raison?: string
  created_at: string
}

export interface Stock {
  id: string
  society_id: string
  product_id: string
  produit_nom: string
  quantite: number
  seuil_alerte: number
  hidden: boolean
  updated_at: string
}

export interface StockHistory {
  id: string
  society_id: string
  product_id?: string
  produit_nom?: string
  user_id?: string
  action: string
  quantite: number
  quantite_avant: number
  quantite_apres: number
  notes?: string
  created_at: string
}

export interface Depense {
  id: string
  society_id: string
  user_id: string
  categorie: string
  description?: string
  montant: number
  date_depense: string
  justificatif_url?: string
  created_at: string
}

export interface Commande {
  id: string
  society_id: string
  user_id: string
  client_id?: string
  client_nom?: string
  statut: string
  invoice_ref?: string
  total: number
  port: string
  notes?: string
  created_at: string
  commande_items?: CommandeItem[]
}

export interface CommandeItem {
  id: string
  commande_id: string
  produit_nom: string
  quantite: number
  pv_unitaire: number
  total: number
}

export interface Contrat {
  id: string
  society_id: string
  client_id?: string
  client_nom?: string
  type_contrat: string
  date_debut?: string
  date_fin?: string
  montant: number
  statut: string
  notes?: string
  created_at: string
}

export interface Note {
  id: string
  society_id: string
  user_id: string
  titre?: string
  contenu?: string
  couleur: string
  pinned: boolean
  created_at: string
  updated_at: string
}

export interface Todo {
  id: string
  society_id: string
  user_id: string
  texte: string
  done: boolean
  created_at: string
}

export interface Message {
  id: string
  society_id?: string
  sender_id: string
  sender_nom: string
  recipient_id?: string
  group_id?: string
  is_broadcast: boolean
  content: string
  read_by: string[]
  created_at: string
}

export interface Presence {
  id: string
  user_id: string
  status: string
  last_heartbeat: string
  last_activity: string
}

export interface Objective {
  id: string
  society_id: string
  mois: string
  objectif_ca: number
}

// ── Constantes ───────────────────────────────────────────────────
export const CONTRATS: ContratType[] = ["Aucun", "Essentielle", "Avantage", "Élite", "ProTeam"]

export const PAGES_LABELS: Record<PageKey, string> = {
  accueil:    "Accueil",
  vente:      "Vente",
  offerts:    "Offerts",
  stocks:     "Stock",
  clients:    "Clients",
  pharmacies: "Pharmacies",
  contrats:   "Contrats",
  depenses:   "Dépenses",
  stats:      "Statistiques",
  commandes:  "Commandes",
  historique: "Historique",
  notes:      "Notes",
  documents:  "Documents",
  prix:       "Prix",
  messages:   "Messages",
  parametres: "Paramètres",
  admin:      "Admin",
}

export const THEMES = [
  "Sombre Premium", "Sombre Ardoise", "Sombre Cobalt", "Nuit Profonde", "Onyx",
  "Forêt Sombre", "Flamme", "Violet Nuit", "Océan Sombre", "Terminal",
  "Clair Pro", "Clair Ivoire", "Rose Poudré", "Sépia", "Clair Menthe",
]

export const ACCENTS = [
  "Or Premium", "Bleu Électrique", "Vert Émeraude", "Violet Royal",
  "Rouge Rubis", "Orange", "Cyan", "Rose",
]

export const ACCENT_COLORS: Record<string, string> = {
  "Or Premium":       "#d4af37",
  "Bleu Électrique":  "#3498db",
  "Vert Émeraude":    "#2ecc71",
  "Violet Royal":     "#9b59b6",
  "Rouge Rubis":      "#e74c3c",
  "Orange":           "#e67e22",
  "Cyan":             "#1abc9c",
  "Rose":             "#e91e8c",
}

export const CATEGORIES_DEPENSES = [
  "Matières premières", "Emballages", "Transport", "Frais professionnels",
  "Équipement", "Marketing", "Loyer", "Charges", "Autre",
]

export const STATUTS_COMMANDE = [
  "En attente", "Confirmée", "Expédiée", "Livrée", "Annulée",
]

export const PAIEMENTS = ["Espèces", "CB", "Virement", "Chèque", "PayPal", "Autre"]