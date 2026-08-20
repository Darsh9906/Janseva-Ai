"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
} from "firebase/auth";
import { auth, googleProvider, firebaseEnabled } from "@/lib/firebase";
import { ensureUserProfile, getUser } from "@/services/users";
import { useAuthStore } from "@/store/authStore";


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!firebaseEnabled) {
      setLoading(false);
      return;
    }
    // Surface any error from the redirect sign-in flow when we land back.
    getRedirectResult(auth).catch((err) => {
      const code = (err as { code?: string })?.code;
      if (code === "auth/configuration-not-found") {
        console.warn(
          "Google sign-in isn't enabled. Firebase console → Authentication → " +
            "Sign-in method → Google → Enable."
        );
      } else {
        console.warn("Redirect sign-in error:", (err as Error)?.message);
      }
    });
    const unsub = onAuthStateChanged(
      auth,
      async (fbUser) => {
        if (fbUser) {
          try {
            const state = useAuthStore.getState();
            const selectedRole = (state as any).selectedRole;
            const profile = await ensureUserProfile(fbUser);
            // re-read to pick up any server-side role/points changes
            const fresh = (await getUser(fbUser.uid)) ?? profile;

            if (selectedRole) {
              if (selectedRole === "officer") {
                if (fresh.role !== "officer" && fresh.role !== "admin") {
                  (state as any).setAuthError?.("This account is not authorized for Officer access.");
                  setUser(null);
                  await fbSignOut(auth);
                  setLoading(false);
                  return;
                }
              } else if (selectedRole === "admin") {
                if (fresh.role !== "admin") {
                  (state as any).setAuthError?.("This account is not authorized for Admin access.");
                  setUser(null);
                  await fbSignOut(auth);
                  setLoading(false);
                  return;
                }
              }

              // Passed check: clear chosen role and error, set user, close modal, and redirect
              (state as any).setSelectedRole?.(null);
              (state as any).setAuthError?.(null);
              state.closeSignIn();
              setUser(fresh);

              if (fresh.role === "admin") {
                router.push("/admin");
              } else if (fresh.role === "officer") {
                router.push("/officer");
              } else {
                router.push("/dashboard");
              }
            } else {
              setUser(fresh);
            }
          } catch (e) {
            console.error("Failed to load profile", e);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      },
      (err) => {
        // e.g. auth/configuration-not-found when Authentication / the Google
        // provider hasn't been enabled in the Firebase console yet.
        console.warn(
          "Firebase Auth is not ready yet. Enable Authentication (Google sign-in) " +
            "in the Firebase console. Details:",
          err.message
        );
        setUser(null);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [setUser, setLoading, router]);


  return <>{children}</>;
}

/**
 * Trigger Google sign-in. Tries the popup first (best UX, no page reload), and
 * falls back to a full-page redirect when the popup is blocked or COOP
 * interferes — which avoids the cross-window polling that triggers the noisy
 * "Cross-Origin-Opener-Policy would block window.closed" warnings.
 */
export async function signInWithGoogle() {
  if (!firebaseEnabled) {
    alert(
      "Firebase is not configured yet. Add your NEXT_PUBLIC_FIREBASE_* keys to .env.local."
    );
    return;
  }
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      return; // user dismissed — not an error
    }
    if (code === "auth/configuration-not-found") {
      alert(
        "Google sign-in isn't enabled yet.\n\nIn the Firebase console: Authentication → " +
          "Sign-in method → Google → Enable. Then try again."
      );
      return;
    }
    // popup blocked / COOP / network popup issues → use redirect instead
    if (
      code === "auth/popup-blocked" ||
      code === "auth/operation-not-supported-in-this-environment" ||
      code === "auth/internal-error"
    ) {
      await signInWithRedirect(auth, googleProvider);
      return;
    }
    throw err;
  }
}

/** Force the redirect flow (used if popups are consistently problematic). */
export async function signInWithGoogleRedirect() {
  if (!firebaseEnabled) return;
  await signInWithRedirect(auth, googleProvider);
}

export async function signOut() {
  if (firebaseEnabled) await fbSignOut(auth);
}
