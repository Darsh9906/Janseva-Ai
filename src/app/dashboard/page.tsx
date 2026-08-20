"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  LayoutDashboard,
  FileText,
  CheckCircle2,
  Loader2,
  Flame,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  User,
  Plus,
  Trophy,
  Activity,
} from "lucide-react";
import { listIssues } from "@/services/issues";
import { getLeaderboard } from "@/services/users";
import { computeStats, type DashboardStats } from "@/lib/analytics";
import type { Issue, AppUser } from "@/types";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton, EmptyState, Spinner } from "@/components/ui/Feedback";
import IssueCard from "@/components/issues/issueCard";
import { Button } from "@/components/ui/Button";
import { firebaseEnabled } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";

// green-leaning, harmonious status palette
const STATUS_COLORS = ["#94a3b8", "#0f7a5c", "#b45309", "#d97706", "#16a34a"];

export default function DashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isAuthed, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"my-activity" | "community">("my-activity");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Route protection
  useEffect(() => {
    if (!authLoading && !isAuthed) {
      router.push("/");
    } else if (!authLoading && user?.role === "officer") {
      router.push("/officer");
    } else if (!authLoading && user?.role === "admin") {
      router.push("/admin");
    }
  }, [authLoading, isAuthed, user, router]);

  useEffect(() => {
    if (!firebaseEnabled || !isAuthed) {
      setLoading(false);
      return;
    }

    Promise.all([listIssues(300), getLeaderboard(25)])
      .then(([data, lb]) => {
        setIssues(data);
        setLeaderboard(lb);
        const s = computeStats(data);
        setStats(s);

        if (data.length) {
          fetch("/api/insights", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ issues: data }),
          })
            .then((r) => r.json())
            .then((d) => setInsights(d.insights ?? []))
            .catch(() => {});
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [isAuthed]);

  // Compute my issues and stats
  const myIssues = useMemo(() => {
    if (!user) return [];
    return issues.filter((i) => i.createdBy === user.id);
  }, [issues, user]);

  const myRank = useMemo(() => {
    if (!user || !leaderboard.length) return "25+";
    const idx = leaderboard.findIndex((u) => u.id === user.id);
    return idx !== -1 ? `#${idx + 1}` : "25+";
  }, [leaderboard, user]);

  const myMetrics = useMemo(() => {
    const total = myIssues.length;
    const resolved = myIssues.filter((i) => i.status === "Resolved").length;
    const pending = total - resolved;
    return { total, resolved, pending };
  }, [myIssues]);

  const getPointsLabel = () => {
    return t("leaderboard.points", { count: "" }).replace("pts", "points").replace("अंक", "अंक").trim();
  };

  const getTranslatedCategory = (id: string) => {
    switch (id) {
      case "Pothole": return t("common.pothole");
      case "Water Leakage": return t("common.waterLeakage");
      case "Streetlight": return t("common.streetlight");
      case "Waste Management": return t("common.wasteManagement");
      case "Road Damage": return t("common.roadDamage");
      case "Drainage": return t("common.drainage");
      case "Public Safety": return t("common.publicSafety");
      default: return t("common.other");
    }
  };

  const getTranslatedStatus = (status: string) => {
    switch (status) {
      case "Reported": return t("common.reported");
      case "Verified": return t("common.verified");
      case "Assigned": return t("common.assigned");
      case "Working": return t("common.working");
      case "Resolved": return t("common.resolved");
      case "In Progress": return t("common.inProgress");
      default: return status;
    }
  };

  if (authLoading || (isAuthed && loading)) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Skeleton className="h-10 w-72" />
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="mt-6 h-80" />
      </div>
    );
  }

  if (!isAuthed) return null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6">
      {/* header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl text-ink lg:text-4xl">{t("nav.dashboard")}</h1>
            <p className="text-sm text-ink-soft">{t("footer.desc")}</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg border border-line p-1 bg-white max-w-xs">
          <button
            onClick={() => setActiveTab("my-activity")}
            className={`flex-1 rounded-md px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === "my-activity"
                ? "bg-primary text-white"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {t("nav.dashboard").split(" ")[0]}
          </button>
          <button
            onClick={() => setActiveTab("community")}
            className={`flex-1 rounded-md px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === "community"
                ? "bg-primary text-white"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {t("footer.community")}
          </button>
        </div>
      </div>

      {activeTab === "my-activity" ? (
        <div className="mt-8 animate-fade-up">
          {/* User Metrics */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
                  <FileText size={18} />
                </div>
                <p className="mt-3 text-3xl font-bold text-ink">{myMetrics.total}</p>
                <p className="text-xs font-medium text-ink-faint">{t("landing.stats.filed")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
                  <CheckCircle2 size={18} />
                </div>
                <p className="mt-3 text-3xl font-bold text-ink">{myMetrics.resolved}</p>
                <p className="text-xs font-medium text-ink-faint">{t("common.resolved")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
                  <Loader2 size={18} className="animate-spin-slow" />
                </div>
                <p className="mt-3 text-3xl font-bold text-ink">{myMetrics.pending}</p>
                <p className="text-xs font-medium text-ink-faint">{t("common.inProgress")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
                  <Trophy size={18} />
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <p className="text-3xl font-bold text-ink">{user?.heroPoints ?? 0}</p>
                  <span className="text-xs font-semibold text-primary">Rank {myRank}</span>
                </div>
                <p className="text-xs font-medium text-ink-faint">{getPointsLabel()}</p>
              </CardContent>
            </Card>
          </div>

          {/* My Reports list */}
          <div className="mt-12">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h2 className="display text-2xl text-ink">{t("issues.title")}</h2>
              <Link href="/report">
                <Button size="sm" className="flex items-center gap-1">
                  <Plus size={15} /> {t("nav.reportIssue").split(" ")[0]}
                </Button>
              </Link>
            </div>

            {myIssues.length === 0 ? (
              <div className="mt-8">
                <EmptyState
                  icon={<FileText className="h-6 w-6" />}
                  title="No reports yet"
                  description="You haven't reported any civic issues yet. Help improve your community by filing your first report!"
                  action={
                    <Link href="/report">
                      <Button>{t("nav.reportIssue")}</Button>
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {myIssues.map((i) => (
                  <IssueCard key={i.id} issue={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-8 animate-fade-up">
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: t("dashboard.totalReports"), value: stats?.total ?? 0, icon: FileText },
              { label: t("common.resolved"), value: stats?.resolved ?? 0, icon: CheckCircle2 },
              { label: t("common.inProgress"), value: stats?.inProgress ?? 0, icon: Loader2 },
              { label: t("dashboard.verificationRate"), value: `${stats?.resolutionRate ?? 0}%`, icon: TrendingUp },
            ].map((m) => (
              <Card key={m.label}>
                <CardContent className="p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
                    <m.icon size={18} />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-ink">{m.value}</p>
                  <p className="text-xs font-medium text-ink-faint">{m.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* charts */}
          {stats && (
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <Card>
                <CardContent className="p-5 sm:p-6">
                  <h2 className="font-semibold text-ink">{t("dashboard.chartTitle")}</h2>
                  <div className="mt-4 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.byCategory.map(c => ({ ...c, name: getTranslatedCategory(c.name) }))} margin={{ left: -18 }}>
                        <CartesianGrid vertical={false} stroke="#ebe8e1" strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#a2a09a" }} tickLine={false} axisLine={{ stroke: "#ebe8e1" }} interval={0} angle={-20} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 11, fill: "#a2a09a" }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip cursor={{ fill: "#f3f1ea" }} contentStyle={{ borderRadius: 12, border: "1px solid #ebe8e1", fontSize: 12 }} />
                        <Bar dataKey="count" fill="#0f7a5c" radius={[6, 6, 0, 0]} maxBarSize={46} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 sm:p-6">
                  <h2 className="font-semibold text-ink">{t("dashboard.triageTitle")}</h2>
                  <div className="mt-4 flex h-72 items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.byStatus.filter((s) => s.count > 0).map(s => ({ ...s, name: getTranslatedStatus(s.name) }))}
                          dataKey="count"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {stats.byStatus.map((s, i) => (
                            <Cell key={s.name} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #ebe8e1", fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 pr-2">
                      {stats.byStatus.map((s, i) => (
                        <div key={s.name} className="flex items-center gap-2 text-sm">
                          <span className="h-3 w-3 rounded-full" style={{ background: STATUS_COLORS[i] }} />
                          <span className="text-ink-soft">{getTranslatedStatus(s.name)}</span>
                          <span className="font-semibold text-ink">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* hotspots + AI insights */}
          {stats && (
            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
              <Card>
                <CardContent className="p-5 sm:p-6">
                  <h2 className="flex items-center gap-2 font-semibold text-ink">
                    <Flame size={18} className="text-warning" /> {t("dashboard.hotspots")}
                  </h2>
                  <div className="mt-5 space-y-4">
                    {stats.hotspots.map((h, i) => (
                      <div key={h.area}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate pr-2 text-ink">
                            <span className="text-ink-faint">#{i + 1}</span> {h.area}
                          </span>
                          <span className="font-semibold text-ink">{h.count}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-primary-50">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${(h.count / stats.hotspots[0].count) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 sm:p-6">
                  <h2 className="flex items-center gap-2 font-semibold text-ink">
                    <Sparkles size={18} className="text-primary" /> {t("dashboard.aiInsights")}
                  </h2>
                  {insights.length === 0 ? (
                    <p className="mt-4 text-sm text-ink-faint">
                      {t("dashboard.generatingInsights")}
                    </p>
                  ) : (
                    <ul className="mt-5 space-y-4">
                      {insights.map((ins, i) => (
                        <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                          <span className="font-bold text-primary">{`0${i + 1}`}</span>
                          {ins}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
