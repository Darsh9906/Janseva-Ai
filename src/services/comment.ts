import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Comment } from "@/types";
import { awardPoints } from "./users";
import { POINTS } from "./gamification";

const COMMENTS = "comments";
const ISSUES = "issues";

export async function listComments(issueId: string): Promise<Comment[]> {
  // single equality filter (no composite index needed); sort client-side
  const q = query(collection(db, COMMENTS), where("issueId", "==", issueId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Comment, "id">) }))
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function addComment(
  issueId: string,
  userId: string,
  userName: string,
  message: string,
  userAvatar?: string | null
): Promise<Comment> {
  const data = {
    issueId,
    userId,
    userName,
    userAvatar: userAvatar ?? null,
    message,
    createdAt: Date.now(),
  };
  const refDoc = await addDoc(collection(db, COMMENTS), data);
  await updateDoc(doc(db, ISSUES, issueId), {
    commentCount: increment(1),
    updatedAt: Date.now(),
  });
  await awardPoints(userId, POINTS.COMMENT);
  return { id: refDoc.id, ...data };
}
