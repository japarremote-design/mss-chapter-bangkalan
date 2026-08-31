"use client";

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebaseClient";

export function useAdmin(redirect = true) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), (u) => {
      setUser(u);
      setLoading(false);
      if (!u && redirect) router.replace("/admin/login");
    });
  }, [redirect, router]);

  /** fetch() yang otomatis menempelkan ID token Firebase. */
  const api = useCallback(async <T,>(url: string, init: RequestInit = {}): Promise<T> => {
    const current = getFirebaseAuth().currentUser;
    if (!current) throw new Error("Belum login.");
    const token = await current.getIdToken();
    const res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error ?? "Gagal memuat data.");
    return data as T;
  }, []);

  const logout = useCallback(async () => {
    await signOut(getFirebaseAuth());
    router.replace("/admin/login");
  }, [router]);

  return { user, loading, api, logout };
}
