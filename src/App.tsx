import { useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { Toaster } from "@/components/ui/sonner";
import { DashboardLayout } from "./layouts/DashboardLayout";
import InventoryPage from "./pages/InventoryPage";
import PosPage from "./pages/PosPage";
import CustomerPage from "./pages/CustomerPage";
import SettingsPage from "./pages/SettingsPage";
import SuppliersPage from "./pages/SuppliersPage";
import PurchasesPage from "./pages/PurchasesPage";
import ReportsPage from "./pages/ReportsPage";
import LoginPage from "./pages/LoginPage";
import { useAuthStore } from "./store/useAuthStore";
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const queryClient = new QueryClient();

function App() {
  const [currentView, setCurrentView] = useState("dashboard");
  const isAuthenticated = useAuthStore((state) => !!state.user);

  const renderView = () => {
    switch (currentView) {
      case "inventory":
        return <InventoryPage />;
      case "pos":
        return <PosPage />;
      case "customers":
        return <CustomerPage />;
      case "suppliers":
        return <SuppliersPage />;
      case "purchases":
        return <PurchasesPage />;
      case "reports":
        return <ReportsPage />;
      case "settings":
        return <SettingsPage />;
      case "dashboard":
      default:
        return <DashboardView />;
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case "inventory": return "Gestión de Inventario";
      case "pos": return "Punto de Venta (POS)";
      case "customers": return "Gestión de Clientes";
      case "suppliers": return "Gestión de Proveedores";
      case "purchases": return "Gestión de Compras";
      case "reports": return "Reportes de Actividad";
      case "settings": return "Configuración del Sistema";
      case "dashboard": return "Panel de Control";
      default: return "MINIGOCIO";
    }
  };

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <LoginPage />
        <Toaster position="bottom-right" richColors />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardLayout 
        currentView={currentView} 
        onNavigate={setCurrentView}
        title={getTitle()}
      >
        {renderView()}
      </DashboardLayout>
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}

function DashboardView() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: () => invoke<any>("get_dashboard_stats"),
  });

  const { data: salesHistory = [] } = useQuery({
    queryKey: ["sales_by_day"],
    queryFn: () => invoke<any[]>("get_sales_by_day"),
  });

  const { data: topProducts = [] } = useQuery({
    queryKey: ["top_products"],
    queryFn: () => invoke<any[]>("get_top_products_stats"),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => invoke<any[]>("get_products"),
  });

  const currencySymbol = "S/";
  const lowStockProducts = products.filter(p => p.stock_quantity <= 5);

  if (statsLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Ventas del Día" 
          value={`${currencySymbol}${stats?.sales_today?.toFixed(2) || "0.00"}`} 
          icon={ShoppingCart} 
          trend="Hoy" 
        />
        <StatCard 
          title="Productos en Stock" 
          value={stats?.total_products || "0"} 
          icon={Package} 
          trend="Total" 
        />
        <StatCard 
          title="Clientes" 
          value={stats?.total_customers || "0"} 
          icon={Users} 
          trend="Registrados" 
        />
        <StatCard 
          title="Ingresos del Mes" 
          value={`${currencySymbol}${stats?.monthly_revenue?.toFixed(2) || "0.00"}`} 
          icon={TrendingUp} 
          trend="Este mes" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 bg-card border border-border rounded-none shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-card-foreground mb-6">Tendencia de Ventas (30 días)</h3>
          <div className="h-[300px] w-full">
            {salesHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 'bold'}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 'bold'}}
                  />
                  <Tooltip 
                    contentStyle={{backgroundColor: 'var(--card)', borderRadius: '0', border: '1px solid var(--border)', color: 'var(--foreground)'}}
                    itemStyle={{color: 'var(--primary)'}}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="var(--primary)" 
                    strokeWidth={3} 
                    dot={{fill: 'var(--primary)', strokeWidth: 2, r: 4}} 
                    activeDot={{r: 6, strokeWidth: 0}}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground italic text-xs uppercase tracking-widest">
                Sin datos suficientes
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-card border border-border rounded-none shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-card-foreground mb-6">Productos Más Vendidos</h3>
          <div className="h-[300px] w-full">
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 'bold'}}
                    width={100}
                  />
                  <Tooltip 
                    cursor={{fill: 'var(--muted)', opacity: 0.4}}
                    contentStyle={{backgroundColor: 'var(--card)', borderRadius: '0', border: '1px solid var(--border)', color: 'var(--foreground)'}}
                    itemStyle={{color: 'var(--primary)'}}
                  />
                  <Bar dataKey="quantity" radius={[0, 0, 0, 0]}>
                    {topProducts.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={`var(--chart-${(index % 5) + 1})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground italic text-xs uppercase tracking-widest">
                Sin registros de ventas
              </div>
            )}
          </div>
        </div>

        {lowStockProducts.length > 0 && (
          <div className="lg:col-span-2 p-6 bg-destructive/5 border border-destructive/20 rounded-none shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-destructive mb-4 flex items-center text-left">
              <AlertTriangle className="mr-2" size={18} /> Alerta de Inventario Crítico
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockProducts.slice(0, 6).map(p => (
                <div key={p.id} className="p-3 bg-card rounded-none border border-destructive/30 flex justify-between items-center group hover:border-destructive transition-colors">
                  <span className="font-bold text-xs text-foreground truncate mr-2 uppercase">{p.name}</span>
                  <span className="px-2 py-1 bg-destructive text-destructive-foreground rounded-none font-black text-[9px] shrink-0 tracking-tighter">
                    STOCK: {p.stock_quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ title, value, icon: Icon, trend }: any) {
  return (
    <div className="p-6 bg-card border border-border rounded-none shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-muted rounded-none text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Icon size={24} />
        </div>
        <span className="text-[9px] font-black px-2 py-1 rounded-none bg-muted text-muted-foreground uppercase tracking-widest">
          {trend}
        </span>
      </div>
      <h3 className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-2xl font-black text-card-foreground tracking-tighter">{value}</p>
    </div>
  );
}

export default App;
