import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { DemoBanner } from "@/components/DemoBanner";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { Blob, Sticker } from "@/components/doodle/Doodles";
import { getFullLeaderboard } from "@/lib/data/challenge";

export const revalidate = 30;
export const metadata: Metadata = { title: "The Streak Board — Femrise!" };

export default async function LeaderboardPage() {
  const { rows, isDemo, settings } = await getFullLeaderboard();
  const topStreak = rows.reduce((m, r) => Math.max(m, r.currentStreak), 0);
  return (
    <>
      {isDemo && <DemoBanner />}
      <Navbar fee={settings.registrationFee} />
      <main className="pt-[72px] lg:pt-[84px]">
        <section className="relative overflow-hidden pb-12 pt-16 lg:pt-20">
          <Blob seed={3} color="#FBBE18" className="absolute -right-24 -top-10 w-[520px]" />
          <Blob seed={11} color="#1748E8" wobble={0.35} className="absolute right-[30%] top-24 hidden w-24 lg:block" />
          <div className="container-x relative">
            <span className="eyebrow">Live leaderboard</span>
            <h1 className="h-display mt-5 text-6xl sm:text-8xl">
              The streak <span className="font-hand font-normal text-fr-blue">board!</span>
            </h1>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <div className="card-pop -rotate-2 bg-white px-5 py-3">
                <p className="h-display text-4xl">{rows.length}</p>
                <p className="text-[12px] font-bold uppercase tracking-[0.12em]">On the board</p>
              </div>
              <div className="card-pop rotate-2 bg-fr-softgreen px-5 py-3">
                <p className="h-display text-4xl">{topStreak}</p>
                <p className="text-[12px] font-bold uppercase tracking-[0.12em]">Longest streak</p>
              </div>
              <Sticker color="#DCE8FF" rotate={-4} className="ml-2">
                keep showing up!
              </Sticker>
            </div>
            <p className="mt-6 max-w-lg text-[15px] text-fr-charcoal">
              Rankings are based on challenge points. Private profiles appear here, but their snaps stay private.
            </p>
          </div>
        </section>
        <section className="container-x pb-24">
          <LeaderboardTable rows={rows} />
        </section>
      </main>
      <Footer fee={settings.registrationFee} cta={false} />
    </>
  );
}
