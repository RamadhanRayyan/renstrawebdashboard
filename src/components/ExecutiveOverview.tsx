import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  PieChart,
  Pie,
} from "recharts";
import {
  YEARS,
  MONTHS,
  type Program,
  type Year,
  capaian,
} from "@/lib/renstra-data";
import {
  Activity,
  TrendingUp,
  Target as TargetIcon,
  Layers,
  CheckCircle2,
  Calendar,
  Zap,
  ArrowUpRight,
  Filter,
} from "lucide-react";


interface Props {
  programs: Program[];
  isGuest?: boolean;
}

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
];

export function ExecutiveOverview({ programs, isGuest = false }: Props) {
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<Year>(YEARS[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const filtered = useMemo(
    () =>
      programFilter === "all"
        ? programs
        : programs.filter((p) => p.id === programFilter),
    [programs, programFilter]
  );

  const stats = useMemo(() => {
    const allIndikator = filtered.flatMap((p) =>
      p.sasaran.flatMap((s) => s.indikator)
    );
    const totalProgram = filtered.length;
    const totalSasaran = filtered.reduce((acc, p) => acc + p.sasaran.length, 0);
    const totalIndikator = allIndikator.length;

    let progressSum = 0;
    let progressCount = 0;

    for (const ind of allIndikator) {
      if (selectedMonth === "all") {
        const v = ind.values[selectedYear];
        if (v.target > 0) {
          progressSum += Math.min(capaian(v.actual, v.target), 150);
          progressCount += 1;
        }
      } else {
        const mId = Number(selectedMonth);
        const yearlyVal = ind.values[selectedYear];
        const monthVal = yearlyVal.months[mId]?.actual || 0;
        if (yearlyVal.target > 0) {
          progressSum += Math.min(capaian(monthVal, yearlyVal.target), 150);
          progressCount += 1;
        }
      }
    }

    const overallProgress =
      progressCount === 0 ? 0 : progressSum / progressCount;

    return {
      totalProgram,
      totalSasaran,
      totalIndikator,
      overallProgress,
    };
  }, [filtered, selectedYear, selectedMonth]);

  const trendData = useMemo(() => {
    return YEARS.map((y) => {
      const allIndikator = filtered.flatMap((p) =>
        p.sasaran.flatMap((s) => s.indikator)
      );
      let sum = 0;
      let count = 0;
      for (const ind of allIndikator) {
        const v = ind.values[y];
        if (v.target > 0) {
          if (selectedMonth === "all") {
            sum += Math.min(capaian(v.actual, v.target), 150);
            count++;
          } else {
            const mId = Number(selectedMonth);
            const mVal = v.months[mId]?.actual || 0;
            sum += Math.min(capaian(mVal, v.target), 150);
            count++;
          }
        }
      }
      return {
        year: String(y),
        capaian: count === 0 ? 0 : Math.round((sum / count) * 10) / 10,
      };
    });
  }, [filtered, selectedMonth]);

  const programBarData = useMemo(
    () =>
      filtered.map((p) => {
        const inds = p.sasaran.flatMap((s) => s.indikator);
        let sum = 0;
        let count = 0;
        for (const ind of inds) {
          const v = ind.values[selectedYear];
          if (v.target > 0) {
            if (selectedMonth === "all") {
              sum += Math.min(capaian(v.actual, v.target), 150);
              count++;
            } else {
              const mId = Number(selectedMonth);
              const mVal = v.months[mId]?.actual || 0;
              sum += Math.min(capaian(mVal, v.target), 150);
              count++;
            }
          }
        }
        return {
          name: p.nama.length > 25 ? p.nama.slice(0, 25) + "…" : p.nama,
          capaian: count === 0 ? 0 : Math.round((sum / count) * 10) / 10,
        };
      }),
    [filtered, selectedYear, selectedMonth]
  );

  const bagianData = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    filtered.forEach((p) => {
      p.sasaran.forEach((s) => {
        s.indikator.forEach((ind) => {
          const b = ind.bagian || "Lainnya";
          const current = map.get(b) || { sum: 0, count: 0 };

          const v = ind.values[selectedYear];
          if (v.target > 0) {
            if (selectedMonth === "all") {
              current.sum += Math.min(capaian(v.actual, v.target), 150);
              current.count++;
            } else {
              const mId = Number(selectedMonth);
              const mVal = v.months[mId]?.actual || 0;
              current.sum += Math.min(capaian(mVal, v.target), 150);
              current.count++;
            }
          }
          map.set(b, current);
        });
      });
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({
        name: name.length > 20 ? name.slice(0, 20) + "..." : name,
        full: name,
        value:
          data.count === 0 ? 0 : Math.round((data.sum / data.count) * 10) / 10,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filtered, selectedYear, selectedMonth]);

  const topIndicators = useMemo(() => {
    const list: { name: string; progress: number; color: string }[] = [];
    filtered.forEach((p) => {
      p.sasaran.forEach((s) => {
        s.indikator.forEach((ind) => {
          const v = ind.values[selectedYear];
          let prog = 0;
          if (v.target > 0) {
            if (selectedMonth === "all") {
              prog = Math.round(capaian(v.actual, v.target) * 10) / 10;
            } else {
              const mId = Number(selectedMonth);
              const mVal = v.months[mId]?.actual || 0;
              prog = Math.round(capaian(mVal, v.target) * 10) / 10;
            }
          }

          list.push({
            name: ind.nama,
            progress: prog,
            color:
              prog >= 100
                ? "text-emerald-600"
                : prog >= 50
                  ? "text-amber-600"
                  : "text-rose-600",
          });
        });
      });
    });
    return list.sort((a, b) => b.progress - a.progress).slice(0, 6);
  }, [filtered, selectedYear, selectedMonth]);

  return (
    <div className="space-y-10">
      {/* Filter bar - Lightweight Modern */}
      <div
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-card p-5 rounded-3xl border shadow-sm relative overflow-hidden"
      >
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 min-w-0 flex-1 relative z-10">
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Filter className="w-5 h-5 text-primary" />
            </div>
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="w-full sm:w-[260px] bg-background/50 border-none shadow-sm font-bold text-sm h-11 rounded-xl">
                <SelectValue placeholder="Semua Program" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all">Semua Program Strategis</SelectItem>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Calendar className="w-5 h-5 text-emerald-500" />
            </div>
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => setSelectedYear(Number(v) as Year)}
            >
              <SelectTrigger className="w-32 bg-background/50 border-none shadow-sm font-bold text-sm h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Zap className="w-5 h-5 text-emerald-500" />
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-44 bg-background/50 border-none shadow-sm font-bold text-sm h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all">Setahun Penuh</SelectItem>
                {MONTHS.filter((m) => m.id !== 0).map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Badge
            variant="outline"
            className="bg-primary text-primary-foreground border-none px-5 py-2.5 rounded-2xl font-bold text-xs shadow-lg shadow-primary/20 whitespace-nowrap animate-pulse"
          >
            {selectedMonth === "all"
              ? `Tahun ${selectedYear}`
              : `${MONTHS.find((m) => String(m.id) === selectedMonth)?.name} ${selectedYear}`}
          </Badge>
        </div>
      </div>

      {/* KPI Row - Flat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div key="total-program">
            <KpiCard
              icon={<Activity className="h-5 w-5" />}
              label="Total Program"
              value={String(stats.totalProgram)}
              sub={`${stats.totalSasaran} Sasaran Strategis`}
              color="bg-emerald-500/10 text-emerald-600"
            />
          </div>
          <div key="total-indikator">
            <KpiCard
              icon={<TargetIcon className="h-5 w-5" />}
              label="Indikator Kinerja"
              value={String(stats.totalIndikator)}
              sub="Indikator Renstra Terpantau"
              color="bg-emerald-500/10 text-emerald-600"
            />
          </div>
          <div key="overall-progress">
            <KpiCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Capaian Strategis"
              value={`${stats.overallProgress.toFixed(1)}%`}
              sub={
                selectedMonth === "all"
                  ? `Rata-rata tahun ${selectedYear}`
                  : `Bulan ${MONTHS.find((m) => String(m.id) === selectedMonth)?.name}`
              }
              progress={Math.min(stats.overallProgress, 100)}
              color="bg-emerald-500/10 text-emerald-600"
              showRadial
            />
          </div>
      </div>

      {/* Charts - Lightweight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full shadow-sm border bg-card rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  TREN CAPAIAN TAHUNAN (%)
                </CardTitle>
                <div className="flex gap-2">
                   <div className="h-2 w-8 rounded-full bg-primary/20" />
                   <div className="h-2 w-16 rounded-full bg-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[340px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="rgba(0,0,0,0.03)"
                    />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fontWeight: 700, opacity: 0.6 }}
                      dy={15}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fontWeight: 700, opacity: 0.6 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "20px",
                        border: "none",
                        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
                        padding: "15px",
                        background: "rgba(255,255,255,0.9)",
                        backdropFilter: "blur(10px)",
                      }}
                      itemStyle={{ fontWeight: "bold" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="capaian"
                      name="Capaian (%)"
                      stroke="hsl(var(--primary))"
                      strokeWidth={5}
                      isAnimationActive={false}
                      dot={{
                        r: 6,
                        fill: "white",
                        stroke: "hsl(var(--primary))",
                        strokeWidth: 3,
                      }}
                      activeDot={{ r: 9, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full shadow-sm border bg-card rounded-[2rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <ArrowUpRight className="w-24 h-24" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg font-black flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Layers className="w-5 h-5 text-emerald-500" />
                </div>
                CAPAIAN PER BIDANG (%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[340px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={bagianData}>
                    <PolarGrid stroke="rgba(0,0,0,0.05)" />
                    <PolarAngleAxis 
                       dataKey="name" 
                       tick={{ fontSize: 10, fontWeight: 700, fill: "rgba(0,0,0,0.5)" }} 
                    />
                    <Radar
                      name="Capaian"
                      dataKey="value"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fill="#6366f1"
                      fillOpacity={0.2}
                      isAnimationActive={false}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "lg" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card className="shadow-sm border bg-card rounded-[2rem] h-full overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-black flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                INDIKATOR TERBAIK
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-8 pb-10">
              {topIndicators.map((ind, idx) => (
                <div key={idx} className="group cursor-default">
                  <div className="flex justify-between items-end mb-2">
                    <div className="space-y-0.5 max-w-[80%]">
                       <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest block opacity-50">Indikator {idx + 1}</span>
                       <span className="font-bold text-sm text-foreground truncate block group-hover:text-primary transition-colors">
                         {ind.name}
                       </span>
                    </div>
                    <span className={`font-black text-lg ${ind.color}`}>
                      {ind.progress}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(ind.progress, 100)}%` }}
                      className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${ind.progress >= 100 ? 'from-emerald-400 to-emerald-600' : ind.progress >= 50 ? 'from-amber-400 to-amber-600' : 'from-rose-400 to-rose-600'}`}
                    />
                  </div>
                </div>
              ))}
              {topIndicators.length === 0 && (
                <p className="text-center text-muted-foreground py-20 font-medium">
                  Belum ada data capaian tersedia.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="shadow-sm border bg-card rounded-[2rem] h-full overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-black flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                BREAKDOWN PER PROGRAM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[360px] pr-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={programBarData}
                    layout="vertical"
                    margin={{ top: 5, right: 40, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 10, fontWeight: 700, opacity: 0.7 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.02)" }}
                      contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "xl" }}
                    />
                    <Bar
                      dataKey="capaian"
                      radius={[0, 10, 10, 0]}
                      barSize={16}
                      isAnimationActive={false}
                    >
                      {programBarData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
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
  color,
  showRadial = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  progress?: number;
  color?: string;
  showRadial?: boolean;
}) {
  return (
    <Card className="group shadow-sm border bg-card rounded-[2rem] overflow-hidden relative">
      <CardContent className="pt-8 pb-8 px-8">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">
              {label}
            </p>
            <h3 className="text-4xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors">
              {value}
            </h3>
            {sub && (
              <p className="text-xs text-muted-foreground font-bold italic opacity-70">
                {sub}
              </p>
            )}
          </div>
          
          {showRadial && progress !== undefined ? (
             <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90">
                   <circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-slate-200/50"
                   />
                   <circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray="213.6"
                      style={{ strokeDashoffset: 213.6 - (213.6 * Math.min(progress, 100)) / 100 }}
                      className="text-primary transition-all duration-500"
                   />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                   <TargetIcon className="w-6 h-6 text-primary" />
                </div>
             </div>
          ) : (
            <div
              className={`p-4 rounded-2xl shadow-inner ${
                color || "bg-primary/10 text-primary"
              } transition-transform group-hover:rotate-12`}
            >
              {icon}
            </div>
          )}
        </div>
        
        {progress !== undefined && !showRadial && (
          <div className="mt-8 space-y-3">
            <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden">
              <div
                style={{ width: `${progress}%` }}
                className="h-full bg-primary rounded-full transition-all duration-500"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
