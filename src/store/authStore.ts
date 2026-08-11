import { create } from "zustand";
import type { AppUser } from "@/types";

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  signInOpen: boolean;
  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  patchUser: (patch: Partial<AppUser>) => void;
  openSignIn: () => void;
  closeSignIn: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  signInOpen: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  patchUser: (patch) =>
    set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
  openSignIn: () => set({ signInOpen: true }),
  closeSignIn: () => set({ signInOpen: false }),
}));
