import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RenstraTable } from "@/components/RenstraTable";
import { RenstraInputTable } from "@/components/RenstraInputTable";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { useAuth } from "@/hooks/use-auth";
import { useRenstra } from "@/hooks/use-renstra";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/renstra")({
  head: () => ({
    meta: [
      { title: "Renstra Master Data — Monitoring 2026-2030" },
      {
        name: "description",
        content:
          "Kelola data Renstra: Program, Sasaran Strategis, Indikator Kinerja, target dan realisasi tahunan.",
      },
    ],
  }),
  component: RenstraPage,
});

function RenstraPage() {
  const { role, isApproved, isLoading: isAuthLoading } = useAuth();
  const { isLoading: isDataLoading } = useRenstra();
  const isAdmin = role === "admin" && isApproved;
  const isGuest = !isAdmin;
  const isLoading = isAuthLoading || isDataLoading;

  return (
    <AppShell
      title={isAdmin ? "Renstra Master Data" : "Data Monitoring Renstra"}
      subtitle={isAdmin 
        ? "Mode Editor: Kelola Program, Sasaran, & Indikator 2026 — 2030" 
        : "Mode Tamu: Lihat Capaian & Target Renstra 2026 — 2030"
      }
      actions={<ExportPdfButton targetId="report-content" />}
    >
      {isLoading ? (
        <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
          Memuat data Renstra…
        </div>
      ) : (
        <div id="report-content" className="bg-background p-4 rounded-xl">
          {isAdmin ? (
            <Tabs defaultValue="excel" className="w-full">
              <TabsList className="mb-6 bg-muted/50 p-1">
                <TabsTrigger value="excel">Excel Entry (CRUD)</TabsTrigger>
                <TabsTrigger value="monitoring">Monitoring View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="excel">
                <RenstraInputTable />
              </TabsContent>
              
              <TabsContent value="monitoring">
                <RenstraTable isGuest={false} />
              </TabsContent>
            </Tabs>
          ) : (
            <RenstraTable isGuest={true} />
          )}
        </div>
      )}
    </AppShell>
  );
}
