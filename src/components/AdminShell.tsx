"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin } from "./useAdmin";

const NAV = [
  { href: "/admin", label: "Dasbor" },
  { href: "/admin/sesi", label: "Sesi Latihan" },
  { href: "/admin/anggota", label: "Anggota" },
  { href: "/admin/jadwal", label: "Jadwal" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAdmin();
  const pathname = usePathname();

  if (loading) {
    return <div className="p-8 text-sm text-[var(--muted)]">Memuat…</div>;
  }
  if (!user) return null;

  return (
    <div className="min-h-screen">
      <header className="no-print border-b border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <Image src="/logo.png" alt="MSS" width={32} height={32} />
            <span className="wordmark leading-tight">
              MSS <span className="text-[var(--accent)]">Bangkalan</span>
            </span>
          </Link>
          <nav className="flex gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    active
                      ? "bg-[var(--accent)] font-semibold text-white"
                      : "text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--ink)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-xs text-[var(--muted)]">
            <span className="hidden sm:inline">{user.email}</span>
            <button onClick={logout} className="btn btn-ghost px-3 py-1 text-xs">
              Keluar
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
