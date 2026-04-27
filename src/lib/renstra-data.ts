export const YEARS = [2025, 2026, 2027, 2028, 2029] as const;
export type Year = (typeof YEARS)[number];

export type YearlyValue = Record<Year, { target: number; actual: number; budget: number }>;

export interface Indikator {
  id: string;
  nama: string;
  satuan: string;
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

const emptyValues = (): YearlyValue => ({
  2025: { target: 0, actual: 0, budget: 0 },
  2026: { target: 0, actual: 0, budget: 0 },
  2027: { target: 0, actual: 0, budget: 0 },
  2028: { target: 0, actual: 0, budget: 0 },
  2029: { target: 0, actual: 0, budget: 0 },
});

const v = (
  t: [number, number, number, number, number],
  a: [number, number, number, number, number],
  b: [number, number, number, number, number],
): YearlyValue => ({
  2025: { target: t[0], actual: a[0], budget: b[0] },
  2026: { target: t[1], actual: a[1], budget: b[1] },
  2027: { target: t[2], actual: a[2], budget: b[2] },
  2028: { target: t[3], actual: a[3], budget: b[3] },
  2029: { target: t[4], actual: a[4], budget: b[4] },
});

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
  {
    id: "P2",
    nama: "Program Pengembangan Sumber Daya Manusia",
    sasaran: [
      {
        id: "S3",
        nama: "Meningkatnya kompetensi aparatur sipil negara",
        indikator: [
          {
            id: "I4",
            nama: "Persentase ASN bersertifikasi kompetensi",
            satuan: "%",
            values: v([60, 70, 80, 90, 100], [55, 65, 0, 0, 0], [500_000_000, 550_000_000, 600_000_000, 650_000_000, 700_000_000]),
          },
          {
            id: "I5",
            nama: "Jumlah ASN mengikuti diklat",
            satuan: "Orang",
            values: v([200, 250, 300, 350, 400], [180, 220, 0, 0, 0], [400_000_000, 450_000_000, 500_000_000, 550_000_000, 600_000_000]),
          },
        ],
      },
    ],
  },
  {
    id: "P3",
    nama: "Program Pembangunan Infrastruktur Daerah",
    sasaran: [
      {
        id: "S4",
        nama: "Meningkatnya kualitas infrastruktur jalan",
        indikator: [
          {
            id: "I6",
            nama: "Persentase jalan kondisi mantap",
            satuan: "%",
            values: v([75, 80, 85, 90, 95], [60, 72, 0, 0, 0], [1_500_000_000, 1_700_000_000, 1_900_000_000, 2_100_000_000, 2_300_000_000]),
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
