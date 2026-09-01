export type MemberStatus = "calon" | "member";

export type Member = {
  id: string;
  /** Kode unik untuk kartu QR, mis. MSS-7F3K2Q */
  code: string;
  name: string;
  phone?: string;
  address?: string;
  job?: string;
  reason?: string;
  /** Data pendaftaran calon member (mengikuti formulir MSS). */
  nickname?: string;
  age?: string;
  gender?: string;
  religion?: string;
  maritalStatus?: string;
  canSwim?: string;
  waterTrauma?: string;
  healthNotes?: string;
  isSwimCoach?: string;
  knowFrom?: string;
  /** Data tambahan yang diminta formulir MSS Pusat. */
  birthPlace?: string;
  birthDate?: string;
  district?: string;
  city?: string;
  province?: string;
  /** Kapan link isian MSS Pusat dibuka member (sejauh yang bisa kita tahu). */
  pusatOpenedAt?: string | null;
  status: MemberStatus;
  attendanceCount: number;
  firstAttendedAt?: string | null;
  lastAttendedAt?: string | null;
  createdAt: string;
  note?: string;
};

export type TrainingSession = {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  startTime?: string;
  location?: string;
  open: boolean;
  createdAt: string;
  createdBy: string;
  attendeeCount: number;
  /** Jumlah orang yang sudah ngelist ikut. */
  rsvpCount: number;
  /** 0 = tanpa batas. */
  quota: number;
  /** Nama relawan pelatih yang mendampingi sesi ini. */
  coaches: string[];
  /** HTM / biaya masuk, mis. "10000 + Infaq Terbaik". */
  fee: string;
  weekId?: string;
};

export type AttendanceRecord = {
  memberId: string;
  code: string;
  name: string;
  status: MemberStatus;
  method: "mandiri" | "scan-kartu";
  at: string;
};

export type ScheduleStatus = "Tersedia" | "Penuh";

export type Schedule = {
  id: string;
  day: string;
  time: string;
  pool: string;
  status: ScheduleStatus;
  order: number;
};

/** Satu paket jadwal mingguan yang dibuat relawan pelatih tiap Senin. */
export type Week = {
  id: string;
  label: string;
  /** YYYY-MM-DD */
  startDate: string;
  endDate: string;
  open: boolean;
  createdAt: string;
  createdBy: string;
  sessionCount: number;
};

export type RsvpEntry = {
  memberId: string;
  code: string;
  name: string;
  /** Status saat ngelist — supaya relawan pelatih tahu ini calon atau member. */
  status: MemberStatus;
  at: string;
  attended: boolean;
};

/** Pemetaan isian app ke pertanyaan pada formulir Google MSS Pusat. */
export type PusatEntry = {
  /** ID pertanyaan pada Google Form, mis. "1234567890". */
  entryId: string;
  type: "text" | "date";
  /** Contoh jawaban yang diketik admin saat membuat tautan isian otomatis. */
  sample: string;
  /** Isian app yang dipasangkan; kosong = tidak dikirim. */
  field: string;
};

export type PusatConfig = {
  formUrl: string;
  entries: PusatEntry[];
  updatedAt: string;
  updatedBy: string;
};
