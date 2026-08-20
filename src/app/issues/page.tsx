"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Inbox, Plus, Search } from "lucide-react";
import { listIssues } from "@/services/issues";
import type { Issue, IssueStatus } from "@/types";
import { ISSUE_STATUSES } from "@/types";
import IssueCard from "@/components/issues/issueCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton, EmptyState } from "@/components/ui/Feedback";
import { firebaseEnabled } from "@/lib/firebase";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

type Filter = "All" | IssueStatus;

export default function IssuesPage() {
  const { t } = useTranslation();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!firebaseEnabled) {
      setLoading(false);
      return;
    }
    listIssues(150)
      .then(setIssues)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return issues.filter((i) => {
      const matchStatus = filter === "All" || i.status === filter;
      const matchSearch =
        !search ||
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.category.toLowerCase().includes(search.toLowerCase()) ||
        (i.address ?? "").toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [issues, filter, search]);

  const getTranslatedStatus = (status: string) => {
    switch (status) {
      case "All": return t("common.all") === "common.all" ? "All" : t("common.all");
      case "Reported": return t("common.reported");
      case "Verified": return t("common.verified");
      case "Assigned": return t("common.assigned");
      case "In Progress": return t("common.inProgress");
      case "Working": return t("common.working");
      case "Resolved": return t("common.resolved");
      default: return status;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {t("issues.title")}
          </h1>
          <p className="mt-2 text-ink-soft">
            {t("issues.desc")}
          </p>
        </div>
        <Link href="/report">
          <Button>
            <Plus size={16} /> {t("nav.reportIssue")}
          </Button>
        </Link>
      </div>

      {/* controls */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("issues.searchPlaceholder")}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", ...ISSUE_STATUSES] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium transition",
                filter === f
                  ? "bg-primary text-white"
                  : "bg-white/70 text-ink-soft hover:bg-white"
              )}
            >
              {getTranslatedStatus(f)}
            </button>
          ))}
        </div>
      </div>

      {/* grid */}
      <div className="mt-8">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        ) : !firebaseEnabled ? (
          <EmptyState
            icon={<Inbox />}
            title="Firebase not configured"
            description="Add your NEXT_PUBLIC_FIREBASE_* keys to .env.local to load live issues."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Inbox />}
            title={issues.length === 0 ? t("issues.noIssues") : t("issues.noMatches")}
            description={
              issues.length === 0
                ? t("issues.firstHero")
                : t("issues.tryDifferent")
            }
            action={
              issues.length === 0 ? (
                <Link href="/report">
                  <Button>{t("issues.reportFirst")}</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
