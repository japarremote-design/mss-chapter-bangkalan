"use client";

import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PusatLangkah } from "@/components/PusatLangkah";

export default function PusatPage() {
  return (
    <Suspense fallback={null}>
      <Isi />
    </Suspense>
  );
}

function Isi() {
  const { id } = useParams<{ id: string }>();
  const k = useSearchParams().get("k") ?? "";

  return (
    <main className="wave-top min-h-screen px-5 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-center gap-3">
          <Image src="/logo.png" alt="MSS" width={44} height={44} />
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              MSS Chapter Bangkalan
            </p>
            <h1 className="font-bold">Pendataan member baru</h1>
          </div>
        </div>
        <PusatLangkah memberId={id} token={k} />
      </div>
    </main>
  );
}
