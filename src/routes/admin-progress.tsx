import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { AdminProgressTablePageContent } from "@/components/RolePages";
import { useRenstra } from "@/hooks/use-renstra";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin-progress")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session && typeof window !== "undefined") throw redirect({ to: "/login" });
  },  head: () => ({ meta: [{ title: "Admin Progress Table - Renstra Monitoring" }] }),
  component: AdminProgress,
});

function AdminProgress() {
  const { role, isApproved, isLoading } = useAuth();
  const { programs, isFetching } = useRenstra();
  const isAdmin = role === "admin" && isApproved;

  if (isLoading || !isAdmin) {
    return <LoadingShell title="Memuat Tabel Admin..." />;
  }

  return (
    <AppShell
      title="Tabel Admin"
      subtitle="Tabel progres dengan bar persentase selesai"
      actions={
        <div className="flex items-center gap-3">
          {isFetching && <span className="text-[10px] italic text-muted-foreground animate-pulse">Menyinkronkan...</span>}
          <ExportPdfButton targetId="report-content" />
        </div>
      }
    >
      <AdminProgressTablePageContent programs={programs} />
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

