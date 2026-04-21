import { create } from "zustand";

interface User {
  id: number;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
  isAdmin: () => get().user?.role === "admin",
}));
