import type { Issue, IssueStatus } from "@/types";

export interface DashboardStats {
  total: number;
  resolved: number;
  inProgress: number;
  verified: number;
  resolutionRate: number;
  byCategory: { name: string; count: number }[];
  byStatus: { name: IssueStatus; count: number }[];
  hotspots: { area: string; count: number }[];
}

const areaOf = (issue: Issue): string => {
  if (issue.address) {
    const parts = issue.address.split(",").map((p) => p.trim());
    return parts.slice(0, 2).join(", ") || "Unknown";
  }

  return `${issue.latitude.toFixed(2)}, ${issue.longitude.toFixed(2)}`;
};

export function computeStats(issues: Issue[]): DashboardStats {
  const total = issues.length;
  const resolved = issues.filter((i) => i.status === "Resolved").length;
  const inProgress = issues.filter((i) => i.status === "In Progress").length;
  const verified = issues.filter(
    (i) => i.verificationStatus === "Verified"
  ).length;

  const catMap = new Map<string, number>();
  const areaMap = new Map<string, number>();

  const statuses: IssueStatus[] = [
    "Reported",
    "Verified",
    "Assigned",
    "In Progress",
    "Resolved",
  ];

  const statusMap = new Map<IssueStatus, number>(
    statuses.map((s) => [s, 0])
  );

  for (const i of issues) {
    catMap.set(i.category, (catMap.get(i.category) ?? 0) + 1);
    areaMap.set(areaOf(i), (areaMap.get(areaOf(i)) ?? 0) + 1);
    statusMap.set(i.status, (statusMap.get(i.status) ?? 0) + 1);
  }

  return {
    total,
    resolved,
    inProgress,
    verified,
    resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
    byCategory: [...catMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    byStatus: statuses.map((name) => ({
      name,
      count: statusMap.get(name) ?? 0,
    })),
    hotspots: [...areaMap.entries()]
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };
}