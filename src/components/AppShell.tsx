import { useState, type ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface AppShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <AppSidebar />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
          <SheetTitle className="sr-only">Navigasi</SheetTitle>
          <AppSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border bg-card/70 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-10 py-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 -ml-1 shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 shrink-0">{actions}</div>
            )}
          </div>
        </header>
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-5 sm:py-7 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
