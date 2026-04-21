import { Sidebar } from "@/components/Sidebar";
import { ReactNode, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  title: string;
}

export function DashboardLayout({ children, currentView, onNavigate, title }: DashboardLayoutProps) {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => invoke<Record<string, string>>("get_app_settings"),
  });

  const currentTheme = settings?.app_theme || "nord";
  const themeClass = `theme-${currentTheme}`;

  // Apply theme class to body to ensure modals/portals inherit it
  useEffect(() => {
    const body = document.body;
    // Remove existing theme classes
    const classes = body.className.split(' ').filter(c => !c.startsWith('theme-'));
    body.className = [...classes, themeClass].join(' ');
  }, [themeClass]);

  return (
    <div className={cn("flex h-screen w-full bg-background text-foreground overflow-hidden", themeClass)}>
      <Sidebar currentView={currentView} onNavigate={onNavigate} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border flex items-center px-8 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
