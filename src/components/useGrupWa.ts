"use client";

import { useEffect, useState } from "react";
import { WA_GROUPS } from "@/lib/config";

export type GrupWa = {
  calon: string;
  member: string;
  pesanPembuka: string;
  pesanCatatan: string;
  htmDefault: string;
};

/**
 * Link grup WhatsApp yang diatur pengurus di panel admin.
 * Selama masih dimuat, dipakai nilai dari environment (kalau ada).
 */
export function useGrupWa(): GrupWa {
  const [grup, setGrup] = useState<GrupWa>({
    calon: WA_GROUPS.calon.url,
    member: WA_GROUPS.member.url,
    pesanPembuka: "",
    pesanCatatan: "",
    htmDefault: "10000 + Infaq Terbaik",
  });

  useEffect(() => {
    fetch("/api/public/pengaturan")
      .then((r) => r.json())
      .then((d) =>
        setGrup({
          calon: d.waGroupCalon ?? "",
          member: d.waGroupMember ?? "",
          pesanPembuka: d.pesanPembuka ?? "",
          pesanCatatan: d.pesanCatatan ?? "",
          htmDefault: d.htmDefault ?? "10000 + Infaq Terbaik",
        })
      )
      .catch(() => {});
  }, []);

  return grup;
}
