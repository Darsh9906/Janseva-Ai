import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
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
  return (
    <Badge tone={severityTone[severity]}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {severity}
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
  return <Badge tone={statusTone[status]}>{status}</Badge>;
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
  return <Badge tone={verifyTone[status]}>{status}</Badge>;
}
