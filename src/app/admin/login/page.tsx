"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      router.replace("/admin");
    } catch {
      setError("Email atau kata sandi salah.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wave-top flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="panel w-full max-w-sm p-6">
        <Image src="/logo.png" alt="MSS" width={64} height={64} className="mb-3" />
        <h1 className="wordmark text-xl">
          MSS <span className="text-[var(--accent)]">Bangkalan</span>
        </h1>
        <p className="mt-1 mb-5 text-sm text-[var(--muted)]">Masuk sebagai pengurus.</p>

        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          className="field mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />

        <label className="label" htmlFor="password">
          Kata sandi
        </label>
        <input
          id="password"
          type="password"
          required
          className="field mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error && <p className="mb-3 text-sm text-[var(--danger)]">{error}</p>}

        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy ? "Memproses…" : "Masuk"}
        </button>
      </form>
    </div>
  );
}
