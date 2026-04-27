import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

interface AppShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-6 lg:px-10 py-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        </header>
        <main className="flex-1 px-6 lg:px-10 py-8">{children}</main>
      </div>
    </div>
  );
}
