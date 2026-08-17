"use client";

import { useEffect } from "react";
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
import SignInModal from "./SignInModal";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    if (!firebaseEnabled) {
      setLoading(false);
      return;
    }
    
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
            const profile = await ensureUserProfile(fbUser);
            
            const fresh = (await getUser(fbUser.uid)) ?? profile;
            setUser(fresh);
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
  }, [setUser, setLoading]);

  return (
    <>
      {children}
      <SignInModal />
    </>
  );
}


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
      return; 
    }
    if (code === "auth/configuration-not-found") {
      alert(
        "Google sign-in isn't enabled yet.\n\nIn the Firebase console: Authentication → " +
          "Sign-in method → Google → Enable. Then try again."
      );
      return;
    }
    
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


export async function signInWithGoogleRedirect() {
  if (!firebaseEnabled) return;
  await signInWithRedirect(auth, googleProvider);
}

export async function signOut() {
  if (firebaseEnabled) await fbSignOut(auth);
}
