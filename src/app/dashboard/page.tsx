import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { StreakCalendar } from "@/components/ui/StreakCalendar";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DayState } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Participant dashboard — phase 1 (live streak, calendar and stats from the database).
 * Phase 2 adds the daily snap upload, My Snaps, community feed and bottom navigation.
 */
export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/join");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const [{ data: profile }, { data: challenge }] = await Promise.all([
    supabase.from("profiles").select("username, full_name").eq("id", user.id).single(),
    supabase.from("challenges").select("id, duration_days, start_date, timezone").eq("slug", env.challengeSlug).single(),
  ]);
  if (!challenge) redirect("/");

  const { data: p } = await supabase
    .from("challenge_participants")
    .select("*")
    .eq("challenge_id", challenge.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!p || p.status === "pending_payment") redirect("/join");

  const [{ data: checkins }, { data: results }, { data: dayNow }] = await Promise.all([
    supabase.from("daily_checkins").select("challenge_day, status").eq("participant_id", p.id),
    supabase.from("day_results").select("challenge_day, result").eq("participant_id", p.id),
    supabase.rpc("challenge_day_at", { p_challenge: challenge.id }),
  ]);

  const today: number | null = typeof dayNow === "number" ? dayNow : null;
  const done = new Set((checkins ?? []).filter((c) => c.status === "valid").map((c) => c.challenge_day as number));
  const res = new Map((results ?? []).map((r) => [r.challenge_day as number, r.result as string]));
  const days: DayState[] = Array.from({ length: challenge.duration_days }, (_, i) => {
    const d = i + 1;
    if (done.has(d)) return "completed";
    if (res.get(d) === "restored") return "restored";
    if (res.get(d) === "missed") return "missed";
    if (today === d) return "current";
    return "future";
  });

  const stats: Array<[string, string | number]> = [
    ["Current streak", `${p.current_streak} days`],
    ["Longest streak", `${p.longest_streak} days`],
    ["Points", p.total_points],
    ["Check-ins", p.checkin_count],
    ["Restore", p.restore_used ? "Used" : "Available"],
    ["Status", String(p.status).replace("_", " ")],
  ];

  const dayLabel =
    today && today >= 1
      ? `Day ${String(Math.min(today, challenge.duration_days)).padStart(2, "0")} / ${challenge.duration_days}`
      : challenge.start_date
        ? `Starts ${challenge.start_date}`
        : "Start date coming soon";

  const tints = ["bg-fr-cream", "bg-fr-softblue", "bg-fr-softgreen", "bg-white", "bg-fr-cream", "bg-fr-softblue"];

  return (
    <div className="min-h-screen pb-20">
      <header>
        <div className="container-x flex h-[72px] items-center justify-between">
          <Logo size={56} />
          <nav className="flex items-center gap-5 text-[15px] font-medium">
            <Link href="/leaderboard" className="hover:underline hover:decoration-fr-yellow hover:decoration-[3px] hover:underline-offset-4">
              Leaderboard
            </Link>
            <Link href="/" className="text-fr-muted hover:text-ink">
              Site
            </Link>
          </nav>
        </div>
      </header>
      <main className="container-x max-w-3xl pt-8">
        <span className="eyebrow">Your dashboard</span>
        <h1 className="h-display mt-4 text-5xl sm:text-6xl">
          Hey, <span className="font-hand font-normal text-fr-blue">@{profile?.username}</span>
        </h1>

        <section className="card-pop relative mt-8 bg-fr-yellow p-6 sm:p-8">
          <span className="tape" />
          <div className="flex items-start justify-between">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em]">Your streak</p>
            <span className="rounded-full border-2 border-ink bg-white px-3 py-0.5 text-[13px] font-bold capitalize">{String(p.status).replace("_", " ")}</span>
          </div>
          <p className="h-display mt-3 text-7xl sm:text-8xl">
            {p.current_streak} <span className="text-5xl sm:text-6xl">days</span>
          </p>
          <p className="mt-2 text-[15px] font-bold">{dayLabel}</p>
        </section>

        <section className="card-pop mt-8 bg-white p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap justify-between gap-2">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-fr-muted">Day 01 → Day {challenge.duration_days}</p>
            <p className="font-display text-lg font-bold">
              {p.checkin_count} / {challenge.duration_days} days complete
            </p>
          </div>
          <StreakCalendar days={days} />
        </section>

        <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stats.map(([k, v], i) => (
            <div key={k} className={`card-pop p-4 ${tints[i % tints.length]}`}>
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-fr-charcoal">{k}</p>
              <p className="h-display mt-2 text-3xl capitalize">{v}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
