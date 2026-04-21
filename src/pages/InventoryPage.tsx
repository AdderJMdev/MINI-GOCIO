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
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertCircle,
  Package,
  Tag,
  Truck,
  Layers
} from "lucide-react";
import { toast } from "sonner";

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => invoke<any[]>("get_products"),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => invoke<any[]>("get_suppliers"),
  });

  const currencySymbol = "S/";

  const upsertMutation = useMutation({
    mutationFn: (product: any) => invoke("upsert_product", { product }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", "activity_logs"] });
      toast.success(editingProduct ? "Producto actualizado" : "Producto creado");
      setIsDialogOpen(false);
      setEditingProduct(null);
    },
    onError: (err: any) => toast.error(`Error: ${err}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: i64) => invoke("delete_product", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", "activity_logs"] });
      toast.success("Producto eliminado");
    },
    onError: (err: any) => toast.error(`Error: ${err}`),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const supplierIdRaw = formData.get("supplier_id");
    
    const product = {
      id: editingProduct?.id || null,
      name: formData.get("name")?.toString() || "",
      sku: formData.get("sku")?.toString() || null,
      price: parseFloat(formData.get("price")?.toString() || "0"),
      stock_quantity: parseFloat(formData.get("stock_quantity")?.toString() || "0"),
      brand: formData.get("brand")?.toString() || null,
      supplier_id: supplierIdRaw ? parseInt(supplierIdRaw.toString()) : null,
      stock_type: formData.get("stock_type")?.toString() || "quantity",
      category_id: 1, // Default for now
    };
    
    // Validate if supplier_id is a valid number if present
    if (supplierIdRaw && isNaN(product.supplier_id as number)) {
      product.supplier_id = null;
    }

    upsertMutation.mutate(product);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar por nombre, SKU o marca..." 
            className="pl-10 rounded-none bg-card"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingProduct(null);
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-none w-full sm:w-auto font-bold uppercase tracking-widest h-10 px-6">
              <Plus className="mr-2" size={18} /> Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-none max-h-[90vh] overflow-y-auto border-2 border-primary/20 bg-card">
            <DialogHeader className="border-b border-border pb-4">
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-primary">
                {editingProduct ? "Editar Producto" : "Agregar Nuevo Producto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] font-bold uppercase text-muted-foreground">Nombre del Producto</Label>
                  <Input id="name" name="name" defaultValue={editingProduct?.name} required className="rounded-none bg-background h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-[10px] font-bold uppercase text-muted-foreground">Código / SKU</Label>
                  <Input id="sku" name="sku" defaultValue={editingProduct?.sku} className="rounded-none bg-background h-10" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand" className="text-[10px] font-bold uppercase text-muted-foreground">Marca</Label>
                  <Input id="brand" name="brand" defaultValue={editingProduct?.brand} className="rounded-none bg-background h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier_id" className="text-[10px] font-bold uppercase text-muted-foreground">Proveedor</Label>
                  <select 
                    id="supplier_id" 
                    name="supplier_id" 
                    defaultValue={editingProduct?.supplier_id || ""}
                    className="w-full h-10 border border-border bg-background px-3 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Seleccione proveedor...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-[10px] font-bold uppercase text-muted-foreground">Precio de Venta</Label>
                  <Input id="price" name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required className="rounded-none bg-background h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity" className="text-[10px] font-bold uppercase text-muted-foreground">Stock Inicial</Label>
                  <Input id="stock_quantity" name="stock_quantity" type="number" step="0.01" defaultValue={editingProduct?.stock_quantity} required className="rounded-none bg-background h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_type" className="text-[10px] font-bold uppercase text-muted-foreground">Tipo de Unidad</Label>
                  <select 
                    id="stock_type" 
                    name="stock_type" 
                    defaultValue={editingProduct?.stock_type || "quantity"}
                    className="w-full h-10 border border-border bg-background px-3 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="quantity">Cantidad (Und)</option>
                    <option value="weight">Peso (Kg/g)</option>
                    <option value="volume">Volumen (L/ml)</option>
                  </select>
                </div>
              </div>

              <DialogFooter className="pt-6 border-t border-border mt-4">
                <Button type="submit" className="w-full rounded-none h-12 font-black uppercase tracking-widest shadow-lg" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending ? "Guardando..." : "Guardar Producto en Inventario"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-none overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="font-bold text-xs">PRODUCTO</TableHead>
              <TableHead className="font-bold text-xs">MARCA / SKU</TableHead>
              <TableHead className="font-bold text-xs">PROVEEDOR</TableHead>
              <TableHead className="font-bold text-xs">STOCK</TableHead>
              <TableHead className="font-bold text-xs text-right">PRECIO</TableHead>
              <TableHead className="font-bold text-xs text-right">ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm uppercase tracking-widest animate-pulse">Cargando catálogo...</TableCell></TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm italic">No se encontraron productos</TableCell></TableRow>
            ) : filteredProducts.map((p) => (
              <TableRow key={p.id} className="hover:bg-muted/30 transition-colors group">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-muted border border-border text-foreground rounded-none group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Package size={18} />
                    </div>
                    <span className="font-semibold text-foreground text-sm uppercase">{p.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center text-[10px] text-muted-foreground font-bold uppercase tracking-tighter"><Tag size={10} className="mr-1" /> {p.brand || "Sin marca"}</div>
                    <div className="text-[10px] font-mono bg-muted px-1.5 py-0.5 inline-block border border-border uppercase group-hover:border-primary/30 transition-colors">{p.sku || "N/A"}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Truck size={12} className="mr-1.5" />
                    {suppliers.find(s => s.id === p.supplier_id)?.name || "---"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className={cn(
                      "flex items-center px-2 py-0.5 text-[10px] font-black border rounded-none tracking-tighter",
                      p.stock_quantity <= 5 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-primary/10 text-primary border-primary/20"
                    )}>
                      <Layers size={10} className="mr-1" />
                      {p.stock_quantity} {p.stock_type === 'weight' ? 'kg' : p.stock_type === 'volume' ? 'l' : 'und'}
                    </div>
                    {p.stock_quantity <= 5 && <AlertCircle size={12} className="ml-1.5 text-destructive animate-pulse" />}
                  </div>
                </TableCell>
                <TableCell className="font-black text-foreground text-right text-sm">
                  {currencySymbol}{p.price.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-primary hover:bg-primary/10"
                      onClick={() => {
                        setEditingProduct(p);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit2 size={12} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm("¿Eliminar este producto?")) {
                          deleteMutation.mutate(p.id);
                        }
                      }}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
