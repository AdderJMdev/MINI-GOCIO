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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPlus, Search, Edit, Trash2, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id?: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export default function CustomerPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => invoke<Customer[]>("get_customers"),
  });

  const upsertMutation = useMutation({
    mutationFn: (customer: Customer) => invoke("upsert_customer", { customer }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsDialogOpen(false);
      setEditingCustomer(null);
      toast.success("Cliente guardado correctamente");
    },
    onError: (err: any) => toast.error(`Error: ${err}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => invoke("delete_customer", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente eliminado");
    },
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const customer: Customer = {
      id: editingCustomer?.id,
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
    };
    upsertMutation.mutate(customer);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar por nombre, email o tel..." 
            className="pl-10 rounded-none bg-card h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCustomer(null)} className="rounded-none font-bold uppercase tracking-widest h-10 px-6">
              <UserPlus className="mr-2" size={18} />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none border-2 border-primary/20 bg-card">
            <DialogHeader className="border-b border-border pb-4">
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-primary">
                {editingCustomer ? "Editar Cliente" : "Agregar Nuevo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-6">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-[10px] font-bold uppercase text-muted-foreground">Nombre</Label>
                <Input id="name" name="name" defaultValue={editingCustomer?.name} className="col-span-3 rounded-none bg-background h-10" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right text-[10px] font-bold uppercase text-muted-foreground">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={editingCustomer?.email || ""} className="col-span-3 rounded-none bg-background h-10" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right text-[10px] font-bold uppercase text-muted-foreground">Teléfono</Label>
                <Input id="phone" name="phone" defaultValue={editingCustomer?.phone || ""} className="col-span-3 rounded-none bg-background h-10" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right text-[10px] font-bold uppercase text-muted-foreground">Dirección</Label>
                <Input id="address" name="address" defaultValue={editingCustomer?.address || ""} className="col-span-3 rounded-none bg-background h-10" />
              </div>
              <DialogFooter className="pt-6 border-t border-border mt-4">
                <Button type="submit" disabled={upsertMutation.isPending} className="w-full rounded-none h-12 font-black uppercase tracking-widest shadow-lg">
                  {upsertMutation.isPending ? "Guardando..." : "Guardar Cliente"}
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
              <TableHead className="text-foreground font-bold text-xs uppercase tracking-widest">Nombre</TableHead>
              <TableHead className="text-foreground font-bold text-xs uppercase tracking-widest">Contacto</TableHead>
              <TableHead className="text-foreground font-bold text-xs uppercase tracking-widest">Dirección</TableHead>
              <TableHead className="text-right text-foreground font-bold text-xs uppercase tracking-widest">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-sm uppercase animate-pulse">Cargando base de datos...</TableCell></TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">No se encontraron registros</TableCell></TableRow>
            ) : filteredCustomers.map((c) => (
              <TableRow key={c.id} className="hover:bg-muted/30 group transition-colors">
                <TableCell className="font-bold text-foreground text-sm uppercase">{c.name}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {c.email && (
                      <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                        <Mail size={12} className="mr-2 text-primary" /> {c.email}
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                        <Phone size={12} className="mr-2 text-primary" /> {c.phone}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {c.address ? (
                    <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-tighter max-w-[200px] truncate">
                      <MapPin size={12} className="mr-2 shrink-0 text-primary" /> {c.address}
                    </div>
                  ) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingCustomer(c); setIsDialogOpen(true); }} className="h-8 w-8 text-primary hover:bg-primary/10">
                      <Edit size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => c.id && deleteMutation.mutate(c.id)}>
                      <Trash2 size={14} />
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
