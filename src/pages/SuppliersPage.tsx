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
  Truck,
  Mail,
  Phone,
  MapPin,
  User
} from "lucide-react";
import { toast } from "sonner";

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => invoke<any[]>("get_suppliers"),
  });

  const upsertMutation = useMutation({
    mutationFn: (supplier: any) => invoke("upsert_supplier", { supplier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success(editingSupplier ? "Proveedor actualizado" : "Proveedor registrado");
      setIsDialogOpen(false);
      setEditingSupplier(null);
    },
    onError: (err: any) => toast.error(`Error: ${err}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: i64) => invoke("delete_supplier", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Proveedor eliminado");
    },
    onError: (err: any) => toast.error(`Error: ${err}`),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const supplier = {
      id: editingSupplier?.id || null,
      name: formData.get("name"),
      contact_name: formData.get("contact_name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      address: formData.get("address"),
    };
    upsertMutation.mutate(supplier);
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.contact_name && s.contact_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar por nombre o contacto..." 
            className="pl-10 rounded-none bg-card"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingSupplier(null);
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-none w-full sm:w-auto font-bold uppercase tracking-widest h-10 px-6">
              <Plus className="mr-2" size={18} /> Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-none border-2 border-primary/20 bg-card">
            <DialogHeader className="border-b border-border pb-4">
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-primary">
                {editingSupplier ? "Editar Proveedor" : "Registrar Nuevo Proveedor"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-bold uppercase text-muted-foreground">Nombre de la Empresa</Label>
                <Input id="name" name="name" defaultValue={editingSupplier?.name} required className="rounded-none bg-background h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_name" className="text-[10px] font-bold uppercase text-muted-foreground">Nombre de Contacto</Label>
                <Input id="contact_name" name="contact_name" defaultValue={editingSupplier?.contact_name} className="rounded-none bg-background h-10" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-bold uppercase text-muted-foreground">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingSupplier?.email} className="rounded-none bg-background h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[10px] font-bold uppercase text-muted-foreground">Teléfono</Label>
                  <Input id="phone" name="phone" defaultValue={editingSupplier?.phone} className="rounded-none bg-background h-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-[10px] font-bold uppercase text-muted-foreground">Dirección</Label>
                <Input id="address" name="address" defaultValue={editingSupplier?.address} className="rounded-none bg-background h-10" />
              </div>
              <DialogFooter className="pt-6 border-t border-border mt-4">
                <Button type="submit" className="w-full rounded-none h-12 font-black uppercase tracking-widest shadow-lg" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending ? "Guardando..." : "Guardar Proveedor"}
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
              <TableHead className="font-bold text-xs uppercase">Proveedor</TableHead>
              <TableHead className="font-bold text-xs uppercase">Contacto</TableHead>
              <TableHead className="font-bold text-xs uppercase hidden md:table-cell">Información</TableHead>
              <TableHead className="font-bold text-xs uppercase text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground uppercase animate-pulse">Cargando proveedores...</TableCell></TableRow>
            ) : filteredSuppliers.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">No se encontraron proveedores</TableCell></TableRow>
            ) : filteredSuppliers.map((s) => (
              <TableRow key={s.id} className="hover:bg-muted/30 group transition-colors">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-muted border border-border text-foreground rounded-none group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Truck size={18} />
                    </div>
                    <span className="font-bold text-foreground text-sm uppercase">{s.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm text-muted-foreground font-medium">
                    <User size={14} className="mr-1.5" />
                    {s.contact_name || "---"}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="space-y-1">
                    {s.email && <div className="flex items-center text-[10px] text-muted-foreground font-bold uppercase tracking-tighter"><Mail size={12} className="mr-1.5" /> {s.email}</div>}
                    {s.phone && <div className="flex items-center text-[10px] text-muted-foreground font-bold uppercase tracking-tighter"><Phone size={12} className="mr-1.5" /> {s.phone}</div>}
                    {s.address && <div className="flex items-center text-[10px] text-muted-foreground font-bold uppercase tracking-tighter"><MapPin size={12} className="mr-1.5" /> {s.address}</div>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-primary hover:bg-primary/10"
                      onClick={() => {
                        setEditingSupplier(s);
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
                        if (confirm(`¿Eliminar a ${s.name}?`)) {
                          deleteMutation.mutate(s.id);
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
