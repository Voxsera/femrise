"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Avatar } from "@/components/ui/Avatar";
import type { LeaderboardRow, ParticipantStatus } from "@/lib/types";

const statusLabel: Record<ParticipantStatus, string> = {
  pending_payment: "Pending",
  active: "Active",
  restore_pending: "Streak broke",
  eliminated: "Eliminated",
  completed: "Completed",
  suspended: "Suspended",
};
const statusStyle: Record<ParticipantStatus, string> = {
  pending_payment: "bg-white text-fr-muted",
  active: "bg-fr-green",
  restore_pending: "bg-fr-red text-white",
  eliminated: "bg-fr-cream text-fr-muted",
  completed: "bg-fr-yellow",
  suspended: "bg-fr-cream text-fr-muted",
};
const medals = ["bg-fr-yellow", "bg-fr-softblue", "bg-fr-orange"];

export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  const [q, setQ] = useState("");
  const [sport, setSport] = useState("all");
  const [status, setStatus] = useState("all");

  const sports = useMemo(() => Array.from(new Set(rows.map((r) => r.sport))).sort(), [rows]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!s || r.username.toLowerCase().includes(s) || r.fullName.toLowerCase().includes(s) || (r.city ?? "").toLowerCase().includes(s)) &&
        (sport === "all" || r.sport === sport) &&
        (status === "all" || r.status === status),
    );
  }, [rows, q, sport, status]);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[1fr_200px_200px]">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, username or city" className="field" aria-label="Search" />
        <select value={sport} onChange={(e) => setSport(e.target.value)} className="field" aria-label="Sport">
          <option value="all">All sports</option>
          {sports.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="field" aria-label="Status">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="restore_pending">Streak broke</option>
          <option value="completed">Completed</option>
          <option value="eliminated">Eliminated</option>
        </select>
      </div>

      <div className="card-pop mt-8 overflow-hidden bg-white">
        <div className="hidden grid-cols-[4.5rem_1fr_6rem_6rem_6rem_8rem] gap-3 border-b-2 border-ink bg-fr-cream px-6 py-3 text-[12px] font-bold uppercase tracking-[0.12em] md:grid">
          <span>Rank</span>
          <span>Participant</span>
          <span className="text-right">Streak</span>
          <span className="text-right">Points</span>
          <span className="text-right">Referrals</span>
          <span className="text-right">Status</span>
        </div>
        <ul>
          <AnimatePresence initial={false}>
            {filtered.map((r) => (
              <motion.li
                key={r.username}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-[2.8rem_1fr_auto] items-center gap-3 border-b-2 border-ink/10 px-4 py-3.5 last:border-0 md:grid-cols-[4.5rem_1fr_6rem_6rem_6rem_8rem] md:px-6"
              >
                <span
                  className={clsx(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink font-display text-base font-bold",
                    r.rank <= 3 ? medals[r.rank - 1] : "bg-white",
                  )}
                >
                  {r.rank}
                </span>
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar name={r.fullName || r.username} src={r.avatarUrl} size={38} />
                  <span className="min-w-0">
                    <span className="block truncate font-bold">
                      @{r.username} {r.isPrivate && <span className="text-[12px] font-medium text-fr-muted">🔒 private</span>}
                    </span>
                    <span className="block truncate text-[13px] text-fr-muted">
                      {r.sport}
                      {r.city ? ` · ${r.city}` : ""}
                    </span>
                  </span>
                </span>
                <span className="text-right md:hidden">
                  <span className="block font-display text-lg font-bold">{r.points} pts</span>
                  <span className="text-[12px] text-fr-muted">{r.currentStreak}-day streak</span>
                </span>
                <span className="hidden text-right font-display text-xl font-bold md:block">{r.currentStreak}</span>
                <span className="hidden text-right font-display text-xl font-bold md:block">{r.points}</span>
                <span className="hidden text-right font-display text-xl font-bold md:block">{r.referrals}</span>
                <span className="hidden justify-end md:flex">
                  <span className={clsx("rounded-full border-2 border-ink px-2.5 py-0.5 text-[12px] font-bold", statusStyle[r.status])}>{statusLabel[r.status]}</span>
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {filtered.length === 0 && <p className="p-12 text-center text-fr-muted">No participants match your search.</p>}
      </div>
    </div>
  );
}
