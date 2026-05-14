import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RenstraTable } from "@/components/RenstraTable";
import { YEARS, capaian, type Program, type Year } from "@/lib/renstra-data";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LineChart,
  Sparkles,
  Table2,
  Target,
  TrendingUp,
} from "lucide-react";

function getAllIndicators(programs: Program[]) {
  return programs.flatMap((program) =>
    program.sasaran.flatMap((sasaran) =>
      sasaran.indikator.map((indikator) => ({ program, sasaran, indikator })),
    ),
  );
}

function averageProgress(programs: Program[], year: Year = YEARS[0]) {
  const indicators = getAllIndicators(programs);
  let total = 0;
  let count = 0;

  indicators.forEach(({ indikator }) => {
    const value = indikator.values[year];
    if (value.target > 0) {
      total += Math.min(capaian(value.actual, value.target), 100);
      count += 1;
    }
  });

  return count === 0 ? 0 : Math.round(total / count);
}

function getDashboardData(programs: Program[]) {
  const indicators = getAllIndicators(programs);
  const currentYear = YEARS[0];
  const average = averageProgress(programs, currentYear);
  const completed = indicators.filter(({ indikator }) => {
    const value = indikator.values[currentYear];
    return value.target > 0 && capaian(value.actual, value.target) >= 100;
  }).length;

  const trendData = YEARS.map((year) => ({
    year: String(year),
    capaian: averageProgress(programs, year),
  }));

  const programBars = programs.map((program, index) => ({
    name: program.nama.length > 22 ? `${program.nama.slice(0, 22)}...` : program.nama,
    capaian: averageProgress([program], currentYear),
    color: ["#4f8fb8", "#5eb99f", "#d7a64f", "#8b7bd1", "#d66f7d"][index % 5],
  }));

  const topIndicators = indicators
    .map(({ indikator, program }) => {
      const value = indikator.values[currentYear];
      return {
        id: indikator.id,
        name: indikator.nama,
        program: program.nama,
        progress: Math.round(Math.min(capaian(value.actual, value.target), 100)),
      };
    })
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 5);

  const bidangMap = new Map<string, { total: number; count: number }>();
  indicators.forEach(({ indikator }) => {
    const bidang = indikator.bagian || "Umum";
    const value = indikator.values[currentYear];
    const current = bidangMap.get(bidang) || { total: 0, count: 0 };
    if (value.target > 0) {
      current.total += Math.min(capaian(value.actual, value.target), 100);
      current.count += 1;
    }
    bidangMap.set(bidang, current);
  });

  const bidangRows = Array.from(bidangMap.entries()).map(([name, item]) => {
    const progress = item.count === 0 ? 0 : Math.round(item.total / item.count);
    return {
      name,
      progress,
      status: progress >= 90 ? "Sangat Baik" : progress >= 70 ? "Baik" : "Cukup",
    };
  });

  return {
    indicators,
    currentYear,
    average,
    completed,
    trendData,
    programBars,
    topIndicators,
    bidangRows,
  };
}

export function GuestDashboardPageContent({ programs }: { programs: Program[] }) {
  return <DashboardOverview programs={programs} mode="guest" />;
}

export function GuestTablePageContent() {
  return (
    <div id="report-content" className="animate-in fade-in duration-500 rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/50 px-4 py-3">
        <Table2 className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-foreground">Daftar Capaian Renstra (Tamu)</h2>
          <p className="text-xs text-muted-foreground">Tampilan monitoring capaian indikator (hanya lihat).</p>
        </div>
      </div>
      <RenstraTable isGuest />
    </div>
  );
}

export function AdminDashboardPageContent({ programs }: { programs: Program[] }) {
  return <DashboardOverview programs={programs} mode="admin" />;
}

