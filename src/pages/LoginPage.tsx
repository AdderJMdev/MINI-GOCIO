import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { Lock, Loader2, Delete, User as UserIcon, ArrowLeft, ShieldCheck, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [pin, setPin] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const login = useAuthStore((state) => state.login);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => invoke<any[]>("get_users"),
  });

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!pin || !selectedUser) return;

    setIsAuthenticating(true);
    try {
      const user = await invoke<any>("login_user", { userId: selectedUser.id, pin });
      if (user) {
        login(user);
        toast.success(`Bienvenido, ${user.name}`);
      } else {
        toast.error("PIN incorrecto");
        setPin("");
      }
    } catch (err: any) {
      toast.error(`Error: ${err}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 10) {
      setPin((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  if (usersLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-primary/5 -skew-y-6 transform origin-top-left -z-10"></div>
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-accent/5 rounded-full blur-3xl -z-10"></div>

      {!selectedUser ? (
        /* USER SELECTION VIEW */
        <div className="w-full max-w-2xl p-8 z-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">
              MINI<span className="text-primary">GOCIO</span>
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">Seleccione su perfil de usuario</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="group relative flex flex-col items-center p-8 bg-card border-2 border-border hover:border-primary transition-all duration-300 rounded-none shadow-sm hover:shadow-xl hover:-translate-y-1"
              >
                <div className="w-20 h-20 bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary flex items-center justify-center rounded-none mb-4 transition-colors">
                  <UserCircle size={48} strokeWidth={1.5} />
                </div>
                <span className="font-black text-sm uppercase tracking-tight mb-1">{user.name}</span>
                <div className={cn(
                  "text-[9px] font-black uppercase px-2 py-0.5 border rounded-none tracking-widest",
                  user.role === 'admin' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                )}>
                  {user.role === 'admin' ? "Administrador" : "Cajero"}
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ShieldCheck size={14} className={user.role === 'admin' ? "text-amber-500" : "text-blue-500"} />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* PIN ENTRY VIEW */
        <div className="w-full max-w-sm p-8 bg-card border-2 border-primary/20 rounded-none shadow-2xl z-10 animate-in slide-in-from-bottom-4 duration-300">
          <button 
            onClick={() => { setSelectedUser(null); setPin(""); }}
            className="mb-6 flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} className="mr-2" /> Volver a usuarios
          </button>

          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary/10 text-primary flex items-center justify-center rounded-none mb-4">
              <Lock size={32} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight">{selectedUser.name}</h2>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Ingrese su PIN de seguridad</p>
          </div>

          <form onSubmit={handleLogin} className="w-full flex flex-col items-center">
            <div className="flex justify-center mb-8 h-12">
              <div className="flex gap-3">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-primary scale-110 shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'bg-muted border border-border'}`}
                  />
                ))}
              </div>
              {pin.length > 4 && (
                <div className="ml-3 flex items-center text-primary font-black animate-pulse">+</div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 w-full mb-6 max-w-[280px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num.toString())}
                  className="h-16 text-2xl font-black bg-muted/30 hover:bg-primary/20 hover:text-primary border border-border/50 rounded-none transition-colors"
                >
                  {num}
                </button>
              ))}
              <div className="col-start-2">
                <button
                  type="button"
                  onClick={() => handleKeyPress("0")}
                  className="w-full h-16 text-2xl font-black bg-muted/30 hover:bg-primary/20 hover:text-primary border border-border/50 rounded-none transition-colors"
                >
                  0
                </button>
              </div>
              <div className="col-start-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full h-16 flex items-center justify-center text-destructive hover:bg-destructive/20 border border-border/50 rounded-none transition-colors"
                >
                  <Delete size={24} />
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 font-black uppercase tracking-widest rounded-none shadow-lg text-base"
              disabled={pin.length === 0 || isAuthenticating}
            >
              {isAuthenticating ? <Loader2 className="animate-spin mr-2" size={20} /> : "Desbloquear"}
            </Button>
          </form>
        </div>
      )}

      <div className="absolute bottom-4 text-[10px] uppercase font-bold text-muted-foreground/50 tracking-widest">
        Sistema de Acceso Criptográfico v2.0
      </div>
    </div>
  );
}
