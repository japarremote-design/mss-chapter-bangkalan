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
