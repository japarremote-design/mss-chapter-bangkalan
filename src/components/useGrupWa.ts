"use client";

import { useEffect, useState } from "react";
import { WA_GROUPS } from "@/lib/config";

export type GrupWa = { calon: string; member: string };

/**
 * Link grup WhatsApp yang diatur pengurus di panel admin.
 * Selama masih dimuat, dipakai nilai dari environment (kalau ada).
 */
export function useGrupWa(): GrupWa {
  const [grup, setGrup] = useState<GrupWa>({
    calon: WA_GROUPS.calon.url,
    member: WA_GROUPS.member.url,
  });

  useEffect(() => {
    fetch("/api/public/pengaturan")
      .then((r) => r.json())
      .then((d) =>
        setGrup({ calon: d.waGroupCalon ?? "", member: d.waGroupMember ?? "" })
      )
      .catch(() => {});
  }, []);

  return grup;
}
