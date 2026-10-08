"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { Logo } from "@/components/brand/Logo";
import { Burst } from "@/components/doodle/Doodles";

const links = [
  { href: "/", label: "Home" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#prize", label: "Prize" },
  { href: "/#rules", label: "Rules" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/#community", label: "Community" },
];

/** Warm-white navbar that stays the same colour on scroll — no dark bar, no bottom line. */
export function Navbar({ fee }: { fee: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-fr-warm/90 backdrop-blur-md">
      <nav className="container-x flex h-[72px] items-center justify-between lg:h-[84px]">
        <Logo size={58} priority />

        <ul className="hidden items-center gap-8 lg:flex">
          {links.map((l) => {
            const active = l.href === pathname;
            return (
              <li key={l.href}>
                <Link href={l.href} className="group relative py-2 text-[15px] font-medium text-ink">
                  <span className={clsx(active && "font-bold")}>{l.label}</span>
                  <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute -bottom-0.5 left-0 h-2 w-full" aria-hidden>
                    <path
                      d="M2 6 C30 2 70 2 98 5"
                      stroke="#FBBE18"
                      strokeWidth="5"
                      strokeLinecap="round"
                      fill="none"
                      pathLength={1}
                      className={clsx(
                        "transition-[stroke-dashoffset] duration-300 [stroke-dasharray:1]",
                        active ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1] group-hover:[stroke-dashoffset:0]",
                      )}
                    />
                  </svg>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden px-3 py-2 text-[15px] font-medium hover:underline sm:inline">
            Log in
          </Link>
          <span className="relative hidden sm:inline-flex">
            <Link href="/join" className="btn-primary !px-6 !py-3">
              Join — ₹{fee}
            </Link>
            <Burst className="absolute -right-6 -top-4 h-7 w-7 -rotate-45" />
          </span>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="flex h-11 items-center gap-2 rounded-full border-2 border-ink bg-fr-yellow px-4 text-sm font-bold lg:hidden"
          >
            <span className="flex flex-col gap-[4px]" aria-hidden>
              <span className={clsx("h-[2px] w-4 bg-ink transition", open && "translate-y-[6px] rotate-45")} />
              <span className={clsx("h-[2px] w-4 bg-ink transition", open && "opacity-0")} />
              <span className={clsx("h-[2px] w-4 bg-ink transition", open && "-translate-y-[6px] -rotate-45")} />
            </span>
            Menu
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden bg-fr-warm lg:hidden"
          >
            <ul className="container-x pb-8 pt-2">
              {links.map((l, i) => (
                <motion.li key={l.href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                  <Link href={l.href} onClick={() => setOpen(false)} className="h-display block py-2.5 text-[2.1rem]">
                    {l.label}
                  </Link>
                </motion.li>
              ))}
              <li className="mt-6 grid grid-cols-2 gap-3">
                <Link href="/login" onClick={() => setOpen(false)} className="btn-outline">
                  Log in
                </Link>
                <Link href="/join" onClick={() => setOpen(false)} className="btn-primary">
                  Join — ₹{fee}
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
