import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useRenstra } from "@/hooks/use-renstra";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RenstraTable } from "@/components/RenstraTable";
import { RenstraInputTable } from "@/components/RenstraInputTable";
import { UserManagement } from "@/components/UserManagement";
import { InputCapaianDialog } from "@/components/InputCapaianDialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Clock, Eye, Database, Users } from "lucide-react";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session && typeof window !== "undefined") {
      throw redirect({ to: "/login" });
    }
  },  head: () => ({
    meta: [{ title: "Dashboard Admin â€” Renstra Monitoring" }],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { role, user, isApproved, isLoading: isAuthLoading } = useAuth();
  const { isFetching } = useRenstra();
  const isAdmin = role === "admin";
  const isGuest = !isAdmin;

  const [isInputCapaianOpen, setIsInputCapaianOpen] = useState(false);

  // Wait for auth initialization (including profile/role fetch)
  if (isAuthLoading) {
    return (
      <AppShell title="Memuat...">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  // Unapproved admin
  if (user && !isGuest && !isApproved && !isAuthLoading) {
    return (
      <AppShell title="Menunggu Persetujuan">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-in fade-in zoom-in duration-500">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Akun Menunggu Persetujuan</h2>
          <p className="text-muted-foreground max-w-md">
            Pendaftaran Anda berhasil, namun admin harus menyetujui akun Anda
            sebelum Anda dapat mengakses fitur manajemen data. Silakan hubungi
            admin utama.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <>
      <AppShell
        title="Dashboard Admin"
        subtitle="Monitoring dan Pengelolaan Data Renstra"
        actions={
          <div className="flex items-center gap-3">
            {isFetching && (
              <div className="text-[10px] text-muted-foreground animate-pulse mr-1 italic">
                Menyinkronkanâ€¦
              </div>
            )}
            <Button
              onClick={() => setIsInputCapaianOpen(true)}
              className="bg-primary text-primary-foreground font-bold shadow-md hover:shadow-lg transition-all gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              Input Capaian
            </Button>
            <ExportPdfButton targetId="report-content" />
          </div>
        }
      >
        <div className="w-full max-w-7xl mx-auto">
          <div
            id="report-content"
            className="bg-card p-6 rounded-2xl border border-border/50"
          >
            <Tabs defaultValue="data" className="w-full">
              <TabsList className="mb-6 bg-secondary/50 p-1 rounded-xl w-fit">
                <TabsTrigger
                  value="data"
                  className="rounded-lg px-5 gap-2 text-xs font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Monitoring
                </TabsTrigger>
                <TabsTrigger
                  value="bulk"
                  className="rounded-lg px-5 gap-2 text-xs font-semibold"
                >
                  <Database className="w-3.5 h-3.5" />
                  Master Data
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger
                    value="users"
                    className="rounded-lg px-5 gap-2 text-xs font-semibold"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Users
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent
                value="data"
                className="mt-0 focus-visible:outline-none"
              >
                <RenstraTable isGuest={false} />
              </TabsContent>

              <TabsContent
                value="bulk"
                className="mt-0 focus-visible:outline-none"
              >
                <RenstraInputTable />
              </TabsContent>

              {isAdmin && (
                <TabsContent
                  value="users"
                  className="mt-0 focus-visible:outline-none"
                >
                  <UserManagement />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </AppShell>

      <InputCapaianDialog
        open={isInputCapaianOpen}
        onOpenChange={setIsInputCapaianOpen}
      />
    </>
  );
}

