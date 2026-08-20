"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  BarChart3,
  CheckCircle2,
  Clock,
  Filter,
  LayoutList,
  Lock,
  X,
  Building2,
  UserCheck,
  Users,
  ShieldAlert,
  Briefcase,
  UserPlus,
  UserMinus,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { SeverityBadge, StatusBadge, Badge } from "@/components/ui/Badge";
import { Spinner, EmptyState } from "@/components/ui/Feedback";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";

import {
  listIssues,
  advanceStatus,
  assignIssue,
  resolveIssue,
} from "@/services/issues";

import {
  setRole,
  setOfficer,
  listOfficers,
} from "@/services/users";

import { DEPARTMENTS, departmentForCategory } from "@/lib/department";
import { cn, timeAgo } from "@/lib/utils";
import { ISSUE_STATUSES } from "@/types";
import type { Issue, IssueStatus, AppUser } from "@/types";

import MediaUpload from "@/components/report/MediaUpload";
import { compressImageToDataUrl } from "@/lib/image";

const ADMIN_CODE = process.env.NEXT_PUBLIC_ADMIN_CODE || "janseva2026";
const OFFICER_CODE =
  process.env.NEXT_PUBLIC_OFFICER_CODE || "officer2026";

type Filter = "All" | IssueStatus;
type Tab = "triage" | "officers";

