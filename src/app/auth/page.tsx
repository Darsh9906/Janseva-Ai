"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import { signInWithGoogle } from "@/components/auth/AuthProvider";
import { ensureUserProfile } from "@/services/users";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Sprout,
  User,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Lock,
  UserPlus,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";

type Role = "citizen" | "officer" | "admin";
type Mode = "signin" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
  } = useAuthStore();

  const [role, setRoleState] = useState<Role>("citizen");
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  // If already logged in, redirect to correct dashboard
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "admin") {
        router.push("/admin");
      } else if (user.role === "officer") {
        router.push("/officer");
      } else {
        router.push("/dashboard");
      }
    }
  }, [authLoading, user, router]);

  const handleRoleChange = (selected: Role) => {
    setRoleState(selected);
    setLocalErr(null);
    if (selected !== "citizen") {
      setMode("signin"); // staff can only sign in
    }
  };

  const handleSocialLogin = async () => {
    setLoading(true);
    setLocalErr(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      console.warn(e);
      setLocalErr("Social sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      return setLocalErr("Please fill in all required fields.");
    }
    setLocalErr(null);
    setLoading(true);

    try {
      if (role === "citizen" && mode === "signup") {
        // Sign Up
        if (!name.trim()) {
          setLoading(false);
          return setLocalErr("Please enter your name.");
        }
        if (password !== confirmPassword) {
          setLoading(false);
          return setLocalErr("Passwords do not match.");
        }
        if (password.length < 6) {
          setLoading(false);
          return setLocalErr("Password must be at least 6 characters.");
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await ensureUserProfile(cred.user, name);
      } else {
        // Sign In (All roles)
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.warn(err);
      let msg = err.message || "Authentication failed.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        msg = "Invalid email or password.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "This email is already in use.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      }
      setLocalErr(msg);
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const renderError = localErr;

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg shadow-xl border border-line bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-8 sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-soft">
              <Sprout size={24} />
            </div>
            <h2 className="display mt-6 text-3xl font-bold tracking-tight text-ink break-words">
              Welcome back to JanSeva
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              Authenticate according to your respected access level
            </p>
          </div>

          {/* Role selector tabs */}
          <div className="mt-8 flex rounded-xl border border-line p-1 bg-slate-50/50">
            {[
              { id: "citizen", label: "Citizen", icon: User },
              { id: "officer", label: "Officer", icon: ShieldCheck },
              { id: "admin", label: "Admin", icon: ShieldAlert },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => handleRoleChange(t.id as Role)}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition cursor-pointer ${
                    role === t.id
                      ? "bg-primary text-white shadow-sm"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {role === "citizen" && (
                <div className="flex justify-center gap-4 border-b border-line pb-4 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setLocalErr(null);
                    }}
                    className={`text-sm font-semibold pb-1.5 border-b-2 transition cursor-pointer ${
                      mode === "signin"
                        ? "border-primary text-primary"
                        : "border-transparent text-ink-soft hover:text-ink"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setLocalErr(null);
                    }}
                    className={`text-sm font-semibold pb-1.5 border-b-2 transition cursor-pointer ${
                      mode === "signup"
                        ? "border-primary text-primary"
                        : "border-transparent text-ink-soft hover:text-ink"
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {renderError && (
                <div className="rounded-xl bg-danger-50 border border-danger/10 p-4 text-sm font-semibold text-danger break-words leading-relaxed">
                  {renderError}
                </div>
              )}

              {mode === "signup" && role === "citizen" && (
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-ink">Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-ink-faint" />
                    <Input
                      type="text"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-11"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-semibold text-ink">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-ink-faint" />
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-ink">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-ink-faint" />
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11"
                  />
                </div>
              </div>

              {mode === "signup" && role === "citizen" && (
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-ink">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-ink-faint" />
                    <Input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-11"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full h-12 text-base font-semibold mt-6 cursor-pointer"
              >
                {mode === "signup" ? <UserPlus size={18} /> : null}
                {mode === "signup"
                  ? "Register Citizen Account"
                  : `Sign In as ${role === "citizen" ? "Citizen" : role === "officer" ? "Officer" : "Admin"}`}
              </Button>
            </form>

            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-line"></div>
              </div>
              <div className="relative flex justify-center text-xs font-semibold uppercase">
                <span className="bg-white px-3 text-ink-faint">Or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="lg"
              loading={loading}
              onClick={handleSocialLogin}
              className="mt-6 w-full h-12 text-sm border-line text-ink hover:bg-slate-50 cursor-pointer"
            >
              {!loading && <FcGoogle size={20} />}
              Continue with Google
            </Button>

            {role !== "citizen" && (
              <div className="mt-6 rounded-xl border border-dashed border-line bg-primary-50/20 px-4 py-3 text-xs text-ink-soft leading-relaxed break-words">
                <span className="font-bold text-primary block mb-1">Staff Authentication Security:</span>
                Access is restricted to pre-authorized accounts with verified database roles. You can authenticate using Email/Password or your authorized Google account.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center gap-2 text-primary">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-current/30 border-t-current" />
      <span className="text-sm font-semibold">Loading authentication state...</span>
    </div>
  );
}
