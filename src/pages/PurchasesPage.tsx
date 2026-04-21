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
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Truck,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

export default function PurchasesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [purchaseItems, setPurchaseItems] = useState<any[]>([]);

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["purchases"],
    queryFn: () => invoke<any[]>("get_purchases"),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => invoke<any[]>("get_suppliers"),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => invoke<any[]>("get_products"),
  });

  const currencySymbol = "S/";

  const purchaseMutation = useMutation({
    mutationFn: (purchase: any) => invoke("process_purchase", { purchase }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases", "products", "dashboard_stats", "activity_logs"] });
      toast.success("Compra procesada con éxito");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(`Error: ${err}`),
  });

  const resetForm = () => {
    setSelectedSupplierId(null);
    setPurchaseItems([]);
  };

  const addItem = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = purchaseItems.find(i => i.product_id === productId);
    if (existingItem) {
      setPurchaseItems(purchaseItems.map(i => 
        i.product_id === productId ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setPurchaseItems([...purchaseItems, {
        product_id: productId,
        name: product.name,
        quantity: 1,
        unit_cost: product.price * 0.7 // Default estimate cost
      }]);
    }
  };

  const updateItem = (productId: number, field: string, value: any) => {
    setPurchaseItems(purchaseItems.map(i => 
      i.product_id === productId ? { ...i, [field]: value } : i
    ));
  };

  const removeItem = (productId: number) => {
    setPurchaseItems(purchaseItems.filter(i => i.product_id !== productId));
  };

  const calculateTotal = () => {
    return purchaseItems.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
  };

  const handleSubmit = () => {
    if (!selectedSupplierId) return toast.error("Seleccione un proveedor");
    if (purchaseItems.length === 0) return toast.error("Añada al menos un producto");

    const purchase = {
      supplier_id: selectedSupplierId,
      total_amount: calculateTotal(),
      items: purchaseItems.map(i => ({
        product_id: i.product_id,
        quantity: parseFloat(i.quantity),
        unit_cost: parseFloat(i.unit_cost)
      }))
    };

    purchaseMutation.mutate(purchase);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground uppercase tracking-tight">Historial de Adquisiciones</h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-none font-bold uppercase tracking-widest h-10 px-6">
              <Plus className="mr-2" size={18} /> Nueva Compra
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] rounded-none border-2 border-primary/20 bg-card">
            <DialogHeader className="border-b border-border pb-4">
              <DialogTitle className="uppercase font-black text-primary">Registrar Compra a Proveedor</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Proveedor</Label>
                  <select 
                    className="w-full h-10 border border-border bg-background px-3 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={selectedSupplierId || ""}
                    onChange={(e) => setSelectedSupplierId(parseInt(e.target.value))}
                  >
                    <option value="">Seleccione un proveedor...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Buscar Producto para añadir</Label>
                  <select 
                    className="w-full h-10 border border-border bg-background px-3 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    onChange={(e) => {
                      if (e.target.value) {
                        addItem(parseInt(e.target.value));
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="">Añadir producto...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku || "N/A"})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border border-border rounded-none overflow-hidden max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="text-[10px] font-bold uppercase">PRODUCTO</TableHead>
                      <TableHead className="w-24 text-[10px] font-bold uppercase">CANT.</TableHead>
                      <TableHead className="w-32 text-[10px] font-bold uppercase">COSTO UNIT.</TableHead>
                      <TableHead className="w-32 text-right text-[10px] font-bold uppercase">SUBTOTAL</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseItems.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic text-sm uppercase">No hay productos añadidos</TableCell></TableRow>
                    ) : purchaseItems.map((item) => (
                      <TableRow key={item.product_id}>
                        <TableCell className="font-bold text-sm uppercase">{item.name}</TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={item.quantity} 
                            onChange={(e) => updateItem(item.product_id, "quantity", e.target.value)}
                            className="h-8 rounded-none bg-background"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={item.unit_cost} 
                            onChange={(e) => updateItem(item.product_id, "unit_cost", e.target.value)}
                            className="h-8 rounded-none bg-background"
                          />
                        </TableCell>
                        <TableCell className="text-right font-black text-sm">
                          {currencySymbol}{(item.quantity * item.unit_cost).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => removeItem(item.product_id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center p-4 bg-muted border border-border">
                <span className="text-xs font-bold uppercase tracking-widest">Total Inversión</span>
                <span className="text-2xl font-black text-primary">{currencySymbol}{calculateTotal().toFixed(2)}</span>
              </div>

              <DialogFooter className="pt-6 border-t border-border mt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-none h-12 px-6 uppercase font-bold">Cancelar</Button>
                <Button onClick={handleSubmit} disabled={purchaseMutation.isPending} className="rounded-none h-12 px-8 font-black uppercase tracking-widest shadow-lg">
                  {purchaseMutation.isPending ? "PROCESANDO..." : "CONFIRMAR COMPRA"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-none overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="font-bold text-xs uppercase tracking-widest">Ref ID</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-widest">Fecha de Registro</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-widest">Proveedor Asociado</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-widest text-right">Monto de Inversión</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground uppercase tracking-widest animate-pulse">Cargando registros...</TableCell></TableRow>
            ) : purchases.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">No hay registros de compras</TableCell></TableRow>
            ) : purchases.map((p) => (
              <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-mono text-xs text-muted-foreground">#PUR-{p.id}</TableCell>
                <TableCell className="text-xs">{new Date(p.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex items-center text-sm font-semibold uppercase">
                    <Truck size={14} className="mr-2 text-primary" />
                    {p.supplier_name}
                  </div>
                </TableCell>
                <TableCell className="text-right font-black text-foreground">
                  {currencySymbol}{p.total_amount.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
