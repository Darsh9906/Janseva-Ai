"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sprout } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useAuthStore } from "@/store/authStore";
import { signInWithGoogle } from "./AuthProvider";
import { Button } from "@/components/ui/Button";

export default function SignInModal() {
  const { signInOpen, closeSignIn } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      closeSignIn();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {signInOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSignIn}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-dark/40 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-xl"
          >
            <button
              onClick={closeSignIn}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-faint hover:bg-primary-50"
            >
              <X size={18} />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
              <Sprout size={24} />
            </div>

            <h2 className="display mt-5 text-3xl text-ink">
              Welcome to JanSeva
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              Sign in to report issues, verify reports from your neighbours, and
              earn points for helping out.
            </p>

            <Button
              variant="outline"
              size="lg"
              loading={loading}
              onClick={handleGoogle}
              className="mt-7 w-full"
            >
              {!loading && <FcGoogle size={20} />}
              Continue with Google
            </Button>

            <p className="mt-4 text-center text-xs text-ink-faint">
              By continuing you agree to participate respectfully in your local
              community.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
