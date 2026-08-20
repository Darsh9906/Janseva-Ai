"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Clock,
  CheckCircle2,
  LayoutList,
  Filter,
  Building2,
  X,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { SeverityBadge, StatusBadge, Badge } from "@/components/ui/Badge";
import { Spinner, EmptyState } from "@/components/ui/Feedback";
import { useAuth } from "@/hooks/useAuth";
import { listIssues, advanceStatus, resolveIssue } from "@/services/issues";
import { cn, timeAgo } from "@/lib/utils";
import type { Issue } from "@/types";

type StatusFilter = "All" | "Assigned" | "In Progress" | "Resolved";

export default function OfficerPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    }>
      <OfficerPageInner />
    </Suspense>
  );
}

function OfficerPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const { user, loading: authLoading, isAuthed } = useAuth();

  // Handle URL query parameter tab checks
  useEffect(() => {
    if (tabParam === "assigned") {
      setFilter("Assigned");
    } else {
      setFilter("All");
    }
  }, [tabParam]);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [busyId, setBusyId] = useState<string | null>(null);

  // resolve dialog
  const [resolveFor, setResolveFor] = useState<Issue | null>(null);
  const [resolveNote, setResolveNote] = useState("");

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthed) {
        router.push("/");
      } else if (user?.role !== "officer" && user?.role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [authLoading, isAuthed, user, router]);

  async function load() {
    if (!user) return;
    try {
      const data = await listIssues(300);
      setIssues(data);
    } catch {
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthed && (user?.role === "officer" || user?.role === "admin")) {
      void load();
    }
  }, [isAuthed, user]);

  // Filter issues assigned to this officer
  const myAssignedIssues = useMemo(() => {
    if (!user) return [];
    return issues.filter((i) => i.assignedTo === user.id);
  }, [issues, user]);

  const metrics = useMemo(() => {
    const total = myAssignedIssues.length;
    const resolved = myAssignedIssues.filter((i) => i.status === "Resolved").length;
    const inProgress = myAssignedIssues.filter((i) => i.status === "In Progress").length;
    const pending = total - resolved;
    return { total, resolved, inProgress, pending };
  }, [myAssignedIssues]);

  const filtered = useMemo(() => {
    if (filter === "All") return myAssignedIssues;
    return myAssignedIssues.filter((i) => i.status === filter);
  }, [myAssignedIssues, filter]);

  async function handleStart(issue: Issue) {
    setBusyId(issue.id);
    try {
      await advanceStatus(issue, "In Progress", user?.name);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function confirmResolve() {
    if (!resolveFor) return;
    setBusyId(resolveFor.id);
    try {
      await resolveIssue(resolveFor, resolveNote.trim(), user?.name);
      setResolveFor(null);
      setResolveNote("");
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || (isAuthed && loading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isAuthed || (user?.role !== "officer" && user?.role !== "admin")) return null;

  const metricCards = [
    { label: "Assigned Issues", value: metrics.total, icon: LayoutList, tone: "text-primary bg-primary-50" },
    { label: "In Progress", value: metrics.inProgress, icon: Clock, tone: "text-warning bg-warning-50" },
    { label: "Resolved by Me", value: metrics.resolved, icon: CheckCircle2, tone: "text-secondary bg-secondary-50" },
    { label: "Pending", value: metrics.pending, icon: Shield, tone: "text-danger bg-danger-50" },
  ] as const;

  return (
    <div className="min-h-screen px-5 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        {/* header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl text-ink">Officer Dashboard</h1>
              <p className="text-sm text-ink-soft">
                Manage your assigned issues for department ·{" "}
                <span className="font-semibold text-primary">
                  {user?.department || "General Operations"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metricCards.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.label}>
                <CardContent className="py-4">
                  <div className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-xl", m.tone)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold text-ink">
                    {loading ? "—" : m.value}
                  </p>
                  <p className="text-xs font-medium text-ink-faint">{m.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* status filter */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-faint">
            <Filter className="h-3.5 w-3.5" /> Filter
          </span>
          {(["All", "Assigned", "In Progress", "Resolved"] as StatusFilter[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "primary" : "outline"}
              onClick={() => setFilter(f)}
              className="cursor-pointer"
            >
              {f}
            </Button>
          ))}
        </div>

        {/* issue list */}
        <div className="mt-5">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<LayoutList className="h-6 w-6" />}
              title="No issues found"
              description={
                filter === "All"
                  ? "You have no assigned issues."
                  : `No assigned issues with status "${filter}".`
              }
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((issue) => {
                const isResolved = issue.status === "Resolved";
                const busy = busyId === issue.id;
                return (
                  <Card key={issue.id}>
                    <CardContent className="py-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <SeverityBadge severity={issue.severity} />
                            <StatusBadge status={issue.status} />
                            <Badge tone="slate">
                              <Building2 size={11} /> {issue.department || "No Department"}
                            </Badge>
                          </div>
                          <h3 className="mt-2 text-base font-semibold text-ink break-words">
                            {issue.title}
                          </h3>
                          <p className="mt-1 text-sm text-ink-soft break-words">
                            {issue.description}
                          </p>
                          <p className="mt-2 text-xs text-ink-faint">
                            Category: {issue.category}
                            {issue.createdByName ? ` · Reported by ${issue.createdByName}` : ""} ·{" "}
                            {timeAgo(issue.createdAt)}
                          </p>
                          {issue.address && (
                            <p className="mt-1 text-xs text-ink-soft">
                              Location: {issue.address}
                            </p>
                          )}
                          {issue.imageUrl && (
                            <div className="mt-3 max-w-xs overflow-hidden rounded-xl border border-line">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={issue.imageUrl} alt={issue.title} className="h-40 w-full object-cover" />
                            </div>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            loading={busy}
                            disabled={busy || issue.status === "In Progress" || isResolved}
                            onClick={() => handleStart(issue)}
                            className="cursor-pointer"
                          >
                            Start Work
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={busy || isResolved}
                            onClick={() => {
                              setResolveFor(issue);
                              setResolveNote("");
                            }}
                            className="cursor-pointer"
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RESOLVE DIALOG */}
      <Dialog open={!!resolveFor} onClose={() => setResolveFor(null)} title="Resolve issue">
        {resolveFor && (
          <>
            <p className="text-sm text-ink-soft">{resolveFor.title}</p>
            <label className="mb-1.5 mt-4 block text-sm font-medium text-ink">
              How was it fixed?
            </label>
            <Textarea
              rows={3}
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              placeholder="e.g. Pothole filled and re-tarred by the road crew."
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResolveFor(null)} className="cursor-pointer">Cancel</Button>
              <Button loading={busyId === resolveFor.id} onClick={confirmResolve} className="cursor-pointer">
                Mark resolved
              </Button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}

function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-dark/40 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="display text-xl text-ink">{title}</h3>
              <button onClick={onClose} className="rounded-lg p-1.5 text-ink-faint hover:bg-primary-50 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="mt-3">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
