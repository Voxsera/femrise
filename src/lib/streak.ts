import type { DayState } from "./types";

/** Build a calendar: `done` completed days, then today, rest future. */
export function demoDays(done: number, total = 21): DayState[] {
  return Array.from({ length: total }, (_, i) => (i < done ? "completed" : i === done ? "current" : "future"));
}

export const formatINR = (rupees: number) => `₹${rupees.toLocaleString("en-IN")}`;
