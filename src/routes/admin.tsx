import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ExecutiveOverview } from "@/components/ExecutiveOverview";
import { useRenstra } from "@/hooks/use-renstra";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { ChatSystem } from "@/components/ChatSystem";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RenstraTable } from "@/components/RenstraTable";
import { RenstraInputTable } from "@/components/RenstraInputTable";
import { UserManagement } from "@/components/UserManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Master Data CRUD — Renstra Monitoring" },
    ],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { role, isApproved } = useAuth();
  const { programs, isLoading } = useRenstra();
  const isAdmin = role === "admin";
  const isGuest = !isAdmin;

  // Jika bukan guest tapi belum di-approve
  if (!isGuest && !isApproved) {
    return (
      <AppShell title="Menunggu Persetujuan">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Akun Menunggu Persetujuan</h2>
          <p className="text-muted-foreground max-w-md">
            Pendaftaran Anda berhasil, namun admin harus menyetujui akun Anda sebelum Anda dapat mengakses fitur manajemen data. Silakan hubungi admin utama.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Master Data Renstra"
      subtitle="Pengelolaan Program, Sasaran, & Indikator (Mode CRUD)"
      actions={<ExportPdfButton targetId="report-content" />}
    >
      {isLoading ? (
        <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
          Memuat data Renstra…
        </div>
      ) : (
        <div className="w-full max-w-6xl mx-auto">
          <div id="report-content" className="bg-background p-4 rounded-xl shadow-elegant border">
            <Tabs defaultValue="bulk" className="w-full">
              <TabsList className="mb-4 bg-muted/50 p-1">
                <TabsTrigger value="bulk">Excel Entry (CRUD)</TabsTrigger>
                <TabsTrigger value="data">Monitoring View</TabsTrigger>
                {isAdmin && <TabsTrigger value="users">Manajemen User</TabsTrigger>}
              </TabsList>
              
              <TabsContent value="bulk">
                <RenstraInputTable />
              </TabsContent>
              
              <TabsContent value="data">
                <RenstraTable isGuest={false} />
              </TabsContent>

              {isAdmin && (
                <TabsContent value="users">
                  <UserManagement />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      )}
    </AppShell>
  );
}