function DashboardOverview({ programs, mode }: { programs: Program[]; mode: "admin" | "guest" }) {
  const data = getDashboardData(programs);
  const sasaranCount = programs.reduce((total, program) => total + program.sasaran.length, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/90 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {mode === "admin" ? "Admin Monitoring" : "Guest View"}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Dashboard Renstra 2026-2030</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterPill label="Semua Program" />
          <FilterPill label={`Tahun ${data.currentYear}`} />
          <FilterPill label="Semua Bidang" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Target className="h-5 w-5" />} label="Total Program" value={programs.length} tone="blue" />
        <StatCard icon={<ClipboardList className="h-5 w-5" />} label="Indikator" value={data.indicators.length} tone="green" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Capaian" value={`${data.average}%`} tone="amber" />
        <StatCard icon={<CalendarDays className="h-5 w-5" />} label="Tahun Aktif" value={data.currentYear} tone="violet" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card className="rounded-2xl border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <LineChart className="h-5 w-5 text-primary" />
              Tren Capaian Tahunan (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trendData} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="capaianGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(156 42% 48%)" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="hsl(156 42% 48%)" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid var(--border)" }} />
                  <Area type="monotone" dataKey="capaian" stroke="hsl(156 42% 42%)" strokeWidth={2.5} fill="url(#capaianGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 bg-card/95 shadow-sm">
          <CardContent className="flex h-full flex-col justify-between p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Target 2030</p>
                <h3 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">100%</h3>
                <p className="mt-2 text-sm text-muted-foreground">Target capaian akhir periode Renstra.</p>
              </div>
              <Badge className="bg-success/12 text-success hover:bg-success/12">On Track</Badge>
            </div>
            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress saat ini</span>
                <span className="font-semibold text-primary">{data.average}%</span>
              </div>
              <Progress value={data.average} className="h-3" />
              <div className="grid grid-cols-2 gap-3 pt-4 text-sm">
                <MiniMetric label="Sasaran" value={sasaranCount} />
                <MiniMetric label="Selesai" value={data.completed} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-2xl border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <Sparkles className="h-5 w-5 text-primary" />
              Indikator Tercapai Terbaik
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.topIndicators.map((item) => (
              <div key={item.id} className="grid grid-cols-[44px_1fr] gap-3">
                <div className="flex h-20 items-end rounded-full bg-secondary/60 p-1">
                  <div className="w-full rounded-full bg-success" style={{ height: `${Math.max(item.progress, 8)}%` }} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    <span className="text-sm font-semibold text-primary">{item.progress}%</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{item.program}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <BarChart3 className="h-5 w-5 text-primary" />
              Capaian per Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.programBars} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={118} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid var(--border)" }} />
                  <Bar dataKey="capaian" radius={[0, 10, 10, 0]} barSize={14}>
                    {data.programBars.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <TrendingUp className="h-5 w-5 text-primary" />
              Capaian per Bidang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.bidangRows.map((row) => (
                <div key={row.name} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/60 px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{row.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <TinySparkline />
                      {row.progress}% capaian
                    </div>
                  </div>
                  <Badge variant="outline" className={statusClass(row.status)}>
                    {row.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AdminProgressTablePageContent({ programs }: { programs: Program[] }) {
  const rows = getAllIndicators(programs).map(({ program, sasaran, indikator }) => {
    const value = indikator.values[YEARS[0]];
    const progress = Math.round(Math.min(capaian(value.actual, value.target), 100));

    return {
      id: indikator.id,
      program: program.nama,
      sasaran: sasaran.nama,
      indikator: indikator.nama,
      target: value.target,
      actual: value.actual,
      progress,
    };
  });

  return (
    <Card id="report-content" className="rounded-2xl border-border/70 bg-card/95 shadow-sm animate-in fade-in duration-500">
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-wide">Ringkasan Persentase Selesai</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-border/70 bg-background/50 p-4 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{row.program}</p>
                <h4 className="font-bold text-foreground text-sm truncate mb-0.5">{row.indikator}</h4>
                <p className="text-xs text-muted-foreground truncate">{row.sasaran}</p>
              </div>
              <div className="flex items-center gap-6 md:w-[360px] shrink-0">
                <div className="grid grid-cols-2 gap-4 text-sm w-32 shrink-0">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Target</p>
                    <p className="font-mono font-semibold">{row.target}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Realisasi</p>
                    <p className="font-mono font-semibold text-primary">{row.actual}</p>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1 text-xs font-bold">
                    <span>Selesai</span>
                    <span className="text-primary">{row.progress}%</span>
                  </div>
                  <Progress value={row.progress} className="h-2.5 w-full" />
                </div>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada data indikator.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string | number; tone: "blue" | "green" | "amber" | "violet" }) {
  const toneClass = {
    blue: "bg-sky-100 text-sky-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
  }[tone];

  return (
    <Card className="rounded-2xl border-border/70 bg-card/95 shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${toneClass}`}>{icon}</div>
      </CardContent>
    </Card>
  );
}

function FilterPill({ label }: { label: string }) {
  return (
    <button className="rounded-full border border-border/70 bg-background px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm transition hover:text-foreground">
      {label}
    </button>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-secondary/55 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function TinySparkline() {
  return (
    <svg width="34" height="14" viewBox="0 0 34 14" className="text-success">
      <path d="M1 11 L8 8 L14 9 L21 4 L27 6 L33 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function statusClass(status: string) {
  if (status === "Sangat Baik") return "border-success/25 bg-success/10 text-success";
  if (status === "Baik") return "border-primary/25 bg-primary/10 text-primary";
  return "border-warning/35 bg-warning/15 text-warning-foreground";
}

