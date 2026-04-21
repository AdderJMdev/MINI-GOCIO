import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { save, open as openDialog } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Building2, 
  Download, 
  Upload, 
  Palette, 
  Database, 
  AlertTriangle,
  Scale,
  FileSpreadsheet,
  Check,
  Moon,
  Sun,
  Wind,
  UserCog,
  UserPlus,
  Trash2,
  Edit2,
  KeyRound,
  ShieldCheck,
  User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

interface User {
  id?: number;
  name: string;
  pin_hash: string;
  role: string;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [companyName, setCompanyName] = useState("");
  const [defaultUnit, setDefaultUnit] = useState("kg");
  const [includeIgv, setIncludeIgv] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("nord");

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => invoke<Record<string, string>>("get_app_settings"),
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => invoke<any[]>("get_users"),
  });

  useEffect(() => {
    if (settings?.company_name) setCompanyName(settings.company_name);
    if (settings?.default_unit) setDefaultUnit(settings.default_unit);
    if (settings?.include_igv) setIncludeIgv(settings.include_igv === "true");
    if (settings?.app_theme) setCurrentTheme(settings.app_theme);
  }, [settings]);

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string, value: string }) => 
      invoke("update_setting", { key, value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Configuración actualizada");
    },
    onError: (err: any) => toast.error(`Error: ${err}`),
  });

  const upsertUserMutation = useMutation({
    mutationFn: (user: User) => invoke("upsert_user", { user }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsUserDialogOpen(false);
      setEditingUser(null);
      toast.success("Usuario guardado correctamente");
    },
    onError: (err: any) => toast.error(`Error: ${err}`),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => invoke("delete_user", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario eliminado");
    },
    onError: (err: any) => toast.error(`Error al eliminar: ${err}`),
  });

  const handleExport = async () => {
    try {
      const path = await save({
        filters: [{ name: "SQLite Database", extensions: ["db"] }],
        defaultPath: "minigocio_backup.db"
      });
      
      if (path) {
        await invoke("export_database", { targetPath: path });
        toast.success("Respaldo exportado correctamente");
      }
    } catch (err: any) {
      toast.error(`Error al exportar: ${err}`);
    }
  };

  const handleExportCSV = async (table: string) => {
    try {
      const csvData = await invoke<string>("export_to_csv", { tableName: table });
      const path = await save({
        filters: [{ name: "CSV File", extensions: ["csv"] }],
        defaultPath: `${table}_export.csv`
      });
      
      if (path) {
        await writeTextFile(path, csvData);
        toast.success(`Datos de ${table} exportados a CSV`);
      }
    } catch (err: any) {
      toast.error(`Error al exportar CSV: ${err}`);
    }
  };

  const handleImport = async () => {
    try {
      const path = await openDialog({
        filters: [{ name: "SQLite Database", extensions: ["db"] }],
        multiple: false
      });
      
      if (path && typeof path === 'string') {
        if (confirm("Esto reemplazará todos los datos actuales. ¿Desea continuar?")) {
          await invoke("import_database", { sourcePath: path });
          toast.success("Respaldo importado. Reinicie la aplicación.");
        }
      }
    } catch (err: any) {
      toast.error(`Error al importar: ${err}`);
    }
  };

  const handleUserSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const pin = formData.get("pin") as string;
    
    if (!editingUser && !pin) {
      toast.error("El PIN es obligatorio para nuevos usuarios");
      return;
    }

    const userData: User = {
      id: editingUser?.id,
      name: formData.get("name") as string,
      pin_hash: pin, // It's just plain text pin here, rust hashes it
      role: formData.get("role") as string,
    };
    
    upsertUserMutation.mutate(userData);
  };

  const themes = [
    { id: "nord", name: "Nord", icon: Wind, color: "bg-[#88c0d0]" },
    { id: "soft-dark", name: "Soft Dark", icon: Moon, color: "bg-[#4dabf7]" },
    { id: "soft-light", name: "Soft Light", icon: Sun, color: "bg-[#228be6]" },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8 h-12">
          <TabsTrigger value="general" className="h-full rounded-none">
            <Building2 className="mr-2" size={16} /> General
          </TabsTrigger>
          <TabsTrigger value="users" className="h-full rounded-none">
            <UserCog className="mr-2" size={16} /> Usuarios
          </TabsTrigger>
          <TabsTrigger value="themes" className="h-full rounded-none">
            <Palette className="mr-2" size={16} /> Apariencia
          </TabsTrigger>
          <TabsTrigger value="data" className="h-full rounded-none">
            <Database className="mr-2" size={16} /> Datos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="rounded-none border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest">Negocio y Fiscalidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-[10px] font-bold uppercase text-muted-foreground">Nombre de la Empresa</Label>
                <div className="flex gap-4">
                  <Input 
                    id="companyName" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Mi Negocio"
                    className="rounded-none bg-card h-10"
                  />
                  <Button 
                    onClick={() => updateSettingMutation.mutate({ key: "company_name", value: companyName })}
                    disabled={updateSettingMutation.isPending}
                    className="rounded-none h-10 px-8 font-bold"
                  >
                    GUARDAR
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-none">
                <div className="space-y-0.5">
                  <Label className="text-sm font-black uppercase">Impuesto IGV (18%)</Label>
                  <p className="text-[10px] text-muted-foreground italic">Calcular impuesto automáticamente en ventas.</p>
                </div>
                <Switch 
                  checked={includeIgv}
                  onCheckedChange={(checked) => {
                    setIncludeIgv(checked);
                    updateSettingMutation.mutate({ key: "include_igv", value: checked.toString() });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Unidad de Medida sugerida</Label>
                <select 
                  className="w-full h-10 px-3 rounded-none text-sm focus:outline-none"
                  value={defaultUnit}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDefaultUnit(val);
                    updateSettingMutation.mutate({ key: "default_unit", value: val });
                  }}
                >
                  <option value="unit">Unidad (Und)</option>
                  <option value="kg">Kilogramo (Kg)</option>
                  <option value="g">Gramo (g)</option>
                  <option value="l">Litro (L)</option>
                  <option value="ml">Mililitro (ml)</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="rounded-none border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm uppercase tracking-widest">Gestión de Acceso</CardTitle>
                <CardDescription>Crea y administra cajeros y administradores.</CardDescription>
              </div>
              <Dialog open={isUserDialogOpen} onOpenChange={(open) => {
                setIsUserDialogOpen(open);
                if (!open) setEditingUser(null);
              }}>
                <DialogTrigger asChild>
                  <Button className="rounded-none font-bold uppercase tracking-widest h-9 text-[10px]">
                    <UserPlus className="mr-2" size={14} /> Nuevo Usuario
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px] rounded-none border-2 border-primary/20 bg-card">
                  <DialogHeader className="border-b border-border pb-4">
                    <DialogTitle className="text-lg font-black uppercase tracking-tight text-primary">
                      {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUserSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[10px] font-bold uppercase text-muted-foreground">Nombre</Label>
                      <Input id="name" name="name" defaultValue={editingUser?.name} required className="rounded-none bg-background h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pin" className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                        <KeyRound size={12} /> {editingUser ? "Nuevo PIN (Dejar vacío para no cambiar)" : "PIN de Acceso"}
                      </Label>
                      <Input id="pin" name="pin" type="password" maxLength={10} className="rounded-none bg-background h-10 font-mono tracking-widest" placeholder="****" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-[10px] font-bold uppercase text-muted-foreground">Rol del Sistema</Label>
                      <select 
                        id="role" 
                        name="role" 
                        defaultValue={editingUser?.role || "cashier"}
                        className="w-full h-10 px-3 rounded-none text-sm focus:outline-none"
                        disabled={editingUser?.id === 1} // Cannot change role of root admin
                      >
                        <option value="cashier">Cajero (Solo POS)</option>
                        <option value="admin">Administrador (Acceso Total)</option>
                      </select>
                    </div>
                    <DialogFooter className="pt-4 border-t border-border mt-4">
                      <Button type="submit" disabled={upsertUserMutation.isPending} className="w-full rounded-none h-10 font-black uppercase tracking-widest">
                        {upsertUserMutation.isPending ? "Guardando..." : "Guardar Usuario"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-none overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase">Usuario</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Rol</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-xs uppercase animate-pulse">Cargando usuarios...</TableCell></TableRow>
                    ) : users.map((u: any) => (
                      <TableRow key={u.id} className="hover:bg-muted/30 group">
                        <TableCell className="font-bold text-foreground text-sm flex items-center gap-2">
                          <div className="p-1.5 bg-muted text-muted-foreground rounded-none group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <UserIcon size={14} />
                          </div>
                          {u.name}
                          {u.id === currentUser?.id && <span className="ml-2 text-[8px] px-1.5 py-0.5 bg-primary/20 text-primary border border-primary/30 uppercase tracking-widest">Tú</span>}
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "inline-flex items-center px-2 py-0.5 text-[9px] font-black border rounded-none uppercase tracking-widest",
                            u.role === 'admin' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          )}>
                            {u.role === 'admin' ? <ShieldCheck size={10} className="mr-1" /> : null}
                            {u.role === 'admin' ? "Admin" : "Cajero"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingUser(u); setIsUserDialogOpen(true); }} className="h-7 w-7 text-primary hover:bg-primary/10 rounded-none">
                              <Edit2 size={12} />
                            </Button>
                            {u.id !== 1 && u.id !== currentUser?.id && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-none" onClick={() => {
                                if (confirm(`¿Eliminar al usuario ${u.name}?`)) {
                                  deleteUserMutation.mutate(u.id);
                                }
                              }}>
                                <Trash2 size={12} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="themes">
          <Card className="rounded-none border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest">Esquema de Colores</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setCurrentTheme(theme.id);
                    updateSettingMutation.mutate({ key: "app_theme", value: theme.id });
                  }}
                  className={cn(
                    "relative flex items-center gap-3 p-4 border transition-all",
                    currentTheme === theme.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <div className={cn("p-2 rounded-none", currentTheme === theme.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    <theme.icon size={18} />
                  </div>
                  <span className={cn(
                    "font-bold text-xs uppercase tracking-tight",
                    currentTheme === theme.id ? "text-primary" : "text-foreground"
                  )}>{theme.name}</span>
                  {currentTheme === theme.id && <Check size={14} className="ml-auto text-primary" />}
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-destructive/20 rounded-none bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-destructive flex items-center">
                  <AlertTriangle className="mr-2" size={14} /> Gestión Crítica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" size="sm" onClick={handleExport} className="w-full rounded-none h-9 text-[10px] font-bold uppercase">
                  <Download className="mr-2" size={14} /> Exportar Base de Datos
                </Button>
                <Button variant="destructive" size="sm" onClick={handleImport} className="w-full rounded-none h-9 text-[10px] font-bold uppercase">
                  <Upload className="mr-2" size={14} /> Importar Base de Datos
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-none border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center">
                  <FileSpreadsheet className="mr-2" size={14} /> Exportación Rápida
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" size="sm" onClick={() => handleExportCSV("products")} className="w-full rounded-none h-9 text-[10px] font-bold uppercase border-primary/30 text-primary">
                  <FileSpreadsheet className="mr-2" size={14} /> Inventario a CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExportCSV("sales")} className="w-full rounded-none h-9 text-[10px] font-bold uppercase border-primary/30 text-primary">
                  <FileSpreadsheet className="mr-2" size={14} /> Historial a CSV
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
