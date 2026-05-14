import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Table2,
  Target,
  LogOut,
  User,
  BarChart3,
  Database,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui/button";
import { useState } from "react";
import { InputCapaianDialog } from "./InputCapaianDialog";

interface Props {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: Props) {
  const { role, signOut, user, isApproved, isLoading } = useAuth();
  const [isInputOpen, setIsInputOpen] = useState(false);

  const isAdmin = role === "admin" && isApproved;
  const isResolvingRole = isLoading || (user && !role);

  const NAV = isResolvingRole
    ? []
    : isAdmin
      ? [
          { to: "/admin-dashboard", label: "Dashboard Admin", icon: LayoutDashboard },
          { to: "/admin-progress", label: "Tabel Progres", icon: BarChart3 },
          { to: "/admin", label: "Kelola Renstra", icon: Database },
        ]
      : [
          { to: "/guest-dashboard", label: "Dashboard", icon: LayoutDashboard },
          { to: "/guest-table", label: "Tabel Renstra", icon: Table2 },
        ];

  const handleSignOut = async () => {
    try {
      import("sonner").then(({ toast }) => toast.success("Sedang keluar..."));
      localStorage.clear();
      sessionStorage.clear();
      signOut().catch(console.error);
      window.location.replace("/login");
      setTimeout(() => {
        window.location.href = "/login";
        window.location.reload();
      }, 300);
    } catch {
      window.location.replace("/login");
    }
  };

  return (
    <>
      <aside className="flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-5 py-8 border-b border-sidebar-border bg-gradient-to-b from-primary/5 to-transparent">
          <div className="flex flex-col gap-4">
            <div className="h-12 w-12 rounded-2xl bg-sidebar-primary flex items-center justify-center shadow-sm">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-semibold tracking-[0.3em] text-sidebar-primary/90">
                Renstra
              </div>
              <div className="text-lg font-semibold leading-tight tracking-tight text-sidebar-foreground">
                Navigator
              </div>
              <div className="text-[10px] text-muted-foreground font-medium opacity-60 mt-0.5">
                Monitoring 2026-2030
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="px-4 pt-4 pb-2">
            <Button
              onClick={() => setIsInputOpen(true)}
              className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground font-medium shadow-elegant h-10 gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Input Capaian
            </Button>
          </div>
        )}

        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45 flex items-center justify-between">
            <span>Menu</span>
            {isResolvingRole ? (
              <span className="text-[8px] tracking-normal text-muted-foreground">loading...</span>
            ) : role ? (
              <span className="bg-sidebar-primary/15 text-sidebar-primary px-1.5 py-0.5 rounded text-[8px] tracking-normal capitalize">
                {role}
              </span>
            ) : null}
          </div>

          {isResolvingRole ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">Memuat role akun...</div>
          ) : (
            NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                activeOptions={{ exact: true }}
                activeProps={{
                  className:
                    "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary",
                }}
                inactiveProps={{
                  className:
                    "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 border-l-2 border-transparent",
                }}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            ))
          )}
        </nav>

        <div className="px-5 py-4 border-t border-sidebar-border space-y-4">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">
                    {user?.email}
                  </div>
                  <div className="text-[10px] text-sidebar-foreground/50 truncate uppercase">
                    {isResolvingRole ? "memuat role" : role}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sidebar-foreground/70 hover:text-danger hover:bg-danger/10 h-9 px-3"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-3" />
                <span className="text-xs font-medium">Keluar</span>
              </Button>
            </>
          ) : null}
        </div>
      </aside>

      <InputCapaianDialog open={isInputOpen} onOpenChange={setIsInputOpen} />
    </>
  );
}




