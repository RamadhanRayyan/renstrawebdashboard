import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GuestDashboardPageContent } from "@/components/RolePages";
import { useRenstra } from "@/hooks/use-renstra";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/guest-dashboard")({  head: () => ({
    meta: [
      { title: "Guest Dashboard - Renstra Monitoring 2026-2030" },
      { name: "description", content: "Dashboard ringkasan capaian Renstra untuk tamu (read-only)." },
    ],
  }),
  component: GuestDashboard,
});

function GuestDashboard() {
  const { user, role, isApproved, isLoading } = useAuth();
  const { programs } = useRenstra();
  const isAdmin = user && role === "admin" && isApproved;

  if (isLoading || isAdmin) {
    return <LoadingShell title="Memuat Dashboard..." />;
  }

  return (
    <AppShell
      title="Dashboard Tamu"
      subtitle="Ringkasan Capaian Renstra 2026 - 2030 (Read-only)"
      actions={<ExportPdfButton targetId="report-content" />}
    >
      <div id="report-content">
        <GuestDashboardPageContent programs={programs} />
      </div>
    </AppShell>
  );
}

function LoadingShell({ title }: { title: string }) {
  return (
    <AppShell title={title}>
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    </AppShell>
  );
}

