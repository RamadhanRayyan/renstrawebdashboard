import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ExecutiveOverview } from "@/components/ExecutiveOverview";
import { useRenstra } from "@/hooks/use-renstra";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Executive Overview — Renstra Monitoring 2025-2029" },
      {
        name: "description",
        content:
          "Dashboard eksekutif monitoring Renstra 2025-2029: capaian indikator, utilisasi anggaran, dan tren tahunan.",
      },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const { programs, isLoading } = useRenstra();
  return (
    <AppShell
      title="Executive Overview"
      subtitle="Ringkasan capaian Rencana Strategis periode 2025 — 2029"
    >
      {isLoading ? (
        <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
          Memuat data Renstra…
        </div>
      ) : (
        <ExecutiveOverview programs={programs} />
      )}
    </AppShell>
  );
}
