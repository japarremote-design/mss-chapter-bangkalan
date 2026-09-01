import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin";
import { HttpError } from "./auth";
import type {
  AttendanceRecord,
  Member,
  MemberStatus,
  RsvpEntry,
  Schedule,
  ScheduleStatus,
  TrainingSession,
  Week,
} from "./types";

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
    job: d.job ?? "",
    reason: d.reason ?? "",
    nickname: d.nickname ?? "",
    age: d.age ?? "",
    gender: d.gender ?? "",
    religion: d.religion ?? "",
    maritalStatus: d.maritalStatus ?? "",
    canSwim: d.canSwim ?? "",
    waterTrauma: d.waterTrauma ?? "",
    healthNotes: d.healthNotes ?? "",
    isSwimCoach: d.isSwimCoach ?? "",
    knowFrom: d.knowFrom ?? "",
    birthPlace: d.birthPlace ?? "",
    birthDate: d.birthDate ?? "",
    district: d.district ?? "",
    city: d.city ?? "",
    province: d.province ?? "",
    pusatOpenedAt: d.pusatOpenedAt ?? null,
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
    rsvpCount: d.rsvpCount ?? 0,
    quota: d.quota ?? 0,
    coaches: Array.isArray(d.coaches) ? d.coaches : [],
    fee: d.fee ?? "",
    weekId: d.weekId ?? undefined,
  };
}

export function weekFromDoc(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot
): Week {
  const d = doc.data() ?? {};
  return {
    id: doc.id,
    label: d.label ?? "",
    startDate: d.startDate ?? "",
    endDate: d.endDate ?? "",
    open: d.open ?? true,
    createdAt: d.createdAt ?? "",
    createdBy: d.createdBy ?? "",
    sessionCount: d.sessionCount ?? 0,
  };
}

/**
 * Daftar ikut latihan (RSVP). Idempoten — kalau sudah terdaftar, tidak dobel.
 * Menolak kalau kuota sesi sudah penuh.
 */
export async function joinSession(sessionId: string, memberId: string) {
  const db = adminDb();
  const sessionRef = db.collection("sessions").doc(sessionId);
  const memberRef = db.collection("members").doc(memberId);
  const rsvpRef = sessionRef.collection("rsvp").doc(memberId);

  return db.runTransaction(async (tx) => {
    const [sessionSnap, memberSnap, rsvpSnap] = await Promise.all([
      tx.get(sessionRef),
      tx.get(memberRef),
      tx.get(rsvpRef),
    ]);
    if (!sessionSnap.exists) throw new HttpError(404, "Sesi latihan tidak ditemukan.");
    if (!memberSnap.exists) throw new HttpError(404, "Data member tidak ditemukan.");

    const session = sessionFromDoc(sessionSnap);
    if (rsvpSnap.exists) return { alreadyIn: true, session };
    if (session.quota > 0 && session.rsvpCount >= session.quota) {
      throw new HttpError(409, "Kuota sesi ini sudah penuh.");
    }

    const member = memberFromDoc(memberSnap);
    const entry: RsvpEntry = {
      memberId: member.id,
      code: member.code,
      name: member.name,
      status: member.status,
      at: new Date().toISOString(),
      attended: false,
    };
    tx.set(rsvpRef, entry);
    tx.update(sessionRef, { rsvpCount: FieldValue.increment(1) });
    return { alreadyIn: false, session };
  });
}

/** Batal ikut. Tidak bisa dibatalkan kalau sudah terlanjur hadir. */
export async function leaveSession(sessionId: string, memberId: string) {
  const db = adminDb();
  const sessionRef = db.collection("sessions").doc(sessionId);
  const rsvpRef = sessionRef.collection("rsvp").doc(memberId);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(rsvpRef);
    if (!snap.exists) return { removed: false };
    if ((snap.data() as RsvpEntry).attended) {
      throw new HttpError(409, "Kehadiranmu sudah tercatat, tidak bisa dibatalkan.");
    }
    tx.delete(rsvpRef);
    tx.update(sessionRef, { rsvpCount: FieldValue.increment(-1) });
    return { removed: true };
  });
}

export async function listRsvp(sessionId: string): Promise<RsvpEntry[]> {
  const snap = await adminDb()
    .collection("sessions")
    .doc(sessionId)
    .collection("rsvp")
    .orderBy("at")
    .get();
  return snap.docs.map((d) => d.data() as RsvpEntry);
}

/**
 * Catat kehadiran. Idempoten: satu member hanya tercatat sekali per sesi.
 * Kalau ini latihan pertamanya, status otomatis naik dari "calon" jadi "member".
 */
export async function recordAttendance(opts: {
  sessionId: string;
  memberId: string;
  method: AttendanceRecord["method"];
  /** Izinkan hadir walau tidak ada di daftar ikut — hanya untuk relawan pelatih. */
  force?: boolean;
}): Promise<{ record: AttendanceRecord; alreadyIn: boolean; promoted: boolean }> {
  const db = adminDb();
  const sessionRef = db.collection("sessions").doc(opts.sessionId);
  const memberRef = db.collection("members").doc(opts.memberId);
  const recordRef = sessionRef.collection("attendance").doc(opts.memberId);
  const rsvpRef = sessionRef.collection("rsvp").doc(opts.memberId);

  return db.runTransaction(async (tx) => {
    const [sessionSnap, memberSnap, recordSnap, rsvpSnap] = await Promise.all([
      tx.get(sessionRef),
      tx.get(memberRef),
      tx.get(recordRef),
      tx.get(rsvpRef),
    ]);

    if (!sessionSnap.exists) throw new HttpError(404, "Sesi latihan tidak ditemukan.");
    if (!memberSnap.exists) throw new HttpError(404, "Data member tidak ditemukan.");

    const session = sessionFromDoc(sessionSnap);
    if (!session.open) throw new HttpError(409, "Presensi untuk sesi ini sudah ditutup.");

    const member = memberFromDoc(memberSnap);

    if (!rsvpSnap.exists && !opts.force) {
      throw new HttpError(
        403,
        `${member.name} belum ngelist ikut latihan ini. Hubungi relawan pelatih untuk didaftarkan.`
      );
    }

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
    if (rsvpSnap.exists) {
      tx.update(rsvpRef, { attended: true });
    } else {
      // Dicatat paksa oleh relawan pelatih: sekalian masukkan ke daftar ikut.
      tx.set(rsvpRef, {
        memberId: member.id,
        code: member.code,
        name: member.name,
        status: member.status,
        at: now,
        attended: true,
      });
      tx.update(sessionRef, { rsvpCount: FieldValue.increment(1) });
    }
    tx.update(memberRef, {
      status: "member",
      attendanceCount: FieldValue.increment(1),
      lastAttendedAt: now,
      ...(member.firstAttendedAt ? {} : { firstAttendedAt: now }),
    });

    return { record, alreadyIn: false, promoted };
  });
}

export function scheduleFromDoc(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot
): Schedule {
  const d = doc.data() ?? {};
  return {
    id: doc.id,
    day: d.day ?? "",
    time: d.time ?? "",
    pool: d.pool ?? "",
    status: (d.status as ScheduleStatus) === "Penuh" ? "Penuh" : "Tersedia",
    order: typeof d.order === "number" ? d.order : 0,
  };
}

/** Jadwal latihan, urut sesuai kolom order. Aman dipanggil saat DB kosong. */
export async function listSchedules(): Promise<Schedule[]> {
  const snap = await adminDb().collection("schedules").orderBy("order").get();
  return snap.docs.map(scheduleFromDoc);
}
