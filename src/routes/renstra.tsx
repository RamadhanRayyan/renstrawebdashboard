import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RenstraTable } from "@/components/RenstraTable";

export const Route = createFileRoute("/renstra")({
  head: () => ({
    meta: [
      { title: "Renstra Master Data — Monitoring 2025-2029" },
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
  return (
    <AppShell
      title="Renstra Master Data"
      subtitle="Program › Sasaran Strategis › Indikator Kinerja"
    >
      <RenstraTable />
    </AppShell>
  );
}
