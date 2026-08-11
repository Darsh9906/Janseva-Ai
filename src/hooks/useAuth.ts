"use client";

import { useAuthStore } from "@/store/authStore";
import { signInWithGoogle, signOut } from "@/components/auth/AuthProvider";

/** Convenience hook exposing auth state + actions. */
export function useAuth() {
  const { user, loading, openSignIn } = useAuthStore();

  const requireAuth = (action?: () => void) => {
    if (!user) {
      openSignIn();
      return false;
    }
    action?.();
    return true;
  };

  return {
    user,
    loading,
    isAuthed: Boolean(user),
    isAdmin: user?.role === "admin",
    isOfficer: user?.role === "officer" || user?.role === "admin",
    signIn: signInWithGoogle,
    signOut,
    requireAuth,
  };
}
