"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import type { DayState } from "@/lib/types";

const stateStyles: Record<DayState, string> = {
  completed: "bg-fr-green text-ink",
  current: "bg-fr-yellow text-ink",
  missed: "bg-fr-red text-white",
  restored: "bg-fr-blue text-white",
  future: "bg-white text-fr-muted",
};

const mark: Partial<Record<DayState, string>> = { completed: "✓", missed: "✕", restored: "↺", current: "●" };

/** 30-day streak grid: green done · yellow today · red missed · blue restored · white upcoming. */
export function StreakCalendar({ days, compact = false, className }: { days: DayState[]; compact?: boolean; className?: string }) {
  return (
    <motion.ol
      className={clsx(compact ? "grid grid-cols-10 gap-1" : "grid grid-cols-6 gap-2 sm:grid-cols-10", className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.02 } } }}
      aria-label="30 day streak calendar"
    >
      {days.map((state, i) => (
        <motion.li
          key={i}
          variants={{ hidden: { opacity: 0, scale: 0.4, rotate: -10 }, show: { opacity: 1, scale: 1, rotate: (i % 3) - 1 } }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          className={clsx(
            "relative flex aspect-square flex-col items-center justify-center border-2 border-ink font-bold",
            compact ? "rounded-[5px] text-[0px]" : "rounded-[8px] text-[12px]",
            stateStyles[state],
          )}
          title={`Day ${String(i + 1).padStart(2, "0")} — ${state}`}
        >
          {!compact && (
            <>
              <span className="leading-none">{String(i + 1).padStart(2, "0")}</span>
              <span className="mt-0.5 h-3 text-[11px] leading-none">{mark[state] ?? ""}</span>
            </>
          )}
        </motion.li>
      ))}
    </motion.ol>
  );
}

export const CALENDAR_LEGEND: Array<[string, string]> = [
  ["bg-fr-green", "Completed"],
  ["bg-fr-yellow", "Today"],
  ["bg-fr-red", "Missed"],
  ["bg-fr-blue", "Restored"],
  ["bg-white", "Upcoming"],
];
