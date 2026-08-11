export type Role = "citizen" | "officer" | "admin";

export type IssueCategory =
  | "Pothole"
  | "Water Leakage"
  | "Streetlight"
  | "Waste Management"
  | "Road Damage"
  | "Drainage"
  | "Public Safety"
  | "Other";

export type Severity = "Low" | "Medium" | "High" | "Critical";

export type IssueStatus =
  | "Reported"
  | "Verified"
  | "Assigned"
  | "In Progress"
  | "Resolved";

export const ISSUE_STATUSES: IssueStatus[] = [
  "Reported",
  "Verified",
  "Assigned",
  "In Progress",
  "Resolved",
];

export type VerificationStatus = "Verified" | "Likely Verified" | "Needs Review";

export type VoteType = "confirm" | "upvote" | "reject";

export type BadgeKey =
  | "Neighborhood Hero"
  | "Top Reporter"
  | "Problem Solver"
  | "Community Guardian";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  heroPoints: number;
  role: Role;
  department?: string; 
  reportsCount?: number;
  resolvedCount?: number;
  badges?: BadgeKey[];
  createdAt: number;
}

export interface TimelineEntry {
  status: IssueStatus;
  at: number;
  note?: string;
  by?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: Severity;
  status: IssueStatus;
  department?: string;
  confidence?: number; 
  riskScore?: number; 
  estimatedCost?: string;
  estimatedFixTime?: string;
  latitude: number;
  longitude: number;
  address?: string;
  imageUrl?: string;
  mediaType?: "image" | "video";
  verificationStatus: VerificationStatus;
  confirmCount: number;
  upvoteCount: number;
  commentCount: number;
  createdBy: string; 
  createdByName?: string;
  assignedTo?: string | null; 
  assignedOfficerName?: string | null;
  resolutionNote?: string | null; 
  resolvedBy?: string | null; 
  timeline: TimelineEntry[];
  createdAt: number;
  updatedAt: number;
}

export interface Verification {
  id: string;
  issueId: string;
  userId: string;
  userName?: string;
  voteType: VoteType;
  createdAt: number;
}

export interface Comment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  message: string;
  createdAt: number;
}

export interface Reward {
  id: string;
  userId: string;
  badge: BadgeKey;
  points: number;
  reason?: string;
  createdAt: number;
}

export interface VisionAnalysis {
  category: IssueCategory;
  severity: Severity;
  department: string;
  confidence: number;
  title: string;
  description: string;
  risk_score: number;
  estimated_cost: string;
  estimated_fix_time: string;
}
