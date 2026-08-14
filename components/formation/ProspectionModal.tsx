"use client"

import { useState } from "react"
import { X } from "lucide-react"

export default function ProspectionModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 font-black text-sm tracking-widest uppercase transition-all rounded-2xl py-3.5 px-4"
        style={{
          background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
          color: "#fff",
          boxShadow: "0 4px 20px rgba(14,165,233,0.40)",
          border: "none",
          letterSpacing: "0.12em",
          fontSize: "13px",
        }}>
        💊 Prospection
      </button>

      {open && (
        <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: "#fff" }}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 shrink-0"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)" }}>
            <span className="text-white font-black text-base tracking-widest uppercase">💊 Prospection Pharmacies</span>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
              <X size={15}/> Fermer
            </button>
          </div>
          <iframe
            src="/pharmacies_finess.html"
            className="flex-1 border-0 w-full"
            title="Prospection pharmacies FINESS"
          />
        </div>
      )}
    </>
  )
}
