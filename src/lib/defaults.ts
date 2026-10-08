import type { ChallengeSettings } from "./types";

/**
 * Default challenge settings used until the admin saves real values in Supabase.
 * Points values here are placeholders — the admin sets the real ones.
 * The check-in deadline is intentionally null: it must be configured by the admin.
 */
export const DEFAULT_SETTINGS: ChallengeSettings = {
  id: "demo",
  slug: "30-day-sports-challenge",
  name: "30 Day Sports Challenge",
  status: "registration_open",
  startDate: null,
  durationDays: 30,
  timezone: "Asia/Kolkata",
  registrationFee: 99,
  restoreFee: 50,
  dailyCheckinPoints: 10,
  referralPoints: 10,
  checkinDeadline: null,
  prizeHeadline: "A chance to win an iPhone",
  prizeText:
    "Complete the challenge. Stay consistent. Climb the leaderboard. You could get a chance to win an iPhone.",
  prizeTerms: null,
  rules: [
    "Entry fee: ₹99",
    "Challenge duration: 30 days",
    "One daily sports check-in required",
    "Participants must upload a daily snap",
    "Missing a day breaks the streak",
    "Each participant gets ONE Restore opportunity",
    "Restore costs ₹50",
    "Missing another day after using Restore means elimination",
    "Earn additional points through successful referrals",
    "The leaderboard is visible to all participants",
    "Choose a Public or Private profile",
    "Private profiles still appear on the leaderboard",
    "Private snaps are only visible to approved followers",
    "Uploaded content must follow community guidelines",
  ],
  communityGuidelines: null,
};

export const SPORTS = [
  "Badminton",
  "Swimming",
  "Running",
  "Football",
  "Basketball",
  "Tennis",
  "Cycling",
  "Skating",
  "Gym / Sports training",
  "Other",
] as const;
