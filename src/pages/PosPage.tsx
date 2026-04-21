import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useCartStore } from "@/store/useCartStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, Plus, Minus, Smartphone, Banknote, Search } from "lucide-react";
import { toast } from "sonner";

export default function PosPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { items, addItem, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();

  const { data: products = [], error: productsError } = useQuery({
    queryKey: ["products"],
    queryFn: () => invoke<any[]>("get_products"),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => invoke<any[]>("get_customers"),
  });

  const { data: settings, isLoading: settingsLoading, error: settingsError } = useQuery({
    queryKey: ["settings"],
    queryFn: () => invoke<Record<string, string>>("get_app_settings"),
  });

  const includeIgv = settings?.include_igv === "true";
  const currencySymbol = "S/";

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const saleMutation = useMutation({
    mutationFn: (saleData: any) => invoke("process_sale", { sale: saleData }),
    onSuccess: () => {
      toast.success("Venta procesada con éxito");
      clearCart();
      setSelectedCustomerId(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
      queryClient.invalidateQueries({ queryKey: ["sales_by_day"] });
      queryClient.invalidateQueries({ queryKey: ["top_products"] });
      queryClient.invalidateQueries({ queryKey: ["activity_logs"] });
    },
    onError: (err: any) => toast.error(`Error: ${err}`),
  });

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  if (settingsError || productsError) {
    return (
      <div className="p-8 text-center bg-destructive/10 border border-destructive/20 text-destructive">
        <p className="font-bold">Error al cargar datos del POS</p>
        <p className="text-sm italic">{(settingsError || productsError)?.toString()}</p>
      </div>
    );
  }

  if (settingsLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const subtotal = typeof getTotal === 'function' ? getTotal() : 0;
  const igvAmount = includeIgv ? subtotal * 0.18 : 0;
  const finalTotal = subtotal + igvAmount;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredProducts = Array.isArray(products) ? products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, 5) : [];

  const handleCheckout = (method: string) => {
    if (items.length === 0) return;
    
    const saleData = {
      customer_id: selectedCustomerId,
      total_amount: finalTotal,
      payment_method: method,
      items: items.map(i => ({
        product_id: i.id,
        quantity: i.quantity,
        unit_price: i.price
      }))
    };
    
    saleMutation.mutate(saleData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      {/* Left: Product Selection */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input 
                ref={searchInputRef}
                placeholder="Buscar producto por nombre o SKU..." 
                className="pl-10 h-12 text-lg rounded-none bg-card"
                value={searchTerm}
                onChange={handleSearch}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredProducts.length === 1) {
                    const p = filteredProducts[0];
                    if (p.stock_quantity > 0) {
                      addItem({ id: p.id, name: p.name, price: p.price });
                      setSearchTerm("");
                    }
                  }
                }}
              />
            </div>
            
            <div className="w-64">
              <select 
                className="w-full h-12 rounded-none px-3 py-2 text-sm focus:outline-none"
                value={selectedCustomerId || ""}
                onChange={(e) => setSelectedCustomerId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="" className="bg-card">Cliente Ocasional</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id} className="bg-card">{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {searchTerm && (
          <div className="bg-card border border-border rounded-none overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-2 z-20 relative">
            {filteredProducts.map(p => (
              <button
                key={p.id}
                className="w-full flex items-center justify-between p-4 hover:bg-muted border-b border-border last:border-0 transition-colors"
                onClick={() => {
                  if (p.stock_quantity > 0) {
                    addItem({ id: p.id, name: p.name, price: p.price });
                    setSearchTerm("");
                    searchInputRef.current?.focus();
                  } else {
                    toast.error("Sin stock disponible");
                  }
                }}
              >
                <div className="text-left">
                  <p className="font-bold text-foreground">{p.name}</p>
                  <p className="text-sm text-muted-foreground">SKU: {p.sku || "N/A"} | Stock: {p.stock_quantity}</p>
                </div>
                <p className="font-bold text-lg text-foreground">{currencySymbol}{p.price.toFixed(2)}</p>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No se encontraron productos</div>
            )}
          </div>
        )}

        <div className="bg-muted/30 border border-dashed border-border rounded-none p-8 flex flex-col items-center justify-center text-muted-foreground min-h-[300px]">
          <ShoppingCart size={48} className="mb-4 opacity-20" />
          <p className="text-sm uppercase font-bold tracking-widest">Panel de Selección de Productos</p>
        </div>
      </div>

      {/* Right: Cart & Checkout */}
      <div className="bg-card border border-border rounded-none shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 bg-muted border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground uppercase tracking-wider text-xs">Carrito de Ventas</h3>
          <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground hover:text-destructive rounded-none h-7 text-[10px]">
            Limpiar
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-none border border-border/50">
              <div className="flex-1 mr-4">
                <p className="font-semibold text-foreground text-sm line-clamp-1 uppercase">{item.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{currencySymbol}{item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" className="h-7 w-7 rounded-none" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                  <Minus size={12} />
                </Button>
                <span className="font-bold w-6 text-center text-sm">{item.quantity}</span>
                <Button variant="outline" size="icon" className="h-7 w-7 rounded-none" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                  <Plus size={12} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive rounded-none" onClick={() => removeItem(item.id)}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="h-full flex items-center justify-center text-muted-foreground italic py-20 text-center text-sm">
              LISTA VACÍA
            </div>
          )}
        </div>

        <div className="p-6 bg-muted border-t border-border space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-muted-foreground text-[10px] uppercase font-bold">Subtotal</span>
            <span className="text-sm font-medium">{currencySymbol}{subtotal.toFixed(2)}</span>
          </div>
          
          {includeIgv && (
            <div className="flex justify-between items-end text-primary">
              <span className="text-[10px] uppercase font-bold">IGV (18%)</span>
              <span className="text-sm font-bold">+{currencySymbol}{igvAmount.toFixed(2)}</span>
            </div>
          )}

          <Separator className="my-2" />

          <div className="flex justify-between items-end">
            <span className="text-foreground font-black text-xs uppercase">Total a Pagar</span>
            <span className="text-3xl font-black text-foreground">{currencySymbol}{finalTotal.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button 
              className="h-14 text-base font-black bg-emerald-600 hover:bg-emerald-700 rounded-none text-white shadow-lg"
              disabled={items.length === 0 || saleMutation.isPending}
              onClick={() => handleCheckout("Efectivo")}
            >
              <Banknote className="mr-2" size={20} />
              EFECTIVO
            </Button>
            <Button 
              variant="outline" 
              className="h-14 text-base font-black border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-none shadow-lg"
              disabled={items.length === 0 || saleMutation.isPending}
              onClick={() => handleCheckout("Yape/Plin")}
            >
              <Smartphone className="mr-2" size={20} />
              YAPE / PLIN
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
