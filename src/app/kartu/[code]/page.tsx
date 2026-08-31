import { adminDb } from "@/lib/firebaseAdmin";
import { memberFromDoc } from "@/lib/data";
import { CardQr } from "./CardQr";

export const dynamic = "force-dynamic";

export default async function KartuPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const snap = await adminDb()
    .collection("members")
    .where("code", "==", decodeURIComponent(code).toUpperCase())
    .limit(1)
    .get();

  if (snap.empty) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm items-center justify-center px-5">
        <p className="text-sm text-[var(--muted)]">Kartu tidak ditemukan.</p>
      </main>
    );
  }

  const member = memberFromDoc(snap.docs[0]);

  return (
    <main className="mx-auto max-w-sm px-5 py-10">
      <div className="panel p-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="MSS" width={72} height={72} className="mx-auto" />
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
          MSS Chapter Bangkalan
        </p>
        <h1 className="mt-2 text-xl font-bold">{member.name}</h1>
        <span
          className={`badge mt-2 ${member.status === "member" ? "badge-member" : "badge-calon"}`}
        >
          {member.status === "member" ? "ANGGOTA" : "CALON ANGGOTA"}
        </span>

        <div className="mt-5 flex justify-center">
          <CardQr value={member.code} />
        </div>

        <p className="mt-4 font-mono text-lg font-black tracking-widest">{member.code}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Total kehadiran: {member.attendanceCount}×
        </p>
      </div>

      <p className="no-print mt-4 text-center text-xs text-[var(--muted)]">
        Cetak halaman ini (Ctrl/Cmd + P) untuk dijadikan kartu fisik, atau simpan sebagai gambar di
        HP. Pengurus tinggal memindainya saat latihan.
      </p>
    </main>
  );
}
