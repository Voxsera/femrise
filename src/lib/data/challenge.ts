import "server-only";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { DEMO_COMMUNITY, DEMO_LEADERBOARD, DEMO_PARTICIPANT_COUNT } from "@/lib/demo-data";
import { env } from "@/lib/env";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import type { ChallengeSettings, CommunityCard, LandingData, LeaderboardRow } from "@/lib/types";

type ChallengeRow = {
  id: string;
  slug: string;
  name: string;
  status: ChallengeSettings["status"];
  start_date: string | null;
  duration_days: number;
  timezone: string;
  registration_fee: number; // rupees
  restore_fee: number; // rupees
  daily_checkin_points: number;
  referral_points: number;
  checkin_deadline: string | null;
  prize_headline: string;
  prize_text: string | null;
  prize_terms: string | null;
  rules: string[] | null;
  community_guidelines: string | null;
};

function mapChallenge(row: ChallengeRow): ChallengeSettings {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    startDate: row.start_date,
    durationDays: row.duration_days,
    timezone: row.timezone,
    registrationFee: row.registration_fee,
    restoreFee: row.restore_fee,
    dailyCheckinPoints: row.daily_checkin_points,
    referralPoints: row.referral_points,
    checkinDeadline: row.checkin_deadline ? row.checkin_deadline.slice(0, 5) : null,
    prizeHeadline: row.prize_headline,
    prizeText: row.prize_text ?? DEFAULT_SETTINGS.prizeText,
    prizeTerms: row.prize_terms,
    rules: row.rules && row.rules.length ? row.rules : DEFAULT_SETTINGS.rules,
    communityGuidelines: row.community_guidelines,
  };
}

function publicUrl(bucket: string, path: string | null) {
  if (!path) return null;
  return `${env.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/** Loads everything the landing page needs. Falls back to demo data when Supabase isn't connected. */
export async function getLandingData(): Promise<LandingData> {
  const supabase = createSupabasePublicClient();
  const demo: LandingData = {
    settings: DEFAULT_SETTINGS,
    leaderboard: DEMO_LEADERBOARD,
    community: DEMO_COMMUNITY,
    participantCount: DEMO_PARTICIPANT_COUNT,
    isDemo: true,
  };
  if (!supabase) return demo;

  const { data: challenge, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("slug", env.challengeSlug)
    .maybeSingle<ChallengeRow>();
  if (error || !challenge) {
    console.error("[landing] challenge not found, using demo data", error?.message);
    return demo;
  }

  const [board, community, count] = await Promise.all([
    supabase.rpc("get_leaderboard", { p_challenge: challenge.id, p_limit: 5 }),
    supabase.rpc("get_community_preview", { p_challenge: challenge.id, p_limit: 6 }),
    supabase.rpc("get_participant_count", { p_challenge: challenge.id }),
  ]);

  const leaderboard: LeaderboardRow[] = (board.data ?? []).map((r: Record<string, unknown>) => ({
    rank: Number(r.rank),
    username: String(r.username),
    fullName: String(r.full_name ?? ""),
    avatarUrl: publicUrl("avatars", r.avatar_path as string | null),
    sport: String(r.sport ?? ""),
    city: (r.city as string | null) ?? null,
    currentStreak: Number(r.current_streak),
    points: Number(r.points),
    referrals: Number(r.referrals),
    status: r.status as LeaderboardRow["status"],
    isPrivate: Boolean(r.is_private),
  }));

  // Snaps live in a private bucket; the landing page only shows public profiles' captions/streaks,
  // and fetches images via signed URLs inside the app (never exposes private snaps).
  const communityCards: CommunityCard[] = (community.data ?? []).map((r: Record<string, unknown>) => ({
    username: String(r.username),
    fullName: String(r.full_name ?? ""),
    avatarUrl: publicUrl("avatars", r.avatar_path as string | null),
    sport: String(r.sport ?? ""),
    currentStreak: Number(r.current_streak),
    points: Number(r.points),
    isPrivate: Boolean(r.is_private),
    latestSnapUrl: null,
    latestCaption: (r.latest_caption as string | null) ?? null,
    latestDay: (r.latest_day as number | null) ?? null,
  }));

  return {
    settings: mapChallenge(challenge),
    leaderboard,
    community: communityCards,
    participantCount: Number(count.data ?? 0),
    isDemo: false,
  };
}

/** Full leaderboard (public-safe columns only). */
export async function getFullLeaderboard(): Promise<{ rows: LeaderboardRow[]; isDemo: boolean; settings: ChallengeSettings }> {
  const supabase = createSupabasePublicClient();
  if (!supabase) return { rows: DEMO_LEADERBOARD, isDemo: true, settings: DEFAULT_SETTINGS };
  const { data: challenge } = await supabase.from("challenges").select("*").eq("slug", env.challengeSlug).maybeSingle<ChallengeRow>();
  if (!challenge) return { rows: DEMO_LEADERBOARD, isDemo: true, settings: DEFAULT_SETTINGS };
  const { data } = await supabase.rpc("get_leaderboard", { p_challenge: challenge.id, p_limit: 1000 });
  const rows: LeaderboardRow[] = (data ?? []).map((r: Record<string, unknown>) => ({
    rank: Number(r.rank),
    username: String(r.username),
    fullName: String(r.full_name ?? ""),
    avatarUrl: publicUrl("avatars", r.avatar_path as string | null),
    sport: String(r.sport ?? ""),
    city: (r.city as string | null) ?? null,
    currentStreak: Number(r.current_streak),
    points: Number(r.points),
    referrals: Number(r.referrals),
    status: r.status as LeaderboardRow["status"],
    isPrivate: Boolean(r.is_private),
  }));
  return { rows, isDemo: false, settings: mapChallenge(challenge) };
}

export async function getChallengeRow(): Promise<ChallengeRow | null> {
  const supabase = createSupabasePublicClient();
  if (!supabase) return null;
  const { data } = await supabase.from("challenges").select("*").eq("slug", env.challengeSlug).maybeSingle<ChallengeRow>();
  return data ?? null;
}
