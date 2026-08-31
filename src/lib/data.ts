import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin";
import { HttpError } from "./auth";
import type { AttendanceRecord, Member, MemberStatus, TrainingSession } from "./types";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa I, O, 0, 1 biar tidak salah baca

export function generateCode(): string {
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `MSS-${out}`;
}

export async function createUniqueCode(): Promise<string> {
  const db = adminDb();
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateCode();
    const hit = await db.collection("members").where("code", "==", code).limit(1).get();
    if (hit.empty) return code;
  }
  throw new HttpError(500, "Gagal membuat kode unik, coba lagi.");
}

export function memberFromDoc(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot
): Member {
  const d = doc.data() ?? {};
  return {
    id: doc.id,
    code: d.code ?? "",
    name: d.name ?? "",
    phone: d.phone ?? "",
    address: d.address ?? "",
    status: (d.status as MemberStatus) ?? "calon",
    attendanceCount: d.attendanceCount ?? 0,
    firstAttendedAt: d.firstAttendedAt ?? null,
    lastAttendedAt: d.lastAttendedAt ?? null,
    createdAt: d.createdAt ?? "",
    note: d.note ?? "",
  };
}

export function sessionFromDoc(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot
): TrainingSession {
  const d = doc.data() ?? {};
  return {
    id: doc.id,
    title: d.title ?? "",
    date: d.date ?? "",
    startTime: d.startTime ?? "",
    location: d.location ?? "",
    open: d.open ?? false,
    createdAt: d.createdAt ?? "",
    createdBy: d.createdBy ?? "",
    attendeeCount: d.attendeeCount ?? 0,
  };
}

/**
 * Catat kehadiran. Idempoten: satu member hanya tercatat sekali per sesi.
 * Kalau ini latihan pertamanya, status otomatis naik dari "calon" jadi "member".
 */
export async function recordAttendance(opts: {
  sessionId: string;
  memberId: string;
  method: AttendanceRecord["method"];
}): Promise<{ record: AttendanceRecord; alreadyIn: boolean; promoted: boolean }> {
  const db = adminDb();
  const sessionRef = db.collection("sessions").doc(opts.sessionId);
  const memberRef = db.collection("members").doc(opts.memberId);
  const recordRef = sessionRef.collection("attendance").doc(opts.memberId);

  return db.runTransaction(async (tx) => {
    const [sessionSnap, memberSnap, recordSnap] = await Promise.all([
      tx.get(sessionRef),
      tx.get(memberRef),
      tx.get(recordRef),
    ]);

    if (!sessionSnap.exists) throw new HttpError(404, "Sesi latihan tidak ditemukan.");
    if (!memberSnap.exists) throw new HttpError(404, "Data anggota tidak ditemukan.");

    const session = sessionFromDoc(sessionSnap);
    if (!session.open) throw new HttpError(409, "Presensi untuk sesi ini sudah ditutup.");

    const member = memberFromDoc(memberSnap);

    if (recordSnap.exists) {
      return {
        record: recordSnap.data() as AttendanceRecord,
        alreadyIn: true,
        promoted: false,
      };
    }

    const now = new Date().toISOString();
    const promoted = member.status === "calon";

    const record: AttendanceRecord = {
      memberId: member.id,
      code: member.code,
      name: member.name,
      status: "member",
      method: opts.method,
      at: now,
    };

    tx.set(recordRef, record);
    tx.update(sessionRef, { attendeeCount: FieldValue.increment(1) });
    tx.update(memberRef, {
      status: "member",
      attendanceCount: FieldValue.increment(1),
      lastAttendedAt: now,
      ...(member.firstAttendedAt ? {} : { firstAttendedAt: now }),
    });

    return { record, alreadyIn: false, promoted };
  });
}
