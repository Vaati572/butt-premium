"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"

/* ── DEFAULTS ──────────────────────────────── */
export const USER_DEFAULTS = {
  bio: "",
  user_badge: "",

  // Apparence
  accent_color: "#eab308",
  density: "normal",
  font_size: "normal",
  animations: true,
  background: "#0a0a0a",
  card_style: "rounded",
  sidebar_accent: false,
  show_section_icons: true,

  // Messagerie
  msg_bubble_me: "#eab308",
  msg_bubble_rx: "#27272a",
  msg_font_size: "normal",
  msg_show_ts: true,
  msg_compact: false,
  msg_enter_to_send: true,

  // Dashboard
  start_page: "vente",
  dashboard_widgets: ["ca_jour", "nb_ventes", "stock_alerte", "relances"],
  dashboard_columns: "3",

  // Navigation
  hidden_tabs: [] as string[],

  // Affichage
  show_prices_in_stock: true,
  show_cf_in_vente: true,
  show_marge_in_vente: false,
  show_stock_in_vente: true,
  default_payment: "Espèces",
  date_format: "DD/MM/YYYY",
  currency_display: "€",
  nb_items_per_page: "20",
  show_confirmations: true,

  // Vente rapide
  quick_products: [] as string[],
  vente_default_client: "",
  vente_show_composition: false,
  vente_auto_focus_search: true,
  vente_show_total_ttc: true,

  // Raccourcis
  shortcut_vente: "F1",
  shortcut_clients: "F4",
  shortcut_stocks: "F3",
  shortcut_stats: "F6",
  shortcut_messages: "F8",
  shortcut_notes: "F9",
  shortcut_parametres: "F12",

  // Notifications
  notif_relance: true,
  notif_stock_bas: true,
  notif_message: true,
  notif_objectif: false,
  notif_son: false,
  eod_enabled: false,
  eod_hour: 18,
  notif_desktop: false,
  notif_badge_count: true,

  // Impression / Export
  print_header: true,
  print_logo: true,
  print_footer_text: "",
  export_format: "xlsx",
  print_font_size: "normal",

  // Confidentialité
  show_online_status: true,
  show_last_seen: true,
  show_bio_to_team: true,
  allow_direct_messages: true,

  // Accessibilité
  high_contrast: false,
  reduce_motion: false,
  large_click_targets: false,
  focus_indicators: true,
  tooltip_delay: "normal",

  // Favoris
  fav_clients: [] as string[],
  fav_products: [] as string[],

  // Mémo
  memo: "",
  memo_popup: false,
  memo_color: "#eab308",

  // Thème
  app_theme: "1",
}

export type UserSettings = typeof USER_DEFAULTS

interface CtxValue {
  settings: UserSettings
  updateSetting: (key: keyof UserSettings, value: any) => void
  saveSettings: () => Promise<void>
  saving: boolean
  saved: boolean
  loaded: boolean
}

const Ctx = createContext<CtxValue>({
  settings: { ...USER_DEFAULTS },
  updateSetting: () => {},
  saveSettings: async () => {},
  saving: false,
  saved: false,
  loaded: false,
})

export function useUserSettings() { return useContext(Ctx) }

/* ── CSS VARIABLE APPLICATION ──────────────── */
function applySettingsToDOM(s: UserSettings) {
  const root = document.documentElement

  // Accent color → CSS variable
  root.style.setProperty("--accent", s.accent_color)
  root.style.setProperty("--accent-20", s.accent_color + "33")

  // Background
  root.style.setProperty("--bg", s.background)

  // Density → spacing variable
  const densityMap = { compact: "0.4rem", normal: "0.75rem", comfortable: "1.25rem" }
  root.style.setProperty("--density", densityMap[s.density as keyof typeof densityMap] || "0.75rem")

  // Font size → base size
  const fontMap = { small: "13px", normal: "14px", large: "16px" }
  root.style.setProperty("--font-size-base", fontMap[s.font_size as keyof typeof fontMap] || "14px")

  // Card border radius
  const radiusMap = { rounded: "12px", sharp: "4px", pill: "20px" }
  root.style.setProperty("--card-radius", radiusMap[s.card_style as keyof typeof radiusMap] || "12px")

  // Animations
  if (s.reduce_motion || !s.animations) {
    root.style.setProperty("--transition", "none")
    root.style.setProperty("--animation-duration", "0ms")
  } else {
    root.style.setProperty("--transition", "all 0.15s ease")
    root.style.setProperty("--animation-duration", "150ms")
  }

  // High contrast
  if (s.high_contrast) {
    root.style.setProperty("--text-muted", "#a1a1aa")
    root.style.setProperty("--border", "#52525b")
  } else {
    root.style.setProperty("--text-muted", "#71717a")
    root.style.setProperty("--border", "#27272a")
  }

  // Large click targets
  root.style.setProperty("--min-click-size", s.large_click_targets ? "44px" : "32px")

  // Apply background color to body
  document.body.style.backgroundColor = s.background

  // Font size on body
  document.body.style.fontSize = fontMap[s.font_size as keyof typeof fontMap] || "14px"
}

/* ── PROVIDER ──────────────────────────────── */
export function UserSettingsProvider({
  userId,
  children,
}: {
  userId: string
  children: React.ReactNode
}) {
  const [settings, setSettings] = useState<UserSettings>({ ...USER_DEFAULTS })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Load on mount
  useEffect(() => {
    if (!userId) return
    const load = async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("settings")
        .eq("user_id", userId)
        .single()

      if (data?.settings) {
        const merged = { ...USER_DEFAULTS, ...data.settings }
        setSettings(merged)
        applySettingsToDOM(merged)
      }
      setLoaded(true)
    }
    load()
  }, [userId])

  // Apply to DOM whenever settings change
  useEffect(() => {
    if (loaded) applySettingsToDOM(settings)
  }, [settings, loaded])

  const updateSetting = useCallback((key: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const saveSettings = useCallback(async () => {
    setSaving(true)
    const { error } = await supabase.from("user_settings").upsert(
      { user_id: userId, settings, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    if (error) console.error("Save settings error:", error)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }, [userId, settings])

  return (
    <Ctx.Provider value={{ settings, updateSetting, saveSettings, saving, saved, loaded }}>
      {children}
    </Ctx.Provider>
  )
}
