"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { listIssues } from "@/services/issues";
import { computeStats, type DashboardStats } from "@/lib/analytics";
import type { Issue } from "@/types";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton, EmptyState } from "@/components/ui/Feedback";
import IssueCard from "@/components/issues/IssueCard";
import { Button } from "@/components/ui/Button";
import { firebaseEnabled } from "@/lib/firebase";

// green-leaning, harmonious status palette
const STATUS_COLORS = ["#94a3b8", "#0f7a5c", "#b45309", "#d97706", "#16a34a"];

export default function DashboardPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseEnabled) {
      setLoading(false);
      return;
    }
    listIssues(300)
      .then((data) => {
        setIssues(data);
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
  }, []);

  if (loading) {
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

  if (!firebaseEnabled || !stats || stats.total === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <EmptyState
          icon={<LayoutDashboard />}
          title={firebaseEnabled ? "No data yet" : "Firebase not configured"}
          description={
            firebaseEnabled
              ? "Once citizens start reporting, live analytics appear here."
              : "Add your NEXT_PUBLIC_FIREBASE_* keys to .env.local to load analytics."
          }
          action={
            <Link href="/report">
              <Button>Report an issue</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const metrics = [
    { label: "Total reports", value: stats.total, icon: FileText },
    { label: "Resolved", value: stats.resolved, icon: CheckCircle2 },
    { label: "In progress", value: stats.inProgress, icon: Loader2 },
    { label: "Resolution rate", value: `${stats.resolutionRate}%`, icon: TrendingUp },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6">
      {/* header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">
          <LayoutDashboard className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl text-ink lg:text-4xl">Civic Dashboard</h1>
          <p className="text-sm text-ink-soft">Live insights from your community.</p>
        </div>
      </div>

      {/* metrics */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => (
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
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5 sm:p-6">
            <h2 className="font-semibold text-ink">Issues by category</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byCategory} margin={{ left: -18 }}>
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
            <h2 className="font-semibold text-ink">Status distribution</h2>
            <div className="mt-4 flex h-72 items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byStatus.filter((s) => s.count > 0)}
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
                    <span className="text-ink-soft">{s.name}</span>
                    <span className="font-semibold text-ink">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* hotspots + AI insights */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardContent className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-semibold text-ink">
              <Flame size={18} className="text-warning" /> Hotspot areas
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
              <Sparkles size={18} className="text-primary" /> AI insights
            </h2>
            {insights.length === 0 ? (
              <p className="mt-4 text-sm text-ink-faint">
                Reading the latest reports…
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

      {/* recent feed */}
      <div className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="display text-2xl text-ink">Recent reports</h2>
          <Link href="/issues" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            View all <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {issues.slice(0, 6).map((i) => (
            <IssueCard key={i.id} issue={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
