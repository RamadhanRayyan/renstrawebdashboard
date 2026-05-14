import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RenstraTable } from "@/components/RenstraTable";
import { ExecutiveOverview } from "@/components/ExecutiveOverview";
import { YEARS, capaian, type Program } from "@/lib/renstra-data";
import { BarChart3, CheckCircle2, ClipboardList, Table2, Target, Users } from "lucide-react";

function getAllIndicators(programs: Program[]) {
  return programs.flatMap((program) =>
    program.sasaran.flatMap((sasaran) =>
      sasaran.indikator.map((indikator) => ({ program, sasaran, indikator })),
    ),
  );
}

function getProgress(programs: Program[]) {
  const indicators = getAllIndicators(programs);
  let total = 0;
  let count = 0;

  indicators.forEach(({ indikator }) => {
    const value = indikator.values[YEARS[0]];
    if (value.target > 0) {
      total += Math.min(capaian(value.actual, value.target), 100);
      count += 1;
    }
  });

  return {
    indicators,
    average: count === 0 ? 0 : Math.round(total / count),
  };
}

export function GuestDashboardPageContent({ programs }: { programs: Program[] }) {
  const { indicators, average } = getProgress(programs);
  const sasaranCount = programs.reduce((total, program) => total + program.sasaran.length, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard icon={<Target className="h-5 w-5" />} label="Program" value={programs.length} />
        <SummaryCard icon={<ClipboardList className="h-5 w-5" />} label="Sasaran" value={sasaranCount} />
        <SummaryCard icon={<Table2 className="h-5 w-5" />} label="Indikator" value={indicators.length} />
        <SummaryCard icon={<CheckCircle2 className="h-5 w-5" />} label="Capaian" value={`${average}%`} />
      </div>

      <ExecutiveOverview programs={programs} isGuest />
    </div>
  );
}

export function GuestTablePageContent() {
  return (
    <div id="report-content" className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm animate-in fade-in duration-500">
      <div className="mb-4 flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
        <Table2 className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide">Tabel Renstra Read-only</h2>
          <p className="text-xs text-muted-foreground">Tampilan seperti Excel untuk tamu, hanya bisa dilihat.</p>
        </div>
      </div>
      <RenstraTable isGuest />
    </div>
  );
}

export function AdminDashboardPageContent({ programs }: { programs: Program[] }) {
  const { indicators, average } = getProgress(programs);
  const completed = indicators.filter(({ indikator }) => {
    const value = indikator.values[YEARS[0]];
    return value.target > 0 && capaian(value.actual, value.target) >= 100;
  }).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={<BarChart3 className="h-5 w-5" />} label="Rata-rata selesai" value={`${average}%`} />
        <SummaryCard icon={<CheckCircle2 className="h-5 w-5" />} label="Indikator selesai" value={completed} />
        <SummaryCard icon={<Users className="h-5 w-5" />} label="Total indikator" value={indicators.length} />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-black uppercase tracking-wide">Progress Per Program</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {programs.map((program) => {
            const programProgress = getProgress([program]).average;
            return (
              <div key={program.id} className="space-y-2">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-semibold text-foreground">{program.nama}</span>
                  <span className="font-black text-primary">{programProgress}%</span>
                </div>
                <Progress value={programProgress} className="h-3" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <ExecutiveOverview programs={programs} />
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
    <Card id="report-content" className="rounded-2xl border-border/60 shadow-sm animate-in fade-in duration-500">
      <CardHeader>
        <CardTitle className="text-base font-black uppercase tracking-wide">Tabel Persentase Selesai</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Program</th>
                <th className="px-4 py-3">Sasaran</th>
                <th className="px-4 py-3">Indikator</th>
                <th className="px-4 py-3 text-right">Target</th>
                <th className="px-4 py-3 text-right">Realisasi</th>
                <th className="px-4 py-3">Selesai</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.id} className="bg-card hover:bg-muted/30">
                  <td className="px-4 py-3 font-semibold">{row.program}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.sasaran}</td>
                  <td className="px-4 py-3">{row.indikator}</td>
                  <td className="px-4 py-3 text-right font-mono">{row.target}</td>
                  <td className="px-4 py-3 text-right font-mono">{row.actual}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Progress value={row.progress} className="h-3 min-w-32" />
                      <span className="w-12 text-right font-black text-primary">{row.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">{icon}</div>
      </CardContent>
    </Card>
  );
}


