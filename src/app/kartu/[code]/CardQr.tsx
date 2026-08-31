"use client";

import { Qr } from "@/components/Qr";

export function CardQr({ value }: { value: string }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <Qr value={value} size={200} />
    </div>
  );
}
