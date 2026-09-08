"use client";

import { useEffect, useRef, useState } from "react";
import { ADMIN_CONTACTS, waLink } from "@/lib/config";
import { IconWhatsapp } from "./Icons";

const PESAN =
  "Assalamualaikum Admin, saya ingin tanya seputar pendaftaran MSS Chapter Bangkalan...";

/**
 * Tombol WhatsApp melayang di pojok kanan bawah.
 * Diklik → memunculkan pilihan admin yang mau dihubungi.
 */
export function FabWa() {
  const [buka, setBuka] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Tutup kalau menyentuh di luar tombol atau menekan Esc.
  useEffect(() => {
    if (!buka) return;
    function klikLuar(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setBuka(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setBuka(false);
    }
    document.addEventListener("mousedown", klikLuar);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", klikLuar);
      document.removeEventListener("keydown", esc);
    };
  }, [buka]);

  return (
    <div ref={wrapRef} className="fab-wa no-print">
      {/* Pilihan admin */}
      <div className={`fab-menu ${buka ? "fab-menu-buka" : ""}`} aria-hidden={!buka}>
        <p className="fab-judul">Tanya langsung ke admin</p>
        {ADMIN_CONTACTS.map((a) => (
          <a
            key={a.phone}
            href={waLink(a.phone, `Assalamualaikum Admin ${a.name}, ${PESAN.split(", ")[1]}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="fab-item"
            tabIndex={buka ? 0 : -1}
            onClick={() => setBuka(false)}
          >
            <span className="fab-avatar">
              <IconWhatsapp className="h-4 w-4" />
            </span>
            <span>
              <b>Admin {a.name}</b>
              <span className="fab-peran">{a.role}</span>
            </span>
          </a>
        ))}
      </div>

      {/* Tombol utama */}
      <button
        type="button"
        onClick={() => setBuka((v) => !v)}
        className={`fab-tombol ${buka ? "fab-tombol-aktif" : ""}`}
        aria-expanded={buka}
        aria-label={buka ? "Tutup pilihan admin" : "Hubungi admin lewat WhatsApp"}
      >
        {buka ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        ) : (
          <IconWhatsapp className="h-7 w-7" />
        )}
      </button>
    </div>
  );
}
