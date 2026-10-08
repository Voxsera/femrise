"use client";

import { motion } from "framer-motion";
import { SectionHead } from "@/components/ui/SectionHead";
import { StreakCalendar, CALENDAR_LEGEND } from "@/components/ui/StreakCalendar";
import { Arrow, Circled, Blob } from "@/components/doodle/Doodles";
import type { DayState } from "@/lib/types";

// Example journey: day 9 missed then restored, today is Day 13.
const example: DayState[] = Array.from({ length: 30 }, (_, i) => (i === 8 ? "restored" : i < 12 ? "completed" : i === 12 ? "current" : "future"));

export function ChallengeSection({ duration, restoreFee }: { duration: number; restoreFee: number }) {
  return (
    <section id="challenge" className="relative overflow-hidden border-y-2 border-ink bg-fr-cream py-24 lg:py-32">
      <Blob seed={31} color="#DCE8FF" className="absolute -left-24 top-10 w-72 opacity-80" />
      <div className="container-x relative grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <SectionHead
            eyebrow="The challenge"
            title={
              <>
                {duration} days.
                <br />
                Show up <span className="text-fr-blue">every</span> day.
              </>
            }
          />
          <p className="mt-8 text-xl font-bold">This isn&apos;t about being the fastest or strongest.</p>
          <p className="mt-3 font-hand text-4xl">
            It&apos;s about{" "}
            <Circled color="#1748E8" seed={9}>
              showing up.
            </Circled>
          </p>
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-fr-charcoal">
            Every day, complete one sports activity and upload a daily check-in. Miss a day and you can Restore your
            streak once for ₹{restoreFee}.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, rotate: 3, y: 30 }}
          whileInView={{ opacity: 1, rotate: -1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 110, damping: 16 }}
          className="card-pop relative bg-white p-5 sm:p-7"
        >
          <span className="tape" />
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-fr-muted">Day 01 → Day {duration}</p>
              <p className="h-display mt-1 text-4xl">13 / {duration} days</p>
            </div>
            <span className="rounded-full border-2 border-ink bg-fr-green px-3 py-1 text-[13px] font-bold">✓ Streak safe</span>
          </div>
          <StreakCalendar days={example.slice(0, duration)} />
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-medium text-fr-charcoal">
            {CALENDAR_LEGEND.map(([c, l]) => (
              <li key={l} className="flex items-center gap-1.5">
                <span className={`h-3.5 w-3.5 rounded-[4px] border-2 border-ink ${c}`} /> {l}
              </li>
            ))}
          </ul>
          <div className="absolute -bottom-14 right-6 hidden items-end gap-1 sm:flex">
            <Arrow variant="up" className="h-12 w-16 -scale-x-100" />
            <span className="font-hand text-2xl">day 9 restored!</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
