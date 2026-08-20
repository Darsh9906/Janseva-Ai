"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Camera,
  MapPin,
  Users,
  Clock,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Building2,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SeverityBadge, StatusBadge } from "@/components/ui/Badge";
import IssueCard from "@/components/issues/issueCard";
import { listIssues } from "@/services/issues";
import { firebaseEnabled } from "@/lib/firebase";
import { timeAgo } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { Issue } from "@/types";

const STEPS_TRACK = ["Reported", "Verified", "Assigned", "Working", "Resolved"];

const how = [
  {
    icon: Camera,
  },
  {
    icon: Users,
  },
  {
    icon: ShieldCheck,
  },
];

export default function LandingPage() {
  const { t, lang } = useTranslation();
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    if (!firebaseEnabled) return;
    listIssues(50).then(setIssues).catch(() => {});
  }, []);

  const featured = issues[0] ?? null;
  const total = issues.length;
  const resolved = issues.filter((i) => i.status === "Resolved").length;
  const verified = issues.filter((i) => i.confirmCount > 0).length;
  const recent = issues.slice(0, 3);
  const currentStep = featured ? STEPS_TRACK.indexOf(
    featured.status === "In Progress" ? "Working" : featured.status
  ) : 1;

  const getStepTitle = (idx: number) => {
    if (idx === 0) return t("landing.step1Title");
    if (idx === 1) return t("landing.step2Title");
    return t("landing.step3Title");
  };

  const getStepDesc = (idx: number) => {
    if (idx === 0) return t("landing.step1Desc");
    if (idx === 1) return t("landing.step2Desc");
    return t("landing.step3Desc");
  };

  const getTranslatedStatus = (status: string) => {
    switch (status) {
      case "Reported": return t("common.reported");
      case "Verified": return t("common.verified");
      case "Assigned": return t("common.assigned");
      case "Working": return t("common.working");
      case "Resolved": return t("common.resolved");
      default: return status;
    }
  };

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-primary-50 opacity-70 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-16 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {t("landing.badge")}
            </span>
            <h1 className="mt-6 text-5xl leading-[1.04] text-ink sm:text-6xl lg:text-7xl">
              {t("landing.title1")}
              <br />
              {lang === "en" ? (
                <>
                  what needs <span className="italic text-primary">fixing</span>.
                </>
              ) : (
                t("landing.title2")
              )}
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft lg:text-xl">
              {t("landing.desc")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/report">
                <Button size="lg" className="group h-13 px-7 text-base">
                  {t("nav.reportIssue")}
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="/map">
                <Button size="lg" variant="outline" className="h-13 px-7 text-base">
                  {t("landing.seeMap")}
                </Button>
              </Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-ink-faint">
              <ShieldCheck size={15} className="text-primary" />
              {t("landing.info")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative mx-auto w-full max-w-md"
          >
            <span className="absolute -left-3 -top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-sm">
              <Activity size={13} /> {t("landing.liveReport")}
            </span>
            <Link
              href={featured ? `/issues/${featured.id}` : "/report"}
              className="block overflow-hidden rounded-2xl border border-line bg-white shadow-[0_18px_50px_-16px_rgba(29,29,26,0.22)] transition-transform hover:-translate-y-1"
            >
              <div className="relative flex h-48 items-center justify-center bg-primary-50">
                {featured?.imageUrl ? (
                  <img src={featured.imageUrl} alt={featured.title} className="h-full w-full object-cover" />
                ) : (
                  <Camera size={34} className="text-primary/40" />
                )}
                <div className="absolute left-3 top-3"><StatusBadge status={featured?.status ?? "Reported"} /></div>
                <div className="absolute right-3 top-3"><SeverityBadge severity={featured?.severity ?? "High"} /></div>
                <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-md bg-white/85 px-2 py-1 text-xs font-medium text-ink-soft backdrop-blur">
                  <Clock size={12} /> {featured ? timeAgo(featured.createdAt) : t("landing.justNow")}
                </span>
              </div>
              <div className="p-6">
                <p className="text-sm font-medium text-primary">{featured?.category ?? t("common.pothole")}</p>
                <h3 className="mt-1 text-lg font-semibold text-ink">{featured?.title ?? "Large pothole near the junction"}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-ink-faint">
                  <MapPin size={14} /> {featured?.address ?? "Ward 12 · MG Road"}
                </p>
                <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
                  <Users size={16} className="text-ink-faint" />
                  <span className="text-sm text-ink-soft">
                    {t("landing.verifiedCount", { count: featured?.confirmCount ?? 3 })}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1.5">
                  {STEPS_TRACK.map((s, i) => (
                    <div key={s} className="flex flex-1 flex-col items-center gap-1">
                      <span className={`h-1.5 w-full rounded-full ${i <= currentStep ? "bg-primary" : "bg-line"}`} />
                      <span className={`text-[10px] ${i <= currentStep ? "font-semibold text-primary" : "text-ink-faint"}`}>
                        {getTranslatedStatus(s)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-line bg-primary text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-6 py-12 sm:grid-cols-4">
          {[
            { value: total, label: t("landing.stats.filed") },
            { value: verified, label: t("landing.stats.verified") },
            { value: resolved, label: t("landing.stats.resolved") },
            { value: 6, label: t("landing.stats.departments") },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="text-center"
            >
              <div className="display text-4xl lg:text-5xl">{s.value}</div>
              <p className="mt-1 text-sm text-white/70">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-end justify-between">
            <div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <Activity size={15} /> {t("landing.liveCommunity")}
              </span>
              <h2 className="display mt-2 text-3xl text-ink lg:text-4xl">
                {t("landing.reportedNow")}
              </h2>
            </div>
            <Link href="/issues" className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex">
              {t("landing.viewAll")} <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </section>
      )}

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="display text-4xl text-ink lg:text-5xl">{t("landing.howItWorks")}</h2>
            <p className="mt-3 text-lg text-ink-soft">{t("landing.howDesc")}</p>
          </div>
          <div className="relative mt-14 grid gap-10 sm:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-6 hidden h-px bg-line sm:block" />
            {how.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative text-center"
              >
                <div className="relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white text-primary shadow-sm">
                  <s.icon size={20} />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-ink">{getStepTitle(i)}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">{getStepDesc(i)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-line bg-white p-8 lg:p-10"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary">
              <Users size={20} />
            </div>
            <h3 className="display mt-5 text-2xl text-ink">{t("landing.forCitizens")}</h3>
            <p className="mt-2 text-ink-soft">
              {t("landing.forCitizensDesc")}
            </p>
            <Link href="/report" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              {t("nav.reportIssue")} <ArrowRight size={15} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-line bg-white p-8 lg:p-10"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary">
              <Building2 size={20} />
            </div>
            <h3 className="display mt-5 text-2xl text-ink">{t("landing.forOfficials")}</h3>
            <p className="mt-2 text-ink-soft">
              {t("landing.forOfficialsDesc")}
            </p>
            <Link href="/dashboard" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              {t("landing.viewDashboard")} <ArrowRight size={15} />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary">
            <Sparkles size={22} />
          </div>
          <h2 className="display mt-5 text-4xl text-ink lg:text-5xl">
            {t("landing.needFixing")}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-lg text-ink-soft">
            {t("landing.minuteDesc")}
          </p>
          <Link href="/report" className="mt-8 inline-block">
            <Button size="lg" className="h-13 px-8 text-base">
              {t("nav.reportIssue")}
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
