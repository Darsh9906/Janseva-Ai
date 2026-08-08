import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AppUser, BadgeKey, Role } from "@/types";
import type { User as FirebaseUser } from "firebase/auth";

const USERS = "users";

/** Create the user profile on first sign-in, or return the existing one. */
export async function ensureUserProfile(fbUser: FirebaseUser): Promise<AppUser> {
  const ref = doc(db, USERS, fbUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return { id: snap.id, ...(snap.data() as Omit<AppUser, "id">) };
  }

  const profile: Omit<AppUser, "id"> = {
    name: fbUser.displayName ?? "Anonymous Hero",
    email: fbUser.email ?? "",
    avatar: fbUser.photoURL ?? null,
    heroPoints: 0,
    role: "citizen",
    reportsCount: 0,
    resolvedCount: 0,
    badges: [],
    createdAt: Date.now(),
  };
  await setDoc(ref, { ...profile, createdServer: serverTimestamp() });
  return { id: fbUser.uid, ...profile };
}

export async function getUser(id: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, USERS, id));
  return snap.exists()
    ? { id: snap.id, ...(snap.data() as Omit<AppUser, "id">) }
    : null;
}

export async function awardPoints(
  userId: string,
  points: number,
  opts: { incrementReports?: boolean; incrementResolved?: boolean } = {}
) {
  const patch: Record<string, unknown> = { heroPoints: increment(points) };
  if (opts.incrementReports) patch.reportsCount = increment(1);
  if (opts.incrementResolved) patch.resolvedCount = increment(1);
  await updateDoc(doc(db, USERS, userId), patch);
}

export async function grantBadge(userId: string, badge: BadgeKey) {
  await updateDoc(doc(db, USERS, userId), { badges: arrayUnion(badge) });
}

export async function setRole(userId: string, role: Role) {
  await updateDoc(doc(db, USERS, userId), { role });
}

/** Promote a user to an officer of a specific department. */
export async function setOfficer(userId: string, department: string) {
  await updateDoc(doc(db, USERS, userId), { role: "officer", department });
}

/** All officers/admins (for assignment pickers). Small scale → no index. */
export async function listOfficers(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db, USERS));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<AppUser, "id">) }))
    .filter((u) => u.role === "officer" || u.role === "admin");
}

export async function getLeaderboard(max = 25): Promise<AppUser[]> {
  const q = query(
    collection(db, USERS),
    orderBy("heroPoints", "desc"),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AppUser, "id">) }));
}
