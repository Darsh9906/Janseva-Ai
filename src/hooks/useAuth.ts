"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { signOut } from "@/components/auth/AuthProvider";

/** Convenience hook exposing auth state + actions. */
export function useAuth() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  const signIn = () => {
    router.push("/auth");
  };

  /** Run `action` if signed in; otherwise redirect to /auth page. */
  const requireAuth = (action?: () => void) => {
    if (!user) {
      router.push("/auth");
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
    signIn,
    signOut,
    requireAuth,
  };
}
