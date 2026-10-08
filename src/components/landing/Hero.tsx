import fs from "node:fs";
import path from "node:path";
import { CalendarCheck, Camera, RotateCcw } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { MarkerUnderline, Arrow } from "@/components/doodle/Doodles";
import { HeroVisual } from "./HeroVisual";
import { HeroCopy } from "./HeroCopy";
import type { LeaderboardRow } from "@/lib/types";

/**
 * Drop a transparent cut-out photo of an athlete at  public/photos/hero-athlete.png
 * and it appears in the hero automatically. Until then an illustrated composition is shown.
 */
function findHeroPhoto() {
  for (const name of ["hero-athlete.png", "hero-athlete.webp"]) {
    if (fs.existsSync(path.join(process.cwd(), "public", "photos", name))) return `/photos/${name}`;
  }
  return null;
}

export function Hero({
  fee,
  restoreFee,
  participantCount,
  avatars,
}: {
  fee: number;
  restoreFee: number;
  participantCount: number;
  avatars: LeaderboardRow[];
}) {
  const photo = findHeroPhoto();
  const perks = [
    { Icon: CalendarCheck, label: "30 days", sub: "Any sport counts", tint: "#DCE8FF", color: "#1748E8" },
    { Icon: Camera, label: "Daily check-in", sub: "One snap a day", tint: "#E5F4DF", color: "#62B946" },
    { Icon: RotateCcw, label: "1 Restore", sub: `Missed a day? ₹${restoreFee}`, tint: "#FFF6D8", color: "#F4A623" },
  ];

  return (
    <section className="relative overflow-hidden pb-16 pt-28 lg:pb-24 lg:pt-36">
      <div className="container-x grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
        <div className="relative z-10">
          <HeroCopy />

          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-fr-charcoal">
            Show up for yourself for 30 days. <b>Play your sport</b>, post your <b>daily check-in</b>, protect your streak
            and climb the leaderboard.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-12 gap-y-4">
            <ButtonLink href="/join" burst>
              Join the challenge — ₹{fee}
            </ButtonLink>
            <a href="#how-it-works" className="group relative text-[15px] font-bold">
              How it works ↓
              <MarkerUnderline className="absolute -bottom-2 left-0 h-3 w-full" />
            </a>
          </div>

          <ul className="mt-12 grid max-w-md grid-cols-3 gap-4">
            {perks.map(({ Icon, label, sub, tint, color }) => (
              <li key={label} className="text-center">
                <span className="relative mx-auto flex h-16 w-16 items-center justify-center">
                  <svg viewBox="0 0 64 64" className="absolute inset-0" aria-hidden>
                    <circle cx="32" cy="32" r="28" fill={tint} filter="url(#fr-crayon)" />
                  </svg>
                  <Icon className="relative h-7 w-7" style={{ color }} strokeWidth={2.4} />
                </span>
                <p className="mt-2 text-[14px] font-bold leading-tight">{label}</p>
                <p className="text-[12px] text-fr-muted">{sub}</p>
              </li>
            ))}
          </ul>
          <Arrow variant="loop" className="absolute -bottom-16 -left-6 hidden h-16 w-24 rotate-[200deg] lg:block" />
        </div>

        <HeroVisual photo={photo} participantCount={participantCount} avatars={avatars} />
      </div>
    </section>
  );
}
