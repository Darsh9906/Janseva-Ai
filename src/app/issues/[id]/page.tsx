"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  ThumbsUp,
  CheckCircle2,
  Flag,
  Send,
  Building2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { getIssue } from "@/services/issues";
import { castVote, getUserVote } from "@/services/verifications";
import { listComments, addComment } from "@/services/comments";
import type { Issue, Comment, VoteType } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import {
  SeverityBadge,
  StatusBadge,
  VerificationBadge,
  Badge,
} from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton, EmptyState, Spinner } from "@/components/ui/Feedback";
import Timeline from "@/components/issues/Timeline";
import { timeAgo } from "@/lib/utils";
import { firebaseEnabled } from "@/lib/firebase";

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthed, signIn, requireAuth } = useAuth();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [myVote, setMyVote] = useState<VoteType | null>(null);
  const [voting, setVoting] = useState(false);
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!firebaseEnabled || !id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [iss, cmts] = await Promise.all([getIssue(id), listComments(id)]);
        setIssue(iss);
        setComments(cmts);
        if (user) {
          const v = await getUserVote(id, user.id);
          setMyVote(v?.voteType ?? null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user]);

  const handleVote = (voteType: VoteType) =>
    requireAuth(async () => {
      if (!user || !issue || myVote) return;
      setVoting(true);
      try {
        const updated = await castVote(issue.id, user.id, user.name, voteType);
        if (updated) setIssue(updated);
        setMyVote(voteType);
      } catch (e) {
        console.error(e);
      } finally {
        setVoting(false);
      }
    });

  const handleComment = () =>
    requireAuth(async () => {
      if (!user || !issue || !message.trim()) return;
      setPosting(true);
      try {
        const c = await addComment(
          issue.id,
          user.id,
          user.name,
          message.trim(),
          user.avatar
        );
        setComments((prev) => [...prev, c]);
        setIssue((prev) =>
          prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev
        );
        setMessage("");
      } catch (e) {
        console.error(e);
      } finally {
        setPosting(false);
      }
    });

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <EmptyState
          icon={<AlertTriangle />}
          title="Issue not found"
          description="It may have been removed, or Firebase isn’t configured yet."
        />
      </div>
    );
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${issue.latitude},${issue.longitude}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* main column */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden">
              {issue.imageUrl && (
                <div className="relative h-72 w-full bg-slate-100 sm:h-96">
                  {issue.mediaType === "video" ? (
                    <video src={issue.imageUrl} controls className="h-full w-full object-contain" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={issue.imageUrl} alt={issue.title} className="h-full w-full object-cover" />
                  )}
                </div>
              )}
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={issue.status} />
                  <SeverityBadge severity={issue.severity} />
                  <VerificationBadge status={issue.verificationStatus} />
                  <Badge tone="blue">{issue.category}</Badge>
                </div>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">
                  {issue.title}
                </h1>
                <p className="mt-2 leading-relaxed text-ink-soft">
                  {issue.description}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
                  <span className="flex items-center gap-1.5">
                    <Avatar name={issue.createdByName} size={22} />
                    {issue.createdByName ?? "Anonymous"}
                  </span>
                  <span>· {timeAgo(issue.createdAt)}</span>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <MapPin size={14} /> View on map <ExternalLink size={12} />
                  </a>
                </div>
                {issue.address && (
                  <p className="mt-2 text-sm text-ink-faint">{issue.address}</p>
                )}

                {(issue.department || issue.estimatedCost || issue.estimatedFixTime) && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {issue.department && (
                      <Info icon={<Building2 size={14} />} label="Department" value={issue.department} />
                    )}
                    {issue.estimatedCost && (
                      <Info label="Est. cost" value={issue.estimatedCost} />
                    )}
                    {issue.estimatedFixTime && (
                      <Info label="Est. fix time" value={issue.estimatedFixTime} />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* assignment + resolution */}
          {(issue.status === "Assigned" ||
            issue.status === "In Progress" ||
            issue.status === "Resolved") && (
            <Card>
              <CardContent className="p-5 sm:p-6">
                <h2 className="font-semibold text-ink">Handling</h2>
                <div className="mt-3 space-y-2 text-sm">
                  {issue.department && (
                    <p className="flex items-center gap-2 text-ink-soft">
                      <Building2 size={15} className="text-primary" />
                      Routed to{" "}
                      <span className="font-medium text-ink">{issue.department}</span>
                    </p>
                  )}
                  {issue.assignedOfficerName && (
                    <p className="flex items-center gap-2 text-ink-soft">
                      <CheckCircle2 size={15} className="text-primary" />
                      Assigned to{" "}
                      <span className="font-medium text-ink">
                        {issue.assignedOfficerName}
                      </span>
                    </p>
                  )}
                </div>
                {issue.resolutionNote && (
                  <div className="mt-4 rounded-xl bg-secondary-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                      Resolved
                    </p>
                    <p className="mt-1 text-sm text-ink">{issue.resolutionNote}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* verification */}
          <Card>
            <CardContent className="p-5 sm:p-6">
              <h2 className="font-semibold text-ink">Community verification</h2>
              <p className="mt-1 text-sm text-ink-soft">
                {issue.confirmCount} confirmation
                {issue.confirmCount !== 1 ? "s" : ""} ·{" "}
                {issue.upvoteCount} upvote{issue.upvoteCount !== 1 ? "s" : ""}
              </p>
              {myVote ? (
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-secondary-50 px-4 py-3 text-sm font-medium text-secondary">
                  <CheckCircle2 size={16} /> You {myVote === "reject" ? "flagged" : myVote + "ed"} this report. Thanks!
                </p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="primary" loading={voting} onClick={() => handleVote("confirm")}>
                    <CheckCircle2 size={16} /> Confirm it exists
                  </Button>
                  <Button variant="outline" loading={voting} onClick={() => handleVote("upvote")}>
                    <ThumbsUp size={16} /> Upvote
                  </Button>
                  <Button variant="ghost" loading={voting} onClick={() => handleVote("reject")}>
                    <Flag size={16} /> Flag
                  </Button>
                </div>
              )}
              {!isAuthed && (
                <button onClick={signIn} className="mt-3 text-sm text-primary hover:underline">
                  Sign in to verify
                </button>
              )}
            </CardContent>
          </Card>

          {/* comments */}
          <Card>
            <CardContent className="p-5 sm:p-6">
              <h2 className="font-semibold text-ink">
                Discussion ({comments.length})
              </h2>

              <div className="mt-4 space-y-4">
                {comments.length === 0 && (
                  <p className="text-sm text-ink-faint">
                    No comments yet. Add supporting evidence or context.
                  </p>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <Avatar src={c.userAvatar} name={c.userName} size={34} />
                    <div className="flex-1 rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-ink">{c.userName}</p>
                        <span className="text-xs text-ink-faint">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm text-ink-soft">{c.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-end gap-2">
                <Textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isAuthed ? "Add a comment…" : "Sign in to comment"}
                  disabled={!isAuthed}
                />
                <Button
                  size="icon"
                  loading={posting}
                  disabled={!message.trim()}
                  onClick={handleComment}
                >
                  {!posting && <Send size={16} />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5 sm:p-6">
              <h2 className="font-semibold text-ink">Resolution timeline</h2>
              <div className="mt-5">
                <Timeline entries={issue.timeline} current={issue.status} />
              </div>
            </CardContent>
          </Card>

          {issue.confidence !== undefined && (
            <Card glass>
              <CardContent className="p-5 sm:p-6">
                <Badge tone="blue">AI assessment</Badge>
                <div className="mt-3 space-y-2 text-sm">
                  <Row label="Confidence" value={`${issue.confidence}%`} />
                  {issue.riskScore !== undefined && (
                    <Row label="Risk score" value={`${issue.riskScore}/10`} />
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {voting && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <span className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm">
            <Spinner className="h-4 w-4" /> Recording your vote…
          </span>
        </div>
      )}
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
        {icon} {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-soft">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
