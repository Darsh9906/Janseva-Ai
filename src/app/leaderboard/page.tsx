"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Medal, Trophy, Shield, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton, EmptyState } from "@/components/ui/Feedback";
import { getLeaderboard } from "@/services/users";
import { BADGES, tierFromPoints, rankLabel } from "@/services/gamification";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/types";

const PODIUM_META = [
  {
    icon: Crown,
    ring: "from-amber-300 to-amber-500",
    glow: "shadow-amber-300/40",
    label: "Champion",
    order: "sm:order-2",
    scale: "sm:-translate-y-4",
    size: 84,
  },
  {
    icon: Medal,
    ring: "from-slate-300 to-slate-400",
    glow: "shadow-slate-300/40",
    label: "Runner-up",
    order: "sm:order-1",
    scale: "",
    size: 72,
  },
  {
    icon: Medal,
    ring: "from-orange-300 to-orange-500",
    glow: "shadow-orange-300/40",
    label: "Third",
    order: "sm:order-3",
    scale: "",
    size: 72,
  },
] as const;

export default function LeaderboardPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getLeaderboard(25);
        if (active) setUsers(data);
      } catch {
        if (active) setUsers([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const podium = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <div className="min-h-screen px-5 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            <Trophy className="h-3.5 w-3.5" />
            Hero Rankings
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Community <span className="text-gradient">Leaderboard</span>
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft sm:text-base">
            Celebrating the citizens making their neighborhoods better, one
            report at a time.
          </p>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="mt-12 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && users.length === 0 && (
          <div className="mt-12">
            <EmptyState
              icon={<Trophy className="h-6 w-6" />}
              title="No heroes yet"
              description="Be the first to make an impact. Report a civic issue to earn Hero Points and claim the top spot."
              action={
                <a href="/report">
                  <Button variant="primary">Report an issue</Button>
                </a>
              }
            />
          </div>
        )}

        {!loading && users.length > 0 && (
          <>
            {/* Podium */}
            <div className="mt-12 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-end">
              {podium.map((u, i) => {
                const meta = PODIUM_META[i];
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className={cn("flex-1", meta.order, meta.scale)}
                  >
                    <Card
                      glass
                      className={cn(
                        "relative overflow-hidden text-center shadow-lg",
                        meta.glow
                      )}
                    >
                      <CardContent className="flex flex-col items-center pt-8">
                        <div
                          className={cn(
                            "mb-3 rounded-full bg-gradient-to-br p-[3px]",
                            meta.ring
                          )}
                        >
                          <Avatar
                            src={u.avatar}
                            name={u.name}
                            size={meta.size}
                          />
                        </div>
                        <div
                          className={cn(
                            "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-white shadow",
                            meta.ring
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="text-base font-semibold text-ink">
                          {u.name}
                        </p>
                        <Badge tone="blue" className="mt-1.5">
                          {tierFromPoints(u.heroPoints)}
                        </Badge>
                        <p className="mt-3 text-2xl font-bold text-primary">
                          {u.heroPoints.toLocaleString()}
                        </p>
                        <p className="text-xs font-medium text-ink-faint">
                          Hero Points · {rankLabel(i)}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Ranked list */}
            {rest.length > 0 && (
              <div className="mt-8 space-y-2.5">
                {rest.map((u, i) => {
                  const index = i + 3;
                  return (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                    >
                      <Card className="transition-shadow hover:shadow-md">
                        <CardContent className="flex items-center gap-3 py-3.5 sm:gap-4">
                          <span className="w-8 shrink-0 text-center text-sm font-bold text-ink-faint">
                            {rankLabel(index)}
                          </span>
                          <Avatar src={u.avatar} name={u.name} size={40} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink">
                              {u.name}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <Badge tone="slate" className="text-[10px]">
                                {tierFromPoints(u.heroPoints)}
                              </Badge>
                              {typeof u.reportsCount === "number" && (
                                <span className="text-xs text-ink-faint">
                                  {u.reportsCount} reports
                                </span>
                              )}
                              {(u.badges ?? []).slice(0, 2).map((b) => (
                                <Badge
                                  key={b}
                                  tone="green"
                                  className="hidden text-[10px] sm:inline-flex"
                                >
                                  {b}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-base font-bold text-primary">
                              {u.heroPoints.toLocaleString()}
                            </p>
                            <p className="text-[10px] font-medium text-ink-faint">
                              points
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Badges to earn */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-14"
        >
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              Badges to earn
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {BADGES.map((b) => (
              <Card key={b.key} glass>
                <CardContent className="flex items-start gap-3 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{b.key}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {b.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
