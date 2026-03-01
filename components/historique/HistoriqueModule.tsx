"use client"
import type { Society, Profile } from "@/lib/types"
import ModuleLayout from "@/components/shared/ModuleLayout"
interface Props { activeSociety: Society; profile: Profile }
export default function HistoriqueModule({ activeSociety, profile }: Props) {
  return (
    <ModuleLayout title="Historique">
      <div className="text-center py-24 text-zinc-600">
        <p className="text-4xl mb-4">🚧</p>
        <p className="text-sm">Module en cours de développement</p>
        <p className="text-xs mt-2 text-zinc-700">Société : {activeSociety.name}</p>
      </div>
    </ModuleLayout>
  )
}

