import type { CommunityCard, LeaderboardRow } from "./types";

// Sample data shown only while Supabase is not connected (demo mode).
// Clearly fictional usernames; replaced automatically by live data once connected.

const people: Array<[string, string, string, string, number, number, number, boolean]> = [
  // username, name, sport, city, streak, points, referrals, private
  ["smash.sana", "Sana R.", "Badminton", "Hyderabad", 30, 420, 12, false],
  ["laps.with.lara", "Lara M.", "Swimming", "Bengaluru", 29, 398, 10, true],
  ["kick.it.kavya", "Kavya P.", "Football", "Mumbai", 28, 381, 9, false],
  ["run.riya", "Riya S.", "Running", "Pune", 27, 352, 6, false],
  ["hoops.hiba", "Hiba K.", "Basketball", "Hyderabad", 27, 340, 5, true],
  ["ace.anaya", "Anaya D.", "Tennis", "Chennai", 26, 331, 6, false],
  ["pedal.priya", "Priya N.", "Cycling", "Delhi", 25, 312, 4, false],
  ["roll.with.rhea", "Rhea J.", "Skating", "Goa", 24, 296, 3, true],
];

export const DEMO_LEADERBOARD: LeaderboardRow[] = people.map(
  ([username, fullName, sport, city, currentStreak, points, referrals, isPrivate], i) => ({
    rank: i + 1,
    username,
    fullName,
    avatarUrl: null,
    sport,
    city,
    currentStreak,
    points,
    referrals,
    status: "active",
    isPrivate,
  }),
);

export const DEMO_COMMUNITY: CommunityCard[] = DEMO_LEADERBOARD.slice(0, 6).map((p, i) => ({
  username: p.username,
  fullName: p.fullName,
  avatarUrl: null,
  sport: p.sport,
  currentStreak: p.currentStreak,
  points: p.points,
  isPrivate: p.isPrivate,
  latestSnapUrl: null,
  latestCaption: p.isPrivate ? null : ["Day done!", "Early morning session", "New personal best", "Rain didn't stop me"][i % 4],
  latestDay: p.currentStreak,
}));

export const DEMO_PARTICIPANT_COUNT = 198;
