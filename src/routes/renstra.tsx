import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RenstraTable } from "@/components/RenstraTable";
import { useRenstra, renstraQueryOptions } from "@/hooks/use-renstra";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/renstra")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(renstraQueryOptions),
  head: () => ({
    meta: [
      { title: "Monitoring Data — Renstra 2026-2030" },
      {
        name: "description",
        content:
          "Lihat data monitoring Renstra: realisasi indikator kinerja strategis per bulan.",
      },
    ],
  }),
  component: RenstraMonitoringPage,
});

function RenstraMonitoringPage() {
  const { role, isApproved, isLoading: isAuthLoading } = useAuth();
  const { isFetching } = useRenstra();
  const isGuest = !(role === "admin" && isApproved);

  return (
    <AppShell
      title="Monitoring Capaian"
      subtitle="Data realisasi indikator strategis 2026 — 2030"
      actions={
        <div className="flex items-center gap-3">
          {isFetching && (
            <div className="text-[10px] text-muted-foreground animate-pulse mr-1 italic">
              Menyinkronkan…
            </div>
          )}
          <ExportPdfButton targetId="report-content" />
        </div>
      }
    >
      {isAuthLoading ? (
        <div className="flex h-[60vh] items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="w-full animate-in fade-in duration-500">
          <div
            id="report-content"
            className="bg-card p-6 rounded-2xl border border-border/50"
          >
            <RenstraTable isGuest={isGuest} />
          </div>
        </div>
      )}
    </AppShell>
  );
}
