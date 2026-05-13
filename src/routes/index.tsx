import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ExecutiveOverview } from "@/components/ExecutiveOverview";
import { useRenstra, renstraQueryOptions } from "@/hooks/use-renstra";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PlusCircle, Sparkles, TrendingUp, Zap, ArrowRight } from "lucide-react";
import { useState } from "react";
import { InputCapaianDialog } from "@/components/InputCapaianDialog";
import { RenstraFetchAlert } from "@/components/RenstraFetchAlert";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(renstraQueryOptions),
  head: () => ({
    meta: [
      { title: "Executive Overview — Renstra Monitoring 2026-2030" },
      {
        name: "description",
        content:
          "Dashboard eksekutif monitoring Renstra 2026-2030: capaian indikator dan tren tahunan.",
      },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const { role, user, isApproved, isLoading: isAuthLoading } = useAuth();
  const { programs, isError, error, refetchRenstra } = useRenstra();
  const [isInputOpen, setIsInputOpen] = useState(false);

  const showSpinner = isAuthLoading;
  const isGuest = !isAuthLoading && (role === "guest" || !role);
  const isAdmin = !isAuthLoading && role === "admin" && isApproved;

  return (
    <AppShell
      title="Strategic Dashboard"
      subtitle={
        isGuest
          ? "Ringkasan capaian Rencana Strategis periode 2026 — 2030 (Read-only)"
          : "Monitoring & Capaian Rencana Strategis 2026 — 2030"
      }
      actions={
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              onClick={() => setIsInputOpen(true)}
              className="bg-primary text-primary-foreground font-bold shadow-elegant gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Input Capaian
            </Button>
          )}
          <ExportPdfButton targetId="report-content" />
        </div>
      }
    >
      {showSpinner ? (
        <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <span>Memuat data…</span>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-8">
          {/* Quick Action Banner - Premium Redesign */}
          {isAdmin && (
            <div
              className="group relative overflow-hidden rounded-[2.5rem] bg-indigo-600 p-8 text-white shadow-lg"
            >
              {/* Background Decor */}
              <div className="absolute top-0 right-0 h-full w-1/2 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-inner">
                    <Sparkles className="h-8 w-8 text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight leading-tight">
                      Siap Menginput Capaian Baru?
                    </h3>
                    <p className="mt-2 text-indigo-100 font-medium max-w-md">
                      Sistem input kami kini jauh lebih cepat. Masukkan data realisasi bulanan Anda dalam hitungan detik.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsInputOpen(true)}
                  size="lg"
                  className="bg-white text-primary hover:bg-indigo-50 font-black text-base px-8 h-14 rounded-2xl shadow-xl hover:scale-105 transition-all group"
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  MULAI INPUT DATA
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          )}

          {/* Executive Overview */}
          <div
            id="report-content"
            className="bg-card p-1 rounded-[2.5rem] border border-border/50 shadow-sm"
          >
            <div className="p-4 pb-0 md:p-6 md:pb-0">
              {isError ? (
                <RenstraFetchAlert error={error} onRetry={refetchRenstra} />
              ) : null}
            </div>
            <ExecutiveOverview programs={programs} isGuest={isGuest} />
          </div>

          {/* Bottom Grid for Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div 
               className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex items-center gap-5"
             >
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                   <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                   <h4 className="font-black text-sm text-foreground uppercase tracking-wider">Efisiensi Input</h4>
                   <p className="text-xs text-muted-foreground mt-1">Rata-rata waktu input user berkurang 70% dibanding spreadsheet.</p>
                </div>
             </div>
             <div 
               className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex items-center gap-5"
             >
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                   <Zap className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                   <h4 className="font-black text-sm text-foreground uppercase tracking-wider">Sinkronisasi Realtime</h4>
                   <p className="text-xs text-muted-foreground mt-1">Data Anda tersimpan aman dan langsung terupdate di dashboard pimpinan.</p>
                </div>
             </div>
          </div>
        </div>
      )}

      <InputCapaianDialog open={isInputOpen} onOpenChange={setIsInputOpen} />
    </AppShell>
  );
}
