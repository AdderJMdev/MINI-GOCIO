import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  ShoppingCart, 
  Truck, 
  Package, 
  User, 
  Settings,
  Circle,
  Calendar,
  Tag,
  Info,
  PackageSearch,
  Hash,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [details, setDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ["activity_logs"],
    queryFn: () => invoke<any[]>("get_activity_logs"),
  });

  const clearMutation = useMutation({
    mutationFn: () => invoke("clear_activity_logs"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity_logs"] });
      toast.success("Historial de actividad eliminado por completo");
    },
    onError: (err: any) => toast.error(`Error al borrar: ${err}`),
  });

  const currencySymbol = "S/";

  if (error) {
    return (
      <div className="p-8 text-center bg-destructive/10 border border-destructive/20 text-destructive">
        <p className="font-bold uppercase tracking-widest">Error de Auditoría</p>
        <p className="text-xs italic mt-2">{(error as any).toString()}</p>
      </div>
    );
  }

  const fetchDetails = async (log: any) => {
    setSelectedLog(log);
    setDetails([]);
    
    if (!log.target_id) return;

    setLoadingDetails(true);
    try {
      if (log.category === "sale") {
        const data = await invoke<any[]>("get_sale_details", { saleId: log.target_id });
        setDetails(data);
      } else if (log.category === "purchase") {
        const data = await invoke<any[]>("get_purchase_details", { purchaseId: log.target_id });
        setDetails(data);
      }
    } catch (e) {
      console.error("Error fetching details:", e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "sale": return <ShoppingCart size={16} className="text-emerald-500" />;
      case "purchase": return <Truck size={16} className="text-blue-500" />;
      case "inventory": return <Package size={16} className="text-amber-500" />;
      case "customer": return <User size={16} className="text-purple-500" />;
      case "supplier": return <Truck size={16} className="text-cyan-500" />;
      case "settings": return <Settings size={16} className="text-slate-500" />;
      default: return <Activity size={16} className="text-primary" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "sale": return "VENTA";
      case "purchase": return "COMPRA";
      case "inventory": return "INVENTARIO";
      case "customer": return "CLIENTE";
      case "supplier": return "PROVEEDOR";
      case "settings": return "CONFIG.";
      default: return "SISTEMA";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "sale": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "purchase": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "inventory": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "customer": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "supplier": return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
      case "settings": return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Registro de Actividad Permanente</h2>
          <p className="text-xs text-muted-foreground italic">Auditoría completa de todas las operaciones realizadas.</p>
        </div>
        
        <div className="flex gap-4">
          <Button 
            variant="destructive" 
            size="sm" 
            className="rounded-none font-bold uppercase text-[10px] tracking-widest"
            onClick={() => {
              if (confirm("¿ESTÁ SEGURO? Esta acción eliminará permanentemente TODO el historial de actividad. No se puede deshacer.")) {
                clearMutation.mutate();
              }
            }}
            disabled={logs.length === 0 || clearMutation.isPending}
          >
            <Trash2 size={14} className="mr-2" /> Borrar Todo
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-none overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="w-48 font-bold text-xs uppercase tracking-widest">Fecha y Hora</TableHead>
              <TableHead className="w-32 font-bold text-xs uppercase tracking-widest">Categoría</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-widest">Acción Realizada</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-widest">Resumen de Datos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-sm uppercase animate-pulse">Cargando bitácora...</TableCell></TableRow>
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">No hay actividad registrada en la base de datos</TableCell></TableRow>
            ) : logs.map((log) => (
              <TableRow 
                key={log.id} 
                className="hover:bg-muted/50 border-l-4 transition-all cursor-pointer group" 
                style={{ borderLeftColor: `var(--${log.category === 'sale' ? 'success' : log.category === 'purchase' ? 'primary' : 'muted'})` }}
                onClick={() => fetchDetails(log)}
              >
                <TableCell className="text-xs font-mono text-muted-foreground group-hover:text-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className={`inline-flex items-center px-2 py-0.5 text-[9px] font-black border rounded-none tracking-tighter ${getCategoryColor(log.category)}`}>
                    <span className="mr-1">{getCategoryIcon(log.category)}</span>
                    {getCategoryLabel(log.category)}
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                  {log.action}
                </TableCell>
                <TableCell className="text-muted-foreground italic text-xs truncate max-w-xs">
                  {log.details || "---"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-none border-2 border-primary/20 bg-card p-0 overflow-hidden shadow-2xl">
          <div className="bg-muted p-6 border-b border-border flex justify-between items-start">
            <div className="space-y-1">
              <div className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black border rounded-none mb-2 ${selectedLog ? getCategoryColor(selectedLog.category) : ""}`}>
                {selectedLog && getCategoryIcon(selectedLog.category)}
                <span className="ml-1">{selectedLog && getCategoryLabel(selectedLog.category)}</span>
              </div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-foreground leading-none">
                {selectedLog?.action}
              </DialogTitle>
              <DialogDescription className="text-xs font-mono text-muted-foreground mt-2">
                ID DE SEGUIMIENTO: #{selectedLog?.id} {selectedLog?.target_id && `| ENTIDAD REF: #${selectedLog.target_id}`}
              </DialogDescription>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                <Calendar size={12} />
                {selectedLog && new Date(selectedLog.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase mt-1">
                <Activity size={12} />
                {selectedLog && new Date(selectedLog.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Info size={12} /> Resumen de la Operación
              </h4>
              <p className="text-sm font-medium text-foreground bg-muted/50 p-4 border border-border italic leading-relaxed">
                {selectedLog?.details || "No se registraron detalles técnicos adicionales para esta acción."}
              </p>
            </div>

            {(selectedLog?.category === 'sale' || selectedLog?.category === 'purchase') && selectedLog?.target_id && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <PackageSearch size={14} /> Desglose de Artículos
                </h4>
                
                <div className="border border-border rounded-none overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="text-[10px] font-black">PRODUCTO</TableHead>
                        <TableHead className="text-[10px] font-black text-center">CANT.</TableHead>
                        <TableHead className="text-[10px] font-black text-right">P. UNIT</TableHead>
                        <TableHead className="text-[10px] font-black text-right">SUBTOTAL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingDetails ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            <Info size={24} className="animate-spin mx-auto text-primary opacity-20" />
                          </TableCell>
                        </TableRow>
                      ) : details.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground italic">
                            No se pudieron recuperar los detalles de los artículos.
                          </TableCell>
                        </TableRow>
                      ) : details.map((item, idx) => (
                        <TableRow key={idx} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                          <TableCell className="text-xs font-bold uppercase">{item.name}</TableCell>
                          <TableCell className="text-xs font-mono text-center">x{item.quantity}</TableCell>
                          <TableCell className="text-xs font-mono text-right">{currencySymbol}{item.unit_price || item.unit_cost}</TableCell>
                          <TableCell className="text-xs font-black text-right">{currencySymbol}{(item.quantity * (item.unit_price || item.unit_cost)).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-border flex justify-between items-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash size={14} />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Bitácora de Auditoría Interna</span>
              </div>
              <div className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest">
                Verificado
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
