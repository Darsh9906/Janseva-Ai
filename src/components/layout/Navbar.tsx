"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, Trophy, LayoutDashboard, Globe, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/hooks/useTranslation";
import { languages } from "@/translations";

const cleanName = (name?: string | null, email?: string | null) => {
  const n = name?.trim();
  if (n) return n;
  return email?.split("@")[0] ?? "User";
};

const publicLinks = [
  { href: "/issues", label: "Issues" },
  { href: "/map", label: "Map" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthed, signIn, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const initLanguage = useLanguageStore((s) => s.initLanguage);
  const currentLangCode = useLanguageStore((s) => s.lang);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const { t } = useTranslation();

  useEffect(() => {
    initLanguage();
  }, [initLanguage]);

  const currentLang = languages.find((l) => l.code === currentLangCode) ?? languages[0];
  const showReportButton = !isAuthed || user?.role === "citizen";

  const allLinks = !isAuthed
    ? publicLinks
    : user?.role === "admin"
    ? [
        { href: "/admin", label: "Admin Dashboard" },
        { href: "/issues", label: "Issues" },
        { href: "/admin?tab=officers", label: "Officers" },
        { href: "/dashboard", label: "Analytics" },
      ]
    : user?.role === "officer"
    ? [
        { href: "/officer", label: "Officer Dashboard" },
        { href: "/officer?tab=assigned", label: "Assigned Issues" },
      ]
    : publicLinks; // citizen

  const getTranslatedLabel = (label: string) => {
    switch (label) {
      case "Issues": return t("nav.issues");
      case "Map": return t("nav.map");
      case "Dashboard": return t("nav.dashboard");
      case "Leaderboard": return t("nav.leaderboard");
      case "Admin Dashboard": return t("nav.admin");
      case "Officer Dashboard": return t("nav.officer");
      case "Officers": return t("nav.officers");
      case "Assigned Issues": return t("nav.assigned");
      case "Analytics": return t("nav.analytics");
      default: return label;
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {allLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === l.href
                  ? "text-primary"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              {getTranslatedLabel(l.label)}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector for Desktop */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-ink-soft hover:text-ink hover:bg-slate-50 transition cursor-pointer"
              aria-label="Select Language"
            >
              <Globe size={15} />
              <span>{currentLang.name}</span>
              <ChevronDown size={14} className={cn("transition-transform", langOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {langOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setLangOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 z-20 mt-2 max-h-80 w-48 overflow-y-auto rounded-xl border border-line bg-white p-2 shadow-lg"
                  >
                    <p className="px-2.5 py-1.5 text-xs font-semibold text-ink-faint">
                      Language / भाषा
                    </p>
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLanguage(l.code);
                          setLangOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm cursor-pointer hover:bg-slate-50",
                          currentLangCode === l.code
                            ? "font-semibold text-primary bg-primary-50"
                            : "text-ink-soft"
                        )}
                      >
                        {l.name}
                        {currentLangCode === l.code && <span className="text-primary font-bold">✓</span>}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {showReportButton && (
            <Link href="/report" className="hidden sm:block">
              <Button size="sm">{t("nav.reportIssue")}</Button>
            </Link>
          )}

          {isAuthed ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center rounded-full p-0.5 transition hover:ring-2 hover:ring-primary/15 cursor-pointer"
              >
                <Avatar src={user?.avatar} name={cleanName(user?.name, user?.email)} size={34} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-line bg-white p-2 shadow-lg"
                    >
                      <div className="border-b border-line px-3 py-2.5">
                        <p className="truncate text-sm font-semibold text-ink">
                          {cleanName(user?.name, user?.email)}
                        </p>
                        <p className="truncate text-xs text-ink-faint">
                          {user?.email}
                        </p>
                        {user?.role === "citizen" && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
                            <Trophy size={13} />
                            {user?.heroPoints ?? 0} {t("leaderboard.points", { count: "" }).replace("pts", "points")}
                          </div>
                        )}
                        {user?.role === "officer" && (
                          <div className="mt-2 text-xs font-semibold text-primary">
                            Officer · {user?.department}
                          </div>
                        )}
                        {user?.role === "admin" && (
                          <div className="mt-2 text-xs font-semibold text-primary">
                            Admin Account
                          </div>
                        )}
                      </div>
                      <Link
                        href={
                          user?.role === "admin"
                            ? "/admin"
                            : user?.role === "officer"
                            ? "/officer"
                            : "/dashboard"
                        }
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-primary-50"
                      >
                        <LayoutDashboard size={15} /> {t("nav.dashboard")}
                      </Link>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          signOut();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-50 cursor-pointer"
                      >
                        <LogOut size={15} /> {t("nav.signOut")}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={signIn}>
              {t("nav.signIn")}
            </Button>
          )}

          <button
            className="rounded-md p-2 text-ink-soft md:hidden cursor-pointer"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-line bg-white md:hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              {allLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-ink-soft hover:text-ink"
                >
                  {getTranslatedLabel(l.label)}
                </Link>
              ))}
              {showReportButton && (
                <Link href="/report" onClick={() => setMobileOpen(false)}>
                  <Button className="mt-2 w-full">{t("nav.reportIssue")}</Button>
                </Link>
              )}

              <div className="my-2 border-t border-line" />

              {/* Mobile Language Selector */}
              <div className="px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint mb-2">
                  Language / भाषा
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setMobileOpen(false);
                      }}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left text-xs font-medium transition cursor-pointer",
                        currentLangCode === l.code
                          ? "border-primary bg-primary-50 text-primary font-semibold"
                          : "border-line bg-white text-ink-soft hover:border-primary/40"
                      )}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
