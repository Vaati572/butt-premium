"use client"

import { useState } from "react"
import { X } from "lucide-react"

export default function FormationModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 font-black text-sm uppercase transition-all rounded-2xl py-3.5 px-4"
        style={{
          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          color: "#fff",
          boxShadow: "0 4px 20px rgba(124,58,237,0.45)",
          border: "none",
          letterSpacing: "0.12em",
          fontSize: "13px",
        }}>
        🎓 Formation
      </button>

      {open && (
        <div className="fixed inset-0 z-[300] flex flex-col">
          <div
            className="flex items-center justify-between px-5 py-3 shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
            <span className="text-white font-black text-base tracking-widest uppercase">
              🎓 Formation — Éclats et Strass
            </span>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
              <X size={15} /> Fermer
            </button>
          </div>
          <iframe
            src="/formation.html"
            className="flex-1 border-0 w-full"
            title="Formation Éclats et Strass"
          />
        </div>
      )}
    </>
  )
}
