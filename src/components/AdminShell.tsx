"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin } from "./useAdmin";

const NAV = [
  { href: "/admin", label: "Dasbor" },
  { href: "/admin/sesi", label: "Sesi Latihan" },
  { href: "/admin/verifikasi", label: "Verifikasi" },
  { href: "/admin/member", label: "Member" },
  { href: "/admin/jadwal", label: "Jadwal" },
  { href: "/admin/pusat", label: "MSS Pusat" },
  { href: "/admin/sampah", label: "Sampah" },
  { href: "/admin/pengaturan", label: "Pengaturan" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAdmin();
  const pathname = usePathname();

  if (loading) {
    return <div className="p-8 text-sm text-[var(--muted)]">Memuat…</div>;
  }
  if (!user) return null;

  return (
    <div className="admin-ui min-h-screen">
      <header className="no-print bg-[#0d2438] text-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4">
          <Link href="/admin" className="flex shrink-0 items-center gap-2 py-3">
            <Image src="/logo.png" alt="MSS" width={28} height={28} />
            <span className="text-sm font-semibold tracking-tight">
              MSS Bangkalan <span className="font-normal text-white/50">· Pengurus</span>
            </span>
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-3 text-xs text-white/60">
            <span className="hidden sm:inline">{user.email}</span>
            <button
              onClick={logout}
              className="rounded border border-white/25 px-2.5 py-1 text-white/80 transition hover:bg-white/10"
            >
              Keluar
            </button>
          </div>
        </div>
        <nav className="border-t border-white/10">
          <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
            {NAV.map((item) => {
              const active =
                item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm transition ${
                    active
                      ? "border-[#4cb8ee] font-medium text-white"
                      : "border-transparent text-white/60 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
