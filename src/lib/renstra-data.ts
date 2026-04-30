export const YEARS = [2026, 2027, 2028, 2029, 2030] as const;
export type Year = (typeof YEARS)[number];

export const MONTHS = [
  { id: 0, name: "Tahunan" },
  { id: 1, name: "Januari" },
  { id: 2, name: "Februari" },
  { id: 3, name: "Maret" },
  { id: 4, name: "April" },
  { id: 5, name: "Mei" },
  { id: 6, name: "Juni" },
  { id: 7, name: "Juli" },
  { id: 8, name: "Agustus" },
  { id: 9, name: "September" },
  { id: 10, name: "Oktober" },
  { id: 11, name: "November" },
  { id: 12, name: "Desember" },
] as const;

export type MonthlyValue = {
  target: number;
  actual: number;
  budget: number;
  months: Record<number, { actual: number }>; // Month 1-12
};

export type YearlyValue = Record<Year, MonthlyValue>;

export interface Indikator {
  id: string;
  nama: string;
  satuan: string;
  bagian?: string;
  borang_aipt?: string;
  kode?: string;
  iku_ikt?: string;
  baseline?: number;
  penjelasan?: string;
  pic?: string;
  link?: string;
  values: YearlyValue;
}

export interface Sasaran {
  id: string;
  nama: string;
  indikator: Indikator[];
}

export interface Program {
  id: string;
  nama: string;
  sasaran: Sasaran[];
}

const emptyValues = (): YearlyValue => {
  const years: any = {};
  YEARS.forEach((y) => {
    years[y] = { target: 0, actual: 0, budget: 0, months: {} };
  });
  return years as YearlyValue;
};

const v = (
  t: [number, number, number, number, number],
  a: [number, number, number, number, number],
  b: [number, number, number, number, number],
): YearlyValue => {
  const years: any = {};
  YEARS.forEach((y, i) => {
    years[y] = { target: t[i], actual: a[i], budget: b[i], months: {} };
  });
  return years as YearlyValue;
};

export const INITIAL_PROGRAMS: Program[] = [
  {
    id: "P1",
    nama: "Program Peningkatan Tata Kelola Pemerintahan",
    sasaran: [
      {
        id: "S1",
        nama: "Meningkatnya akuntabilitas kinerja organisasi",
        indikator: [
          {
            id: "I1",
            nama: "Nilai SAKIP",
            satuan: "Skor",
            values: v([78, 80, 82, 84, 86], [79, 80, 0, 0, 0], [250_000_000, 270_000_000, 290_000_000, 310_000_000, 330_000_000]),
          },
          {
            id: "I2",
            nama: "Indeks Reformasi Birokrasi",
            satuan: "Indeks",
            values: v([72, 74, 76, 78, 80], [70, 73, 0, 0, 0], [180_000_000, 200_000_000, 220_000_000, 240_000_000, 260_000_000]),
          },
        ],
      },
      {
        id: "S2",
        nama: "Meningkatnya kualitas pelayanan publik",
        indikator: [
          {
            id: "I3",
            nama: "Indeks Kepuasan Masyarakat",
            satuan: "Indeks",
            values: v([85, 87, 89, 91, 93], [86, 88, 0, 0, 0], [320_000_000, 340_000_000, 360_000_000, 380_000_000, 400_000_000]),
          },
        ],
      },
    ],
  },
];

export function getStatus(actual: number, target: number): "success" | "warning" | "danger" | "neutral" {
  if (target === 0) return "neutral";
  const ratio = actual / target;
  if (ratio >= 1) return "success";
  if (ratio >= 0.75) return "warning";
  return "danger";
}

export function capaian(actual: number, target: number): number {
  if (target === 0) return 0;
  return (actual / target) * 100;
}

export function formatIDR(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} Jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} rb`;
  return `Rp ${n}`;
}

export { emptyValues };
