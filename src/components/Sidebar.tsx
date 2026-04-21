import { useUiStore } from "@/store/useUiStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Truck,
  CreditCard,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard", adminOnly: false },
  { icon: ShoppingCart, label: "Ventas (POS)", id: "pos", adminOnly: false },
  { icon: Package, label: "Inventario", id: "inventory", adminOnly: false },
  { icon: Truck, label: "Proveedores", id: "suppliers", adminOnly: true },
  { icon: CreditCard, label: "Compras", id: "purchases", adminOnly: true },
  { icon: Users, label: "Clientes", id: "customers", adminOnly: false },
  { icon: BarChart3, label: "Reportes", id: "reports", adminOnly: true },
  { icon: Settings, label: "Configuración", id: "settings", adminOnly: true },
];

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const { isAdmin, logout, user } = useAuthStore();
  
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => invoke<Record<string, string>>("get_app_settings"),
  });

  const companyName = settings?.company_name || "MINIGOCIO";
  const isDefaultName = companyName.toUpperCase() === "MINIGOCIO";

  const visibleMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin());

  return (
    <aside 
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 relative flex flex-col",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      <div className="p-6 mb-4 flex flex-col items-center justify-between">
        <div className="w-full flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-black tracking-tight overflow-hidden whitespace-nowrap uppercase">
              {isDefaultName ? (
                <>
                  <span className="text-primary">MINI</span>
                  <span className="text-accent">GOCIO</span>
                </>
              ) : (
                <span className="text-sidebar-foreground">{companyName}</span>
              )}
            </h1>
          )}
          {!sidebarOpen && (
            <div className="w-8 h-8 bg-sidebar-primary rounded-none flex items-center justify-center">
              <span className="text-sidebar-primary-foreground text-xs font-bold">M</span>
            </div>
          )}
        </div>
        
        {sidebarOpen && (
          <div className="w-full mt-4 p-2 bg-sidebar-accent/50 rounded-none border border-sidebar-border/50 text-center">
            <p className="text-[10px] text-sidebar-foreground/70 uppercase tracking-widest">Usuario Activo</p>
            <p className="text-xs font-bold text-primary">{user?.name}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {visibleMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "w-full flex items-center p-3 rounded-none transition-colors group",
              currentView === item.id 
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20" 
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              !sidebarOpen && "justify-center"
            )}
            title={!sidebarOpen ? item.label : undefined}
          >
            <item.icon size={20} className={cn(sidebarOpen && "mr-3")} />
            {sidebarOpen && <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button 
          variant="ghost" 
          onClick={logout}
          className={cn(
            "w-full flex justify-center rounded-none text-destructive hover:bg-destructive/10 hover:text-destructive",
            !sidebarOpen && "px-0"
          )}
          title={!sidebarOpen ? "Cerrar Sesión" : undefined}
        >
          <LogOut size={20} className={cn(sidebarOpen && "mr-2")} />
          {sidebarOpen && <span className="font-bold text-xs uppercase tracking-widest">Salir</span>}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="w-full flex justify-center rounded-none text-sidebar-foreground/50 hover:text-sidebar-foreground h-8"
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </Button>
      </div>
    </aside>
  );
}
