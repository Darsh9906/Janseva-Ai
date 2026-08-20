"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { Severity, IssueStatus, VerificationStatus } from "@/types";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
  {
    variants: {
      tone: {
        blue: "bg-primary-50 text-primary-700",
        green: "bg-secondary-50 text-secondary",
        amber: "bg-warning-50 text-warning",
        red: "bg-danger-50 text-danger",
        slate: "bg-slate-100 text-slate-600",
      },
    },
    defaultVariants: { tone: "slate" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

const severityTone: Record<Severity, BadgeProps["tone"]> = {
  Low: "green",
  Medium: "amber",
  High: "red",
  Critical: "red",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { t } = useTranslation();

  const getTranslatedSeverity = (sev: Severity) => {
    switch (sev) {
      case "Low": return t("common.low");
      case "Medium": return t("common.medium");
      case "High": return t("common.high");
      case "Critical": return t("common.critical");
      default: return sev;
    }
  };

  return (
    <Badge tone={severityTone[severity]}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {getTranslatedSeverity(severity)}
    </Badge>
  );
}

const statusTone: Record<IssueStatus, BadgeProps["tone"]> = {
  Reported: "slate",
  Verified: "blue",
  Assigned: "amber",
  "In Progress": "amber",
  Resolved: "green",
};

export function StatusBadge({ status }: { status: IssueStatus }) {
  const { t } = useTranslation();

  const getTranslatedStatus = (st: IssueStatus) => {
    switch (st) {
      case "Reported": return t("common.reported");
      case "Verified": return t("common.verified");
      case "Assigned": return t("common.assigned");
      case "In Progress": return t("common.inProgress");
      case "Resolved": return t("common.resolved");
      default: return st;
    }
  };

  return <Badge tone={statusTone[status]}>{getTranslatedStatus(status)}</Badge>;
}

const verifyTone: Record<VerificationStatus, BadgeProps["tone"]> = {
  Verified: "green",
  "Likely Verified": "blue",
  "Needs Review": "amber",
};

export function VerificationBadge({
  status,
}: {
  status: VerificationStatus;
}) {
  const { t } = useTranslation();

  const getTranslatedVerification = (v: VerificationStatus) => {
    switch (v) {
      case "Verified": return t("common.verified");
      case "Likely Verified": return t("common.likelyVerified") === "common.likelyVerified" ? "Likely Verified" : t("common.likelyVerified");
      case "Needs Review": return t("common.needsReview") === "common.needsReview" ? "Needs Review" : t("common.needsReview");
      default: return v;
    }
  };

  return <Badge tone={verifyTone[status]}>{getTranslatedVerification(status)}</Badge>;
}
