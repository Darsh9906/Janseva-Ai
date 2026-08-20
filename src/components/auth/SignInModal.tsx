"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sprout, User, ShieldCheck, ShieldAlert, ArrowLeft } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useAuthStore } from "@/store/authStore";
import { signInWithGoogle } from "./AuthProvider";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useTranslation";

export default function SignInModal() {
  const { t } = useTranslation();
  const {
    signInOpen,
    closeSignIn,
  } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<
    "citizen" | "officer" | "admin" | null
  >(null);

  const handleGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
      setAuthError("Failed to authenticate with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: "citizen" | "officer" | "admin") => {
    setSelectedRole(role);
    setAuthError(null);
  };

  const handleBack = () => {
    setSelectedRole(null);
    setAuthError(null);
  };

  const getRoleLabel = (role: "citizen" | "officer" | "admin") => {
    if (role === "citizen") return t("auth.citizen");
    if (role === "officer") return t("auth.officer");
    return t("auth.admin");
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

            {!selectedRole ? (
              <>
                <h2 className="display mt-5 text-3xl text-ink">
                  {t("auth.welcome")}
                </h2>
                <p className="mt-1.5 text-sm text-ink-soft">
                  {t("auth.chooseRole")}
                </p>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => handleRoleSelect("citizen")}
                    className="flex w-full items-start gap-4 rounded-xl border border-line p-4 text-left transition hover:border-primary/50 hover:bg-primary-50/10 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{t("auth.citizen")}</p>
                      <p className="text-xs text-ink-soft mt-0.5">
                        {t("auth.citizenDesc")}
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleRoleSelect("officer")}
                    className="flex w-full items-start gap-4 rounded-xl border border-line p-4 text-left transition hover:border-primary/50 hover:bg-primary-50/10 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{t("auth.officer")}</p>
                      <p className="text-xs text-ink-soft mt-0.5">
                        {t("auth.officerDesc")}
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleRoleSelect("admin")}
                    className="flex w-full items-start gap-4 rounded-xl border border-line p-4 text-left transition hover:border-primary/50 hover:bg-primary-50/10 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{t("auth.admin")}</p>
                      <p className="text-xs text-ink-soft mt-0.5">
                        {t("auth.adminDesc")}
                      </p>
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleBack}
                  className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline cursor-pointer"
                >
                  <ArrowLeft size={16} /> {t("auth.back")}
                </button>

                <h2 className="display mt-5 text-3xl text-ink capitalize">
                  {t("auth.signInAs", { role: getRoleLabel(selectedRole) })}
                </h2>
                <p className="mt-1.5 text-sm text-ink-soft">
                  {selectedRole === "citizen"
                    ? t("auth.citizenSignDesc")
                    : t("auth.staffSignDesc")}
                </p>

                {authError && (
                  <div className="mt-4 rounded-xl bg-danger-50 p-4 border border-danger/10 text-danger text-sm font-medium">
                    {authError}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="lg"
                  loading={loading}
                  onClick={handleGoogle}
                  className="mt-6 w-full"
                >
                  {!loading && <FcGoogle size={20} />}
                  {t("auth.google")}
                </Button>
              </>
            )}

            <p className="mt-6 text-center text-xs text-ink-faint">
              {t("auth.agreement")}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

