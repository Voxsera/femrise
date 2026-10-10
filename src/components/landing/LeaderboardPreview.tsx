import clsx from "clsx";
import { ButtonLink } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { SectionHead } from "@/components/ui/SectionHead";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import type { LeaderboardRow } from "@/lib/types";

const medals = ["bg-fr-yellow", "bg-fr-softblue", "bg-fr-orange"];

export function LeaderboardPreview({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <section id="leaderboard" className="scroll-mt-24 py-24 lg:py-32">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHead eyebrow="Live leaderboard" title="The streak board" />
          <p className="max-w-xs font-hand text-3xl leading-tight lg:text-right">21 days. One challenge. Keep showing up.</p>
        </div>

        <div className="card-pop mt-12 overflow-hidden bg-white">
          <div className="grid grid-cols-[2.8rem_1fr_4.5rem] gap-3 border-b-2 border-ink bg-fr-cream px-4 py-3 text-[12px] font-bold uppercase tracking-[0.12em] sm:grid-cols-[4.5rem_1fr_7rem_7rem] sm:px-6">
            <span>Rank</span>
            <span>Participant</span>
            <span className="hidden text-right sm:block">Streak</span>
            <span className="text-right">Points</span>
          </div>
          {rows.length === 0 ? (
            <p className="p-10 text-center text-fr-muted">The board fills up as soon as the challenge goes live.</p>
          ) : (
            <Stagger gap={0.06}>
              {rows.map((r, i) => (
                <StaggerItem key={r.username}>
                  <div className="grid grid-cols-[2.8rem_1fr_4.5rem] items-center gap-3 border-b-2 border-ink/10 px-4 py-3.5 last:border-0 sm:grid-cols-[4.5rem_1fr_7rem_7rem] sm:px-6">
                    <span
                      className={clsx(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink font-display text-lg font-bold",
                        i < 3 ? medals[i] : "bg-white",
                      )}
                    >
                      {r.rank}
                    </span>
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar name={r.fullName || r.username} src={r.avatarUrl} size={36} />
                      <span className="min-w-0">
                        <span className="block truncate font-bold">
                          @{r.username} {r.isPrivate && <span className="text-[12px] font-medium text-fr-muted">🔒 private</span>}
                        </span>
                        <span className="block truncate text-[13px] text-fr-muted">{r.sport}</span>
                      </span>
                    </span>
                    <span className="hidden text-right font-display text-xl font-bold sm:block">
                      {r.currentStreak}
                      <span className="ml-1 font-sans text-[12px] font-medium text-fr-muted">days</span>
                    </span>
                    <span className="text-right font-display text-xl font-bold">
                      {r.points}
                      <span className="ml-1 font-sans text-[12px] font-medium text-fr-muted">pts</span>
                    </span>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[14px] text-fr-muted">Rankings are based on challenge points. Private profiles appear here; their snaps never do.</p>
          <ButtonLink href="/leaderboard" variant="outline">
            View full leaderboard →
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
