"use client";

import Link from "next/link";
import { MapPin, MessageSquare, CheckCircle2, Clock } from "lucide-react";
import { SeverityBadge, StatusBadge } from "@/components/ui/Badge";
import { timeAgo } from "@/lib/utils";
import type { Issue } from "@/types";

export default function IssueCard({ issue }: { issue: Issue }) {
  return (
    <Link
      href={`/issues/${issue.id}`}
      className="glass-card group block overflow-hidden rounded-2xl transition-transform hover:-translate-y-1"
    >
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        {issue.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={issue.imageUrl}
            alt={issue.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-faint">
            <MapPin />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StatusBadge status={issue.status} />
        </div>
        <div className="absolute right-3 top-3">
          <SeverityBadge severity={issue.severity} />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="rounded-md bg-primary-50 px-2 py-0.5">
            {issue.category}
          </span>
          <span className="flex items-center gap-1 text-ink-faint">
            <Clock size={12} /> {timeAgo(issue.createdAt)}
          </span>
        </div>
        <h3 className="mt-2 line-clamp-1 font-semibold text-ink">
          {issue.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink-soft">
          {issue.description}
        </p>
        {issue.address && (
          <p className="mt-2 flex items-center gap-1 truncate text-xs text-ink-faint">
            <MapPin size={12} /> {issue.address}
          </p>
        )}
        <div className="mt-3 flex items-center gap-4 border-t border-line pt-3 text-xs text-ink-soft">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={13} className="text-secondary" />
            {issue.confirmCount} confirmed
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare size={13} /> {issue.commentCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
