import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin";
import { HttpError } from "./auth";
import { cekWaktuPresensi } from "./waktu";
import type {
  AttendanceRecord,
  Member,
  MemberStatus,
  Pelatih,
  RsvpEntry,
  Schedule,
  ScheduleStatus,
  TrainingSession,
  Verifikasi,
  Week,
} from "./types";

/**
 * Baca kolom verifikasi. Dokumen lama (hasil impor 400-an data lama, atau
 * dibuat sebelum fitur screening ada) tidak punya kolom ini — mereka sudah
 * lolos seleksi manual, jadi dianggap "disetujui" supaya tidak terkunci.
 */
export function bacaVerifikasi(v: unknown): Verifikasi {
  return v === "menunggu" || v === "ditolak" || v === "ditunda" ? v : "disetujui";
}

/** Pesan penolakan yang ditampilkan ke orangnya saat mencoba ikut latihan. */
function pesanBelumLolos(m: Member): string {
  const catatan = m.verifikasiCatatan ? ` Catatan pengurus: ${m.verifikasiCatatan}` : "";
  if (m.verifikasi === "ditunda") {
    return `Keikutsertaanmu ditunda sementara oleh pengurus.${catatan} Kalau kondisinya sudah pulih, kabari admin untuk diaktifkan lagi.`;
  }
  if (m.verifikasi === "ditolak") {
    return `Pendaftaranmu belum bisa dilanjutkan.${catatan} Silakan hubungi admin MSS.`;
  }
  return "Pendaftaranmu masih menunggu verifikasi pengurus. Tunggu kabar dari admin ya.";
}

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

/** Kode RP sengaja berawalan "RP-" supaya tidak pernah bentrok dengan kode member. */
export async function createUniqueCodePelatih(): Promise<string> {
  const db = adminDb();
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateCode().replace(/^MSS-/, "RP-");
    const hit = await db.collection("pelatih").where("code", "==", code).limit(1).get();
    if (hit.empty) return code;
  }
  throw new HttpError(500, "Gagal membuat kode unik, coba lagi.");
}

export function pelatihFromDoc(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot
): Pelatih {
  const d = doc.data() ?? {};
  return {
    id: doc.id,
    code: d.code ?? "",
    name: d.name ?? "",
    nickname: d.nickname ?? "",
    phone: d.phone ?? "",
    age: d.age ?? "",
    gender: d.gender ?? "",
    religion: d.religion ?? "",
    maritalStatus: d.maritalStatus ?? "",
    job: d.job ?? "",
    birthPlace: d.birthPlace ?? "",
    birthDate: d.birthDate ?? "",
    address: d.address ?? "",
    district: d.district ?? "",
    city: d.city ?? "",
    province: d.province ?? "",
    tftSudah: d.tftSudah ?? "",
    tftTahun: d.tftTahun ?? "",
    tftLevel: d.tftLevel ?? "",
    tftBatch: d.tftBatch ?? "",
    tftInfo: d.tftInfo ?? "",
    note: d.note ?? "",
    source: d.source ?? "",
    attendanceCount: d.attendanceCount ?? 0,
    lastAttendedAt: d.lastAttendedAt ?? null,
    createdAt: d.createdAt ?? "",
    deletedAt: d.deletedAt ?? null,
    deletedBy: d.deletedBy ?? "",
  };
}

/** Cari RP (yang belum dihapus) dari kode kartunya. */
export async function cariPelatihByCode(code: string) {
  const hit = await adminDb().collection("pelatih").where("code", "==", code).limit(1).get();
  if (hit.empty || hit.docs[0].get("deletedAt")) return null;
  return hit.docs[0];
}

/**
 * Presensi Relawan Pelatih (RP) — saat melatih atau kegiatan lain.
 * Tidak lewat gerbang ngelist/verifikasi seperti peserta, dan TIDAK dihitung
 * sebagai peserta (attendeeCount tidak bertambah); tampil dengan peran "pelatih".
 */
