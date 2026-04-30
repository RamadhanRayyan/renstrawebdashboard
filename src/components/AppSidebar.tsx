import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Table2, Target, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui/button";

interface Props {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: Props) {
  const { role, signOut, user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = role === "admin" || role === "user";

  const NAV = [
    { to: "/", label: "Executive Overview", icon: LayoutDashboard },
    { 
      to: isAdmin ? "/admin" : "/renstra", 
      label: isAdmin ? "Master Data (CRUD)" : "Data Monitoring", 
      icon: isAdmin ? Target : Table2 
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      // Force reload to login page to clear all states
      window.location.href = "/#/login";
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/#/login";
    }
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-sidebar-primary/15 flex items-center justify-center ring-1 ring-sidebar-primary/30">
            <Target className="h-5 w-5 text-sidebar-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/60">
              Renstra
            </div>
            <div className="text-sm font-semibold leading-tight">
              Monitoring 2026–2030
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45 flex items-center justify-between">
          <span>Workspace</span>
          {role && <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[8px] tracking-normal">{role}</span>}
        </div>
        {NAV.map((item) => (
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
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-sidebar-border space-y-4">
        {user ? (
          <>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate">{user?.email}</div>
                <div className="text-[10px] text-sidebar-foreground/50 truncate uppercase">{role}</div>
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
  );
}