export default function AdminPage() {
  const { user, loading: authLoading, isAuthed, isOfficer, isAdmin, signIn } =
    useAuth();

  const { patchUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>("triage");

  const [issues, setIssues] = useState<Issue[]>([]);
  const [officers, setOfficers] = useState<AppUser[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);

  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("All");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Assign dialog
  const [assignFor, setAssignFor] = useState<Issue | null>(null);
  const [assignDept, setAssignDept] = useState<string>("");
  const [assignOfficer, setAssignOfficer] = useState<string>("");

  // Resolve dialog
  const [resolveFor, setResolveFor] = useState<Issue | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [resolveFile, setResolveFile] = useState<File | null>(null);

  // Admin "view as officer of department X"
  const [previewDept, setPreviewDept] = useState<string>("");

  // Unlock
  const [mode, setMode] = useState<"admin" | "officer">("admin");
  const [code, setCode] = useState("");
  const [unlockDept, setUnlockDept] = useState<string>(
    DEPARTMENTS[0]
  );
  const [codeErr, setCodeErr] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  // Promotion department selection
  const [promoDept, setPromoDept] = useState<Record<string, string>>({});

  async function load() {
    try {
      const [data, offs] = await Promise.all([
        listIssues(300),
        listOfficers(),
      ]);

      setIssues(data);
      setOfficers(offs);
      setAllUsers([]);
    } catch (error) {
      console.error(error);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isOfficer) return;
    void load();
  }, [isOfficer]);

  async function unlock() {
    if (!user) return;

    setCodeErr(null);

    if (mode === "admin") {
      if (code.trim() !== ADMIN_CODE) {
        return setCodeErr("Incorrect access code.");
      }

      setUnlocking(true);

      try {
        await setRole(user.id, "admin");
        patchUser({ role: "admin" });
      } catch {
        setCodeErr("Could not unlock. Try again.");
      } finally {
        setUnlocking(false);
      }
    } else {
      if (code.trim() !== OFFICER_CODE) {
        return setCodeErr("Incorrect access code.");
      }

      setUnlocking(true);

      try {
        await setOfficer(user.id, unlockDept);

        patchUser({
          role: "officer",
          department: unlockDept,
        });
      } catch {
        setCodeErr("Could not unlock. Try again.");
      } finally {
        setUnlocking(false);
      }
    }
  }

  /*
   * ADMIN:
   *   Shows all issues or filters by preview department.
   *
   * OFFICER:
   *   Shows issues belonging to the officer's department
   *   or directly assigned to that officer.
   */
  const scoped = useMemo(() => {
    if (isAdmin) {
      if (!previewDept) return issues;

      return issues.filter(
        (issue) =>
          departmentForCategory(issue.category) === previewDept
      );
    }

    return issues.filter(
      (issue) =>
        departmentForCategory(issue.category) === user?.department ||
        issue.assignedTo === user?.id
    );
  }, [issues, isAdmin, user, previewDept]);

  const metrics = useMemo(() => {
    const total = scoped.length;

    const resolved = scoped.filter(
      (issue) => issue.status === "Resolved"
    ).length;

    const inProgress = scoped.filter(
      (issue) => issue.status === "In Progress"
    ).length;

    const resolutionRate = total
      ? Math.round((resolved / total) * 100)
      : 0;

    return {
      total,
      resolved,
      inProgress,
      resolutionRate,
    };
  }, [scoped]);

  const filtered = useMemo(
    () =>
      filter === "All"
        ? scoped
        : scoped.filter((issue) => issue.status === filter),
    [scoped, filter]
  );

  /*
   * Calculate active workload for every officer.
   */
  const officerWorkloads = useMemo(() => {
    const workloadMap: Record<string, number> = {};

    issues.forEach((issue) => {
      if (
        issue.assignedTo &&
        (issue.status === "Assigned" ||
          issue.status === "In Progress")
      ) {
        workloadMap[issue.assignedTo] =
          (workloadMap[issue.assignedTo] ?? 0) + 1;
      }
    });

    return workloadMap;
  }, [issues]);

  async function handleStart(issue: Issue) {
    setBusyId(issue.id);

    try {
      await advanceStatus(
        issue,
        "In Progress",
        user?.name
      );

      await load();
    } finally {
      setBusyId(null);
    }
  }

  function openAssign(issue: Issue) {
    setAssignFor(issue);

    setAssignDept(
      issue.department ||
        departmentForCategory(issue.category)
    );

    setAssignOfficer(issue.assignedTo || "");
  }

  async function confirmAssign() {
    if (!assignFor) return;

    setBusyId(assignFor.id);

    try {
      const off = officers.find(
        (officer) => officer.id === assignOfficer
      );

      await assignIssue(
        assignFor,
        assignDept,
        off
          ? {
              uid: off.id,
              name: off.name,
            }
          : null,
        user?.name
      );

      setAssignFor(null);

      await load();
    } finally {
      setBusyId(null);
    }
  }

  /*
   * IMPORTANT:
   *
   * This is the new project's resolution-image feature.
   * We keep it from the NEW project.
   */
  async function confirmResolve() {
    if (!resolveFor) return;

    setBusyId(resolveFor.id);

    try {
      let resolutionImage: string | null = null;

      if (resolveFile) {
        resolutionImage =
          await compressImageToDataUrl(resolveFile);
      }

      await resolveIssue(
        resolveFor,
        resolveNote.trim(),
        user?.name,
        resolutionImage
      );

      setResolveFor(null);
      setResolveNote("");
      setResolveFile(null);

      await load();
    } finally {
      setBusyId(null);
    }
  }

  /*
   * Promote citizen -> officer
   */
  async function handlePromoteOfficer(userId: string) {
    const dept =
      promoDept[userId] || DEPARTMENTS[0];

    setLoading(true);

    try {
      await setOfficer(userId, dept);
      await load();
    } catch (error) {
      console.error(error);
      alert("Failed to promote user to officer.");
    } finally {
      setLoading(false);
    }
  }

  /*
   * Promote citizen -> admin
   */
  async function handlePromoteAdmin(userId: string) {
    setLoading(true);

    try {
      await setRole(userId, "admin");
      await load();
    } catch (error) {
      console.error(error);
      alert("Failed to promote user to admin.");
    } finally {
      setLoading(false);
    }
  }

  /*
   * Demote staff -> citizen
   */
  async function handleDemote(userId: string) {
    if (userId === user?.id) {
      alert("You cannot demote yourself.");
      return;
    }

    setLoading(true);

    try {
      await setRole(userId, "citizen");
      await load();
    } catch (error) {
      console.error(error);
      alert("Failed to demote user.");
    } finally {
      setLoading(false);
    }
  }

  /*
   * Access control / unlock screen.
   *
   * Kept from NEW project because it supports both
   * Admin and Officer access.
   */
  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isOfficer) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-5 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary">
                <Lock className="h-6 w-6" />
              </div>

              <h2 className="display text-2xl text-ink">
                Staff access
              </h2>

              {!isAuthed ? (
                <>
                  <p className="mt-1.5 text-sm text-ink-soft">
                    Sign in first, then enter your access code.
                  </p>

                  <Button
                    className="mt-5"
                    onClick={() => signIn()}
                  >
                    Sign in
                  </Button>
                </>
              ) : (
                <div className="mt-5 w-full text-left">
                  <div className="mb-4 flex rounded-lg border border-line p-1">
                    {(["admin", "officer"] as const).map(
                      (m) => (
                        <button
                          key={m}
                          onClick={() => {
                            setMode(m);
                            setCodeErr(null);
                          }}
                          className={cn(
                            "flex-1 rounded-md py-1.5 text-sm font-medium capitalize transition",
                            mode === m
                              ? "bg-primary text-white"
                              : "text-ink-soft hover:text-ink"
                          )}
                        >
                          {m}
                        </button>
                      )
                    )}
                  </div>

                  {mode === "officer" && (
                    <div className="mb-3">
                      <label className="mb-1.5 block text-sm font-medium text-ink">
                        Your department
                      </label>

                      <select
                        value={unlockDept}
                        onChange={(e) =>
                          setUnlockDept(e.target.value)
                        }
                        className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {DEPARTMENTS.map((department) => (
                          <option
                            key={department}
                            value={department}
                          >
                            {department}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <Input
                    type="password"
                    placeholder={`${
                      mode === "admin"
                        ? "Admin"
                        : "Officer"
                    } access code`}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setCodeErr(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        void unlock();
                      }
                    }}
                  />

                  {codeErr && (
                    <p className="mt-2 text-sm text-danger">
                      {codeErr}
                    </p>
                  )}

                  <Button
                    className="mt-3 w-full"
                    loading={unlocking}
                    onClick={() => void unlock()}
                  >
                    Unlock{" "}
                    {mode === "admin"
                      ? "admin"
                      : "officer"}{" "}
                    panel
                  </Button>

                  <div className="mt-4 rounded-lg border border-dashed border-line bg-primary-50/50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                      Demo access codes (for judges)
                    </p>

                    <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
                      <span>
                        Admin:{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setMode("admin");
                            setCode(ADMIN_CODE);
                            setCodeErr(null);
                          }}
                          className="font-mono font-semibold text-primary hover:underline"
                        >
                          {ADMIN_CODE}
                        </button>
                      </span>

                      <span>
                        Officer:{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setMode("officer");
                            setCode(OFFICER_CODE);
                            setCodeErr(null);
                          }}
                          className="font-mono font-semibold text-primary hover:underline"
                        >
                          {OFFICER_CODE}
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metricCards = [
    {
      label: "Issues",
      value: metrics.total,
      icon: LayoutList,
      tone: "text-primary bg-primary-50",
    },
    {
      label: "Resolved",
      value: metrics.resolved,
      icon: CheckCircle2,
      tone: "text-secondary bg-secondary-50",
    },
    {
      label: "In progress",
      value: metrics.inProgress,
      icon: Clock,
      tone: "text-warning bg-warning-50",
    },
    {
      label: "Resolution rate",
      value: `${metrics.resolutionRate}%`,
      icon: BarChart3,
      tone: "text-primary bg-primary-50",
    },
  ] as const;

  return (
    <div className="min-h-screen px-5 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-6 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">
              <Shield className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-3xl text-ink">
                Operations Dashboard
              </h1>

              <p className="text-sm text-ink-soft">
                {isAdmin
                  ? "Admin — manage community triage, assignments, and staff roles."
                  : (
                    <>
                      Officer ·{" "}
                      <span className="font-medium text-primary">
                        {user?.department}
                      </span>
                    </>
                  )}
              </p>
            </div>
          </div>

          {/* STAFF TABS */}
          {isAdmin && (
            <div className="flex max-w-xs rounded-lg border border-line bg-white p-1">
              <button
                onClick={() => setActiveTab("triage")}
                className={cn(
                  "flex-1 rounded-md px-4 py-1.5 text-xs font-semibold transition",
                  activeTab === "triage"
                    ? "bg-primary text-white"
                    : "text-ink-soft hover:text-ink"
                )}
              >
                Issues Triage
              </button>

              <button
                onClick={() => setActiveTab("officers")}
                className={cn(
                  "flex-1 rounded-md px-4 py-1.5 text-xs font-semibold transition",
                  activeTab === "officers"
                    ? "bg-primary text-white"
                    : "text-ink-soft hover:text-ink"
                )}
              >
                Staff & Roles
              </button>
            </div>
          )}
        </div>

        {/* =========================
            TRIAGE TAB
           ========================= */}
        {activeTab === "triage" ? (
          <>
            {/* Department preview */}
            {isAdmin && (
              <div className="mb-6 flex items-center justify-end gap-2">
                <span className="text-xs font-semibold text-ink-faint">
                  View as Department
                </span>

                <select
                  value={previewDept}
                  onChange={(e) =>
                    setPreviewDept(e.target.value)
                  }
                  className="h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">
                    All departments
                  </option>

                  {DEPARTMENTS.map((department) => (
                    <option
                      key={department}
                      value={department}
                    >
                      Officer · {department}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* METRICS */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {metricCards.map((metric) => {
                const Icon = metric.icon;

                return (
                  <Card key={metric.label}>
                    <CardContent className="py-4">
                      <div
                        className={cn(
                          "mb-2 flex h-9 w-9 items-center justify-center rounded-xl",
                          metric.tone
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <p className="text-2xl font-bold text-ink">
                        {loading ? "—" : metric.value}
                      </p>

                      <p className="text-xs font-medium text-ink-faint">
                        {metric.label}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* STATUS FILTER */}
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-faint">
                <Filter className="h-3.5 w-3.5" />
                Filter Status
              </span>

              {(["All", ...ISSUE_STATUSES] as Filter[]).map(
                (statusFilter) => (
                  <Button
                    key={statusFilter}
                    size="sm"
                    variant={
                      filter === statusFilter
                        ? "primary"
                        : "outline"
                    }
                    onClick={() =>
                      setFilter(statusFilter)
                    }
                  >
                    {statusFilter}
                  </Button>
                )
              )}
            </div>

            {/* ISSUE LIST */}
            <div className="mt-5">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Spinner className="h-7 w-7" />
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={
                    <LayoutList className="h-6 w-6" />
                  }
                  title="No issues here"
                  description={
                    filter === "All"
                      ? "No issues for your scope yet."
                      : `No issues with status "${filter}".`
                  }
                />
              ) : (
                <div className="space-y-3">
                  {filtered.map((issue) => {
                    const isResolved =
                      issue.status === "Resolved";

                    const busy =
                      busyId === issue.id;

                    const owningDept =
                      issue.department ||
                      departmentForCategory(
                        issue.category
                      );

                    return (
                      <Card key={issue.id}>
                        <CardContent className="py-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <SeverityBadge
                                  severity={issue.severity}
                                />

                                <StatusBadge
                                  status={issue.status}
                                />

                                <Badge tone="slate">
                                  <Building2 size={11} />{" "}
                                  {owningDept}
                                </Badge>
                              </div>

                              <h3 className="mt-2 break-words text-base font-semibold text-ink">
                                {issue.title}
                              </h3>

                              <p className="mt-1 break-words text-sm text-ink-soft">
                                {issue.description}
                              </p>

                              <p className="mt-2 text-xs text-ink-faint">
                                {issue.category}
                                {issue.createdByName
                                  ? ` · Reported by ${issue.createdByName}`
                                  : ""}{" "}
                                · {timeAgo(issue.createdAt)}
                              </p>

                              {issue.assignedOfficerName && (
                                <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-primary">
                                  <UserCheck size={12} />
                                  Assigned Officer:{" "}
                                  {issue.assignedOfficerName}
                                </p>
                              )}
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={
                                  busy || isResolved
                                }
                                onClick={() =>
                                  openAssign(issue)
                                }
                              >
                                {issue.status ===
                                  "Reported" ||
                                issue.status ===
                                  "Verified"
                                  ? "Assign"
                                  : "Reassign"}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                loading={busy}
                                disabled={
                                  busy ||
                                  issue.status ===
                                    "In Progress" ||
                                  isResolved
                                }
                                onClick={() =>
                                  void handleStart(
                                    issue
                                  )
                                }
                              >
                                Start
                              </Button>

                              <Button
                                size="sm"
                                variant="primary"
                                disabled={
                                  busy || isResolved
                                }
                                onClick={() => {
                                  setResolveFor(issue);
                                  setResolveNote("");
                                  setResolveFile(null);
                                }}
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
          </>
        ) : (
          /* =========================
             STAFF & ROLES TAB
             ========================= */
          <div className="space-y-8">
            {/* ACTIVE OFFICERS */}
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2 border-b border-line pb-4">
                  <Briefcase className="h-5 w-5 text-primary" />

                  <h2 className="text-xl font-bold text-ink">
                    Active Officers & Workload
                  </h2>
                </div>

                <div className="space-y-4">
                  {officers.length === 0 ? (
                    <p className="text-sm text-ink-faint">
                      No staff accounts provisioned yet.
                    </p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {officers.map((officer) => {
                        const loadCount =
                          officerWorkloads[
                            officer.id
                          ] ?? 0;

                        return (
                          <div
                            key={officer.id}
                            className="flex items-start justify-between rounded-xl border border-line bg-bg/50 p-4"
                          >
                            <div>
                              <p className="break-words font-semibold text-ink">
                                {officer.name}
                              </p>

                              <p className="break-all text-xs text-ink-soft">
                                {officer.email}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-primary">
                                {officer.role === "admin"
                                  ? "Admin"
                                  : `Officer · ${officer.department}`}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-2 text-right">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                  loadCount > 3
                                    ? "bg-danger-50 text-danger"
                                    : loadCount > 0
                                    ? "bg-warning-50 text-warning"
                                    : "bg-primary-50 text-primary"
                                )}
                              >
                                {loadCount} active tasks
                              </span>

                              {officer.id !==
                                user?.id && (
                                <button
                                  onClick={() =>
                                    void handleDemote(
                                      officer.id
                                    )
                                  }
                                  className="flex items-center gap-1 text-[11px] font-semibold text-danger hover:underline"
                                >
                                  <UserMinus size={11} />
                                  Demote
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* PROMOTE CITIZENS */}
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2 border-b border-line pb-4">
                  <Users className="h-5 w-5 text-primary" />

                  <h2 className="text-xl font-bold text-ink">
                    Promote Citizens to Staff
                  </h2>
                </div>

                <div className="space-y-3">
                  {allUsers.filter(
                    (u) =>
                      u.role !== "officer" &&
                      u.role !== "admin"
                  ).length === 0 ? (
                    <p className="text-sm text-ink-faint">
                      No other citizens found in the
                      system.
                    </p>
                  ) : (
                    <div className="divide-y divide-line">
                      {allUsers
                        .filter(
                          (u) =>
                            u.role !== "officer" &&
                            u.role !== "admin"
                        )
                        .map((citizen) => (
                          <div
                            key={citizen.id}
                            className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="break-words font-semibold text-ink">
                                {citizen.name}
                              </p>

                              <p className="break-all text-xs text-ink-soft">
                                {citizen.email}
                              </p>

                              <p className="mt-0.5 text-xs text-ink-faint">
                                Joined{" "}
                                {new Date(
                                  citizen.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-2 rounded-lg border border-line bg-white p-1">
                                <select
                                  value={
                                    promoDept[
                                      citizen.id
                                    ] ||
                                    DEPARTMENTS[0]
                                  }
                                  onChange={(e) =>
                                    setPromoDept({
                                      ...promoDept,
                                      [citizen.id]:
                                        e.target.value,
                                    })
                                  }
                                  className="h-8 rounded px-2 text-xs text-ink focus:outline-none"
                                >
                                  {DEPARTMENTS.map(
                                    (department) => (
                                      <option
                                        key={
                                          department
                                        }
                                        value={
                                          department
                                        }
                                      >
                                        {department}
                                      </option>
                                    )
                                  )}
                                </select>

                                <Button
                                  size="sm"
                                  onClick={() =>
                                    void handlePromoteOfficer(
                                      citizen.id
                                    )
                                  }
                                  className="h-8 text-xs"
                                >
                                  <UserPlus size={12} />
                                  Officer
                                </Button>
                              </div>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void handlePromoteAdmin(
                                    citizen.id
                                  )
                                }
                                className="h-9 border-primary/50 text-xs text-primary hover:bg-primary-50"
                              >
                                <ShieldAlert size={12} />
                                Admin
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* =========================
          ASSIGN DIALOG
         ========================= */}
      <Dialog
        open={!!assignFor}
        onClose={() => setAssignFor(null)}
        title="Assign issue"
      >
        {assignFor && (
          <>
            <p className="text-sm text-ink-soft">
              {assignFor.title}
            </p>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Department
              </label>

              <select
                value={assignDept}
                onChange={(e) => {
                  setAssignDept(e.target.value);
                  setAssignOfficer("");
                }}
                className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {DEPARTMENTS.map((department) => (
                  <option
                    key={department}
                    value={department}
                  >
                    {department}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Officer{" "}
                <span className="text-ink-faint">
                  (optional)
                </span>
              </label>

              <select
                value={assignOfficer}
                onChange={(e) =>
                  setAssignOfficer(e.target.value)
                }
                className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">
                  Route to department only
                </option>

                {officers
                  .filter(
                    (officer) =>
                      officer.department ===
                        assignDept ||
                      officer.role === "admin"
                  )
                  .map((officer) => (
                    <option
                      key={officer.id}
                      value={officer.id}
                    >
                      {officer.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setAssignFor(null)
                }
              >
                Cancel
              </Button>

              <Button
                loading={
                  busyId === assignFor.id
                }
                onClick={() =>
                  void confirmAssign()
                }
              >
                Assign
              </Button>
            </div>
          </>
        )}
      </Dialog>

      {/* =========================
          RESOLVE DIALOG
         ========================= */}
      <Dialog
        open={!!resolveFor}
        onClose={() => {
          setResolveFor(null);
          setResolveNote("");
          setResolveFile(null);
        }}
        title="Resolve issue"
      >
        {resolveFor && (
          <>
            <p className="text-sm text-ink-soft">
              {resolveFor.title}
            </p>

            {/* RESOLUTION PHOTO FEATURE */}
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Upload Resolution Proof
              </label>

              <MediaUpload
                onSelect={(file) =>
                  setResolveFile(file)
                }
              />

              {resolveFile && (
                <p className="mt-2 text-xs text-secondary">
                  Selected: {resolveFile.name}
                </p>
              )}
            </div>

            <label className="mb-1.5 mt-4 block text-sm font-medium text-ink">
              How was it fixed?
            </label>

            <Textarea
              rows={3}
              value={resolveNote}
              onChange={(e) =>
                setResolveNote(e.target.value)
              }
              placeholder="e.g. Pothole filled and re-tarred by the road crew."
            />

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setResolveFor(null);
                  setResolveNote("");
                  setResolveFile(null);
                }}
              >
                Cancel
              </Button>

              <Button
                loading={
                  busyId === resolveFor.id
                }
                onClick={() =>
                  void confirmResolve()
                }
              >
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
            initial={{
              opacity: 0,
              scale: 0.96,
              y: 12,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: 12,
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
            className="relative w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="display text-xl text-ink">
                {title}
              </h3>

              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-ink-faint hover:bg-primary-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-3">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}