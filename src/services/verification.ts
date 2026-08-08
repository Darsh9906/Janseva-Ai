import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Issue, VoteType, Verification } from "@/types";
import { getIssue, syncVerification } from "./issues";
import { awardPoints } from "./users";
import { POINTS } from "./gamification";

const VERIFICATIONS = "verifications";

/** Has this user already voted on this issue? */
export async function getUserVote(
  issueId: string,
  userId: string
): Promise<Verification | null> {
  const q = query(
    collection(db, VERIFICATIONS),
    where("issueId", "==", issueId),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<Verification, "id">) };
}

export async function listVerifications(
  issueId: string
): Promise<Verification[]> {
  const q = query(
    collection(db, VERIFICATIONS),
    where("issueId", "==", issueId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Verification, "id">),
  }));
}

/**
 * Cast a community verification vote (one per user per issue). Recomputes the
 * issue's confirm count + verification status and rewards the verifier.
 * Returns the updated issue.
 */
export async function castVote(
  issueId: string,
  userId: string,
  userName: string,
  voteType: VoteType
): Promise<Issue | null> {
  const existing = await getUserVote(issueId, userId);
  if (existing) return getIssue(issueId);

  await addDoc(collection(db, VERIFICATIONS), {
    issueId,
    userId,
    userName,
    voteType,
    createdAt: Date.now(),
  });

  await awardPoints(userId, POINTS.VERIFY);

  const issue = await getIssue(issueId);
  if (!issue) return null;

  const votes = await listVerifications(issueId);
  const confirmCount = votes.filter(
    (v) => v.voteType === "confirm"
  ).length;

  await syncVerification(issue, confirmCount);
  return getIssue(issueId);
}
