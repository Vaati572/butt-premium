"use client"

/* ============================================================
   MobileNav — Barre de navigation fixe en bas sur mobile
   Affiche les 5 onglets les plus utilisés avec icônes
   ============================================================ */

interface Props {
  activeTab: string
  setActiveTab: (tab: string) => void
  unreadMessages: number
  accent: string
  visibleTabs: string[]
}

// Onglets prioritaires selon ce qui est visible
const PRIORITY = ["vente", "clients", "stocks", "messages", "stats", "accueil", "notes", "depenses"]

export default function MobileNav({ activeTab, setActiveTab, unreadMessages, accent, visibleTabs }: Props) {
  // Sélectionner les 5 premiers onglets visibles selon la priorité
  const tabs = PRIORITY.filter(id => visibleTabs.includes(id)).slice(0, 5).map(id => {
    const map: Record<string, { icon: string; label: string }> = {
      accueil:   { icon: "🏠", label: "Accueil" },
      vente:     { icon: "🛒", label: "Vente" },
      clients:   { icon: "👤", label: "Clients" },
      stocks:    { icon: "📦", label: "Stock" },
      messages:  { icon: "💬", label: "Messages" },
      stats:     { icon: "📊", label: "Stats" },
      notes:     { icon: "📝", label: "Notes" },
      depenses:  { icon: "💸", label: "Dépenses" },
      prospects: { icon: "🎯", label: "Prospects" },
      map:       { icon: "🗺️", label: "Map" },
    }
    return { id, ...map[id] }
  })

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t border-zinc-800"
      style={{
        backgroundColor: "#111111",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative transition-colors"
            style={{ color: isActive ? accent : "#52525b" }}>
            {/* Active indicator */}
            {isActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                style={{ backgroundColor: accent }}
              />
            )}
            <span className="text-xl leading-none relative">
              {tab.icon}
              {/* Unread badge on messages */}
              {tab.id === "messages" && unreadMessages > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black text-black flex items-center justify-center"
                  style={{ backgroundColor: accent }}>
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
