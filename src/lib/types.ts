// Shared domain types. Mirrors supabase/schema.sql.

export type ChallengeStatus = "draft" | "registration_open" | "live" | "ended";

export type ParticipantStatus =
  | "pending_payment"
  | "active"
  | "restore_pending" // missed a day, Restore still available
  | "eliminated"
  | "completed"
  | "suspended";

export type CheckinStatus = "valid" | "invalid" | "removed";
export type DayState = "completed" | "current" | "missed" | "restored" | "future";

export interface ChallengeSettings {
  id: string;
  slug: string;
  name: string;
  status: ChallengeStatus;
  startDate: string | null; // ISO date (YYYY-MM-DD) in challenge timezone
  durationDays: number;
  timezone: string;
  registrationFee: number; // rupees
  restoreFee: number; // rupees
  dailyCheckinPoints: number;
  referralPoints: number;
  /** Daily check-in deadline as HH:MM in challenge timezone. null = not configured by admin yet. */
  checkinDeadline: string | null;
  prizeHeadline: string;
  prizeText: string;
  prizeTerms: string | null;
  rules: string[];
  communityGuidelines: string | null;
}

export interface LeaderboardRow {
  rank: number;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  sport: string;
  city: string | null;
  currentStreak: number;
  points: number;
  referrals: number;
  status: ParticipantStatus;
  isPrivate: boolean;
}

export interface CommunityCard {
  username: string;
  fullName: string;
  avatarUrl: string | null;
  sport: string;
  currentStreak: number;
  points: number;
  isPrivate: boolean;
  latestSnapUrl: string | null; // only ever set for public profiles
  latestCaption: string | null;
  latestDay: number | null;
}

export interface LandingData {
  settings: ChallengeSettings;
  leaderboard: LeaderboardRow[];
  community: CommunityCard[];
  participantCount: number;
  isDemo: boolean;
}
