import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GuestDashboardPageContent } from "@/components/RolePages";
import { useRenstra } from "@/hooks/use-renstra";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({  head: () => ({
    meta: [{ title: "Dashboard - Renstra Monitoring 2026-2030" }],
  }),
  component: HomeDashboard,
});

function HomeDashboard() {
  const { user, role, isApproved, isLoading } = useAuth();
  const { programs } = useRenstra();
  const isAdmin = user && role === "admin" && isApproved;

  if (isLoading || isAdmin) {
    return (
      <AppShell title="Memuat Dashboard...">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Dashboard"
      subtitle="Ringkasan Capaian Renstra 2026 - 2030"
      actions={<ExportPdfButton targetId="report-content" />}
    >
      <div id="report-content">
        <GuestDashboardPageContent programs={programs} />
      </div>
    </AppShell>
  );
}

