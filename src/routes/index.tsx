import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ExecutiveOverview } from "@/components/ExecutiveOverview";
import { RenstraTable } from "@/components/RenstraTable";
import { useRenstra } from "@/hooks/use-renstra";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { ChatSystem } from "@/components/ChatSystem";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
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
  const { role, isLoading: isAuthLoading } = useAuth();
  const { programs, isLoading: isDataLoading } = useRenstra();
  
  const isLoading = isAuthLoading || isDataLoading;
  const isGuest = role === "guest" || !role;

  return (
    <AppShell
      title="Renstra Overview"
      subtitle={isGuest 
        ? "Ringkasan capaian Rencana Strategis periode 2026 — 2030 (Read-only)" 
        : "Dashboard Monitoring Rencana Strategis 2026 — 2030"
      }
      actions={<ExportPdfButton targetId="report-content" />}
    >
      {isLoading ? (
        <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
          Memuat data Renstra…
        </div>
      ) : (
        <div className="w-full max-w-6xl mx-auto">
          <div id="report-content" className="bg-background p-4 rounded-xl shadow-elegant border">
             <ExecutiveOverview programs={programs} isGuest={isGuest} />
          </div>
        </div>
      )}
    </AppShell>
  );
}