export async function recordAttendancePelatih(opts: {
  sessionId: string;
  pelatihId: string;
  method: AttendanceRecord["method"];
}): Promise<{ record: AttendanceRecord; alreadyIn: boolean }> {
  const db = adminDb();
  const sessionRef = db.collection("sessions").doc(opts.sessionId);
  const pelatihRef = db.collection("pelatih").doc(opts.pelatihId);
  const recordRef = sessionRef.collection("attendance").doc(opts.pelatihId);

  return db.runTransaction(async (tx) => {
    const [sessionSnap, pelatihSnap, recordSnap] = await Promise.all([
      tx.get(sessionRef),
      tx.get(pelatihRef),
      tx.get(recordRef),
    ]);
    if (!sessionSnap.exists || sessionSnap.get("deletedAt")) {
      throw new HttpError(404, "Sesi latihan tidak ditemukan.");
    }
    if (!pelatihSnap.exists || pelatihSnap.get("deletedAt")) {
      throw new HttpError(404, "Data relawan pelatih tidak ditemukan.");
    }
    if (!sessionSnap.get("open")) throw new HttpError(409, "Presensi untuk sesi ini sudah ditutup.");

    if (recordSnap.exists) {
      return { record: recordSnap.data() as AttendanceRecord, alreadyIn: true };
    }
    const now = new Date().toISOString();
    const p = pelatihFromDoc(pelatihSnap);
    const record: AttendanceRecord = {
      memberId: p.id,
      code: p.code,
      name: p.name,
      status: "member",
      method: opts.method,
      at: now,
      peran: "pelatih",
    };
    tx.set(recordRef, record);
    tx.update(pelatihRef, {
      attendanceCount: FieldValue.increment(1),
      lastAttendedAt: now,
    });
    return { record, alreadyIn: false };
  });
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
    source: d.source ?? "",
    deletedAt: d.deletedAt ?? null,
    deletedBy: d.deletedBy ?? "",
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
    grupMemberDikirimAt: d.grupMemberDikirimAt ?? null,
    grupMemberDikirimBy: d.grupMemberDikirimBy ?? "",
    status: (d.status as MemberStatus) ?? "calon",
    verifikasi: bacaVerifikasi(d.verifikasi),
    verifikasiAt: d.verifikasiAt ?? null,
    verifikasiBy: d.verifikasiBy ?? "",
    verifikasiCatatan: d.verifikasiCatatan ?? "",
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
    deletedAt: d.deletedAt ?? null,
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
    if (!sessionSnap.exists || sessionSnap.get("deletedAt")) throw new HttpError(404, "Sesi latihan tidak ditemukan.");
    if (!memberSnap.exists || memberSnap.get("deletedAt")) throw new HttpError(404, "Data member tidak ditemukan.");

    const session = sessionFromDoc(sessionSnap);
    if (rsvpSnap.exists) return { alreadyIn: true, session };

    const waktu = cekWaktuPresensi(session.date, session.startTime ?? "");
    if (!waktu.boleh && waktu.alasan === "lewat") {
      throw new HttpError(409, "Sesi ini sudah lewat, tidak bisa ngelist lagi.");
    }
    if (session.quota > 0 && session.rsvpCount >= session.quota) {
      throw new HttpError(409, "Kuota sesi ini sudah penuh.");
    }

    const member = memberFromDoc(memberSnap);
    // Screening pengurus: yang belum disetujui tidak boleh ngelist sama sekali.
    if (member.verifikasi !== "disetujui") {
      throw new HttpError(403, pesanBelumLolos(member));
    }

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

    if (!sessionSnap.exists || sessionSnap.get("deletedAt")) throw new HttpError(404, "Sesi latihan tidak ditemukan.");
    if (!memberSnap.exists || memberSnap.get("deletedAt")) throw new HttpError(404, "Data member tidak ditemukan.");

    const session = sessionFromDoc(sessionSnap);
    if (!session.open) throw new HttpError(409, "Presensi untuk sesi ini sudah ditutup.");

    // Belum waktunya (atau sudah lewat) — kecuali relawan pelatih menimpanya.
    if (!opts.force) {
      const waktu = cekWaktuPresensi(session.date, session.startTime ?? "");
      if (!waktu.boleh) throw new HttpError(409, waktu.pesan);
    }

    const member = memberFromDoc(memberSnap);

    // Berlaku juga saat relawan pelatih menimpa lewat "Tetap catat hadir":
    // yang belum lolos screening memang belum boleh masuk kolam.
    if (member.verifikasi !== "disetujui") {
      throw new HttpError(
        403,
        member.verifikasi === "menunggu"
          ? `${member.name} belum diverifikasi pengurus, jadi belum boleh ikut latihan.`
          : `${member.name} sedang tidak diizinkan ikut latihan (${member.verifikasi}). Hubungi admin.`
      );
    }

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

/**
 * Indeks nama untuk pencarian di halaman "ngelist".
 *
 * Firestore tidak punya pencarian "mengandung kata", jadi daftar nama dibaca
 * lalu disaring di memori. Supaya tiap ketikan tidak membaca ratusan dokumen,
 * hasilnya ditahan sebentar di memori server.
 */
const INDEKS_UMUR_MS = 60_000;
type BarisIndeks = {
  id: string;
  name: string;
  status: MemberStatus;
  verifikasi: Verifikasi;
  catatan: string;
};
let indeksNama: { at: number; data: BarisIndeks[] } | null = null;

export async function cariNama(q: string, batas = 12) {
  const now = Date.now();
  if (!indeksNama || now - indeksNama.at > INDEKS_UMUR_MS) {
    const snap = await adminDb()
      .collection("members")
      .select("name", "status", "verifikasi", "verifikasiCatatan", "deletedAt")
      .get();
    indeksNama = {
      at: now,
      data: snap.docs.filter((d) => !d.get("deletedAt")).map((d) => ({
        id: d.id,
        name: String(d.get("name") ?? ""),
        status: (d.get("status") as MemberStatus) ?? "calon",
        verifikasi: bacaVerifikasi(d.get("verifikasi")),
        catatan: String(d.get("verifikasiCatatan") ?? ""),
      })),
    };
  }
  const kunci = q.trim().toLowerCase();
  return indeksNama.data
    .filter((m) => m.name.toLowerCase().includes(kunci))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, batas);
}

/** Dipanggil setelah ada member baru supaya indeks tidak basi. */
export function resetIndeksNama() {
  indeksNama = null;
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
    deletedAt: d.deletedAt ?? null,
  };
}

/** Jadwal latihan, urut sesuai kolom order. Aman dipanggil saat DB kosong. */
export async function listSchedules(opts: { dihapus?: boolean } = {}): Promise<Schedule[]> {
  const snap = await adminDb().collection("schedules").orderBy("order").get();
  return snap.docs
    .map(scheduleFromDoc)
    .filter((s) => (opts.dihapus ? Boolean(s.deletedAt) : !s.deletedAt));
}
