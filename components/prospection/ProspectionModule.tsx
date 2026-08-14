"use client"

interface Props { activeSociety: any; profile: any }

export default function ProspectionModule({ activeSociety, profile }: Props) {
  return (
    <div className="flex-1 overflow-hidden bg-[#0a0a0a] flex flex-col">
      <div className="border-b border-zinc-900 px-4 pt-4 pb-3 shrink-0">
        <h1 className="text-white font-bold text-xl">💊 Prospection Pharmacies</h1>
        <p className="text-zinc-500 text-xs mt-0.5">Base nationale FINESS · progression sauvegardée automatiquement</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <iframe
          src="/pharmacies_finess.html"
          className="w-full h-full border-0"
          title="Prospection pharmacies FINESS"
        />
      </div>
    </div>
  )
}
