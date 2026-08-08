import type { AppUser, BadgeKey } from "@/types";

/** Hero Point values for each civic action. */
export const POINTS = {
  REPORT: 10,
  REPORT_VERIFIED: 15,
  VERIFY: 5,
  COMMENT: 2,
  RESOLVED: 20,
} as const;

export interface BadgeDef {
  key: BadgeKey;
  description: string;
  qualifies: (u: AppUser) => boolean;
}

export const BADGES: BadgeDef[] = [
  {
    key: "Top Reporter",
    description: "Filed 10+ community reports",
    qualifies: (u) => (u.reportsCount ?? 0) >= 10,
  },
  {
    key: "Problem Solver",
    description: "5+ of your reports were resolved",
    qualifies: (u) => (u.resolvedCount ?? 0) >= 5,
  },
  {
    key: "Neighborhood Hero",
    description: "Earned 500+ Hero Points",
    qualifies: (u) => u.heroPoints >= 500,
  },
  {
    key: "Community Guardian",
    description: "Earned 1000+ Hero Points",
    qualifies: (u) => u.heroPoints >= 1000,
  },
];

/** Badges a user newly qualifies for, given their already-earned set. */
export function newlyEarnedBadges(user: AppUser): BadgeKey[] {
  const owned = new Set(user.badges ?? []);
  return BADGES.filter((b) => !owned.has(b.key) && b.qualifies(user)).map(
    (b) => b.key
  );
}

export function rankLabel(index: number): string {
  return `#${index + 1}`;
}

export function tierFromPoints(points: number): string {
  if (points >= 1000) return "Guardian";
  if (points >= 500) return "Hero";
  if (points >= 200) return "Champion";
  if (points >= 50) return "Contributor";
  return "Newcomer";
}
