import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RenstraTable } from "@/components/RenstraTable";
import { RenstraInputTable } from "@/components/RenstraInputTable";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { useAuth } from "@/hooks/use-auth";
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
  const { role, isApproved } = useAuth();
  const isGuest = role === "guest" || !role;
  const isAdmin = (role === "admin" || role === "user") && isApproved;

  return (
    <AppShell
      title={isAdmin ? "Renstra Master Data" : "Monitoring Data Renstra"}
      subtitle={isAdmin 
        ? "Mode Editor: Kelola Program, Sasaran, & Indikator (CRUD)" 
        : "Mode Tamu: Lihat Capaian & Target Renstra (Read-only)"
      }
      actions={<ExportPdfButton targetId="report-content" />}
    >
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
    </AppShell>
  );
}
