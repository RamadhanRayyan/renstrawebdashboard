import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Table2, Target } from "lucide-react";

const NAV = [
  { to: "/", label: "Executive Overview", icon: LayoutDashboard },
  { to: "/renstra", label: "Renstra Master Data", icon: Table2 },
];

export function AppSidebar() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-6 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-sidebar-primary/15 flex items-center justify-center ring-1 ring-sidebar-primary/30">
            <Target className="h-5 w-5 text-sidebar-primary" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-sidebar-foreground/60">Renstra</div>
            <div className="text-sm font-semibold">Monitoring 2025–2029</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">
          Workspace
        </div>
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: true }}
            activeProps={{
              className:
                "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary",
            }}
            inactiveProps={{
              className: "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 border-l-2 border-transparent",
            }}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/55">
          Periode Renstra
          <div className="font-mono text-sidebar-foreground mt-0.5">2025 — 2029</div>
        </div>
      </div>
    </aside>
  );
}
