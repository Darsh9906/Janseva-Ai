import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit as fbLimit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Issue,
  IssueStatus,
  VerificationStatus,
  TimelineEntry,
} from "@/types";
import { distanceMeters } from "@/lib/utils";
import { awardPoints } from "./users";
import { POINTS } from "./gamification";

const ISSUES = "issues";

type NewIssueInput = Omit<
  Issue,
  | "id"
  | "status"
  | "verificationStatus"
  | "confirmCount"
  | "upvoteCount"
  | "commentCount"
  | "timeline"
  | "createdAt"
  | "updatedAt"
>;

export async function createIssue(input: NewIssueInput): Promise<string> {
  const now = Date.now();
  const timeline: TimelineEntry[] = [
    { status: "Reported", at: now, note: "Issue reported by citizen" },
  ];
  const docData = {
    ...input,
    status: "Reported" as IssueStatus,
    verificationStatus: "Needs Review" as VerificationStatus,
    confirmCount: 0,
    upvoteCount: 0,
    commentCount: 0,
    timeline,
    createdAt: now,
    updatedAt: now,
    createdServer: serverTimestamp(),
  };
  const refDoc = await addDoc(collection(db, ISSUES), docData);
  // reward the reporter
  await awardPoints(input.createdBy, POINTS.REPORT, { incrementReports: true });
  return refDoc.id;
}

export async function getIssue(id: string): Promise<Issue | null> {
  const snap = await getDoc(doc(db, ISSUES, id));
  return snap.exists()
    ? { id: snap.id, ...(snap.data() as Omit<Issue, "id">) }
    : null;
}

function mapDocs(
  snap: Awaited<ReturnType<typeof getDocs>>
): Issue[] {
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Issue, "id">) }));
}

export async function listIssues(max = 100): Promise<Issue[]> {
  const q = query(
    collection(db, ISSUES),
    orderBy("createdAt", "desc"),
    fbLimit(max)
  );
  return mapDocs(await getDocs(q));
}

export async function listIssuesByStatus(
  status: IssueStatus,
  max = 100
): Promise<Issue[]> {
  // single equality filter — sort/limit client-side to avoid a composite index
  const q = query(collection(db, ISSUES), where("status", "==", status));
  const all = mapDocs(await getDocs(q)).sort(
    (a, b) => b.createdAt - a.createdAt
  );
  return all.slice(0, max);
}

export async function listIssuesByUser(userId: string): Promise<Issue[]> {
  const q = query(collection(db, ISSUES), where("createdBy", "==", userId));
  return mapDocs(await getDocs(q)).sort((a, b) => b.createdAt - a.createdAt);
}

/** Duplicate-detection helper: issues within `radius` m of a point. */
export async function findNearbyIssues(
  lat: number,
  lng: number,
  radius = 120,
  category?: string
): Promise<Issue[]> {
  // Firestore can't do geo-radius natively without geohashing, so we pull
  // recent issues and filter by haversine distance client-side.
  const all = await listIssues(300);
  return all.filter((i) => {
    const within = distanceMeters({ lat, lng }, { lat: i.latitude, lng: i.longitude }) <= radius;
    return within && (!category || i.category === category);
  });
}

const verificationFor = (confirmCount: number): VerificationStatus => {
  if (confirmCount >= 5) return "Verified";
  if (confirmCount >= 2) return "Likely Verified";
  return "Needs Review";
};

/**
 * Recompute verification status from confirm count and, the first time an
 * issue becomes "Verified", advance its workflow status + reward the reporter.
 */
export async function syncVerification(issue: Issue, confirmCount: number) {
  const verificationStatus = verificationFor(confirmCount);
  const patch: Record<string, unknown> = {
    confirmCount,
    verificationStatus,
    updatedAt: Date.now(),
  };

  if (verificationStatus === "Verified" && issue.status === "Reported") {
    const entry: TimelineEntry = {
      status: "Verified",
      at: Date.now(),
      note: "Confirmed by the community",
    };
    patch.status = "Verified";
    patch.timeline = [...issue.timeline, entry];
    await awardPoints(issue.createdBy, POINTS.REPORT_VERIFIED);
  }

  await updateDoc(doc(db, ISSUES, issue.id), patch);
}

/** Assign an issue to a department (and optionally a specific officer). */
export async function assignIssue(
  issue: Issue,
  department: string,
  officer: { uid: string; name: string } | null,
  by?: string
) {
  const entry: TimelineEntry = {
    status: "Assigned",
    at: Date.now(),
    by,
    note: `Routed to ${department}${officer ? ` · ${officer.name}` : ""}`,
  };
  await updateDoc(doc(db, ISSUES, issue.id), {
    status: "Assigned",
    department,
    assignedTo: officer?.uid ?? null,
    assignedOfficerName: officer?.name ?? null,
    timeline: [...issue.timeline, entry],
    updatedAt: Date.now(),
  });
}

/** Resolve an issue with a note describing how it was fixed. */
export async function resolveIssue(
  issue: Issue,
  note: string,
  by?: string
) {
  const entry: TimelineEntry = {
    status: "Resolved",
    at: Date.now(),
    by,
    note: note ? `Resolved — ${note}` : "Issue resolved",
  };
  await updateDoc(doc(db, ISSUES, issue.id), {
    status: "Resolved",
    resolutionNote: note || null,
    resolvedBy: by ?? null,
    timeline: [...issue.timeline, entry],
    updatedAt: Date.now(),
  });
  await awardPoints(issue.createdBy, POINTS.RESOLVED, {
    incrementResolved: true,
  });
}

/** Officer/admin status transition with timeline + resolution rewards. */
export async function advanceStatus(
  issue: Issue,
  status: IssueStatus,
  by?: string,
  assignedTo?: string | null
) {
  const entry: TimelineEntry = {
    status,
    at: Date.now(),
    by,
    note:
      status === "Assigned"
        ? "Assigned to department"
        : status === "In Progress"
        ? "Work has begun"
        : status === "Resolved"
        ? "Issue resolved"
        : undefined,
  };
  const patch: Record<string, unknown> = {
    status,
    timeline: [...issue.timeline, entry],
    updatedAt: Date.now(),
  };
  if (assignedTo !== undefined) patch.assignedTo = assignedTo;

  await updateDoc(doc(db, ISSUES, issue.id), patch);

  if (status === "Resolved") {
    await awardPoints(issue.createdBy, POINTS.RESOLVED, {
      incrementResolved: true,
    });
  }
}
