import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  YEARS,
  type Program,
  type Year,
  capaian,
  formatIDR,
} from "@/lib/renstra-data";
import {
  Activity,
  TrendingUp,
  Wallet,
  Target as TargetIcon,
} from "lucide-react";

interface Props {
  programs: Program[];
  isGuest?: boolean;
}

export function ExecutiveOverview({ programs, isGuest = false }: Props) {
  const [programFilter, setProgramFilter] = useState<string>("all");

  const filtered = useMemo(
    () => (programFilter === "all" ? programs : programs.filter((p) => p.id === programFilter)),
    [programs, programFilter],
  );

  const stats = useMemo(() => {
    const allIndikator = filtered.flatMap((p) => p.sasaran.flatMap((s) => s.indikator));
    const totalProgram = filtered.length;
    const totalSasaran = filtered.reduce((acc, p) => acc + p.sasaran.length, 0);
    const totalIndikator = allIndikator.length;

    let progressSum = 0;
    let progressCount = 0;

    for (const ind of allIndikator) {
      for (const y of YEARS) {
        const v = ind.values[y];
        if (v.actual > 0) {
          progressSum += Math.min(capaian(v.actual, v.target), 150);
          progressCount += 1;
        }
      }
    }

    const overallProgress = progressCount === 0 ? 0 : progressSum / progressCount;

    return {
      totalProgram,
      totalSasaran,
      totalIndikator,
      overallProgress,
    };
  }, [filtered]);

  const trendData = useMemo(() => {
    return YEARS.map((y) => {
      const allIndikator = filtered.flatMap((p) => p.sasaran.flatMap((s) => s.indikator));
      let sum = 0;
      let count = 0;
      for (const ind of allIndikator) {
        const v = ind.values[y];
        if (v.target > 0 && v.actual > 0) {
          sum += Math.min(capaian(v.actual, v.target), 150);
          count++;
        }
      }
      return {
        year: String(y),
        capaian: count === 0 ? null : Math.round((sum / count) * 10) / 10,
      };
    });
  }, [filtered]);

  const programBarData = useMemo(
    () =>
      filtered.map((p) => {
        const inds = p.sasaran.flatMap((s) => s.indikator);
        let sum = 0;
        let count = 0;
        for (const ind of inds) {
          for (const y of YEARS) {
            const v = ind.values[y];
            if (v.target > 0 && v.actual > 0) {
              sum += Math.min(capaian(v.actual, v.target), 150);
              count++;
            }
          }
        }
        return {
          name: p.nama.length > 28 ? p.nama.slice(0, 28) + "…" : p.nama,
          capaian: count === 0 ? 0 : Math.round((sum / count) * 10) / 10,
        };
      }),
    [filtered],
  );

  return (
    <div className="space-y-8">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
            Filter Program
          </span>
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className="w-full sm:w-[320px] bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Program</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Badge variant="secondary" className="font-mono text-xs self-start sm:self-auto">
          Periode 2026 — 2030
        </Badge>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <KpiCard
          icon={<Activity className="h-4 w-4" />}
          label="Total Program"
          value={String(stats.totalProgram)}
          sub={`${stats.totalSasaran} Sasaran · ${stats.totalIndikator} Indikator`}
        />
        <KpiCard
          icon={<TargetIcon className="h-4 w-4" />}
          label="Total Sasaran & Indikator"
          value={String(stats.totalSasaran)}
          sub={`${stats.totalIndikator} Indikator Kinerja Terpantau`}
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Overall Progress"
          value={`${stats.overallProgress.toFixed(1)}%`}
          sub="Rata-rata capaian seluruh indikator"
          progress={Math.min(stats.overallProgress, 100)}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tren Capaian Tahunan (%)</CardTitle>
            <p className="text-xs text-muted-foreground">
              Rata-rata capaian indikator kinerja per tahun
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.012 250)" />
                  <XAxis dataKey="year" stroke="oklch(0.5 0.025 250)" fontSize={12} />
                  <YAxis stroke="oklch(0.5 0.025 250)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid oklch(0.91 0.012 250)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="capaian"
                    name="Capaian (%)"
                    stroke="oklch(0.6 0.18 250)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "oklch(0.6 0.18 250)" }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Capaian per Program</CardTitle>
            <p className="text-xs text-muted-foreground">Akumulasi rata-rata 5 tahun</p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={programBarData} layout="vertical" margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.012 250)" />
                  <XAxis type="number" stroke="oklch(0.5 0.025 250)" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="oklch(0.5 0.025 250)" fontSize={10} width={110} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid oklch(0.91 0.012 250)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="capaian" fill="oklch(0.6 0.18 250)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  progress?: number;
}) {
  return (
    <Card className="shadow-card border-border/70">
      <CardContent className="pt-4 pb-4 sm:pt-5 sm:pb-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-7 w-7 rounded-md bg-accent/10 text-accent flex items-center justify-center shrink-0">
            {icon}
          </div>
          <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider truncate">
            {label}
          </span>
        </div>
        <div className="mt-2 sm:mt-3 text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground break-words">
          {value}
        </div>
        {sub && (
          <div className="mt-1 text-[11px] sm:text-xs text-muted-foreground line-clamp-2">
            {sub}
          </div>
        )}
        {progress !== undefined && (
          <Progress value={progress} className="mt-3 h-1.5" />
        )}
      </CardContent>
    </Card>
  );
}
