import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GuestTablePageContent } from "@/components/RolePages";
import { useRenstra } from "@/hooks/use-renstra";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/guest-table")({  head: () => ({ meta: [{ title: "Guest Table - Renstra Monitoring" }] }),
  component: GuestTable,
});

function GuestTable() {
  const { user, role, isApproved, isLoading } = useAuth();
  const { isFetching } = useRenstra();
  const isAdmin = user && role === "admin" && isApproved;

  if (isLoading || isAdmin) {
    return <LoadingShell title="Memuat Tabel..." />;
  }

  return (
    <AppShell
      title="Tabel Tamu"
      subtitle="Tabel Renstra seperti Excel, hanya untuk dilihat"
      actions={
        <div className="flex items-center gap-3">
          {isFetching && <span className="text-[10px] italic text-muted-foreground animate-pulse">Menyinkronkan...</span>}
          <ExportPdfButton targetId="report-content" />
        </div>
      }
    >
      <GuestTablePageContent />
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

