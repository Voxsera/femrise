"use client";

import { motion } from "framer-motion";
import { Snowflake } from "lucide-react";
import { MarkerUnderline, Burst } from "@/components/doodle/Doodles";

const ease = [0.22, 1, 0.36, 1] as const;

/** "21 Days. One Streak! Win ₹30,000 prize money." — staggered entrance. */
export function HeroCopy({ badge }: { badge: string }) {
  return (
    <div className="relative">
      <motion.p
        className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-fr-softblue px-3 py-1.5 text-[11px] font-bold uppercase leading-tight tracking-[0.1em] shadow-pop-sm sm:px-4 sm:text-[13px] sm:tracking-[0.14em]"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <Snowflake className="h-4 w-4 shrink-0 text-fr-blue" strokeWidth={2.6} /> {badge}
      </motion.p>
      <Burst className="absolute -left-10 top-20 hidden h-10 w-10 -scale-x-100 sm:block" />
      <h1 className="h-display pb-2 text-[13vw] sm:text-[4.6rem] lg:text-[5rem] xl:text-[5.8rem]">
        <motion.span className="block" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          21 Days.
        </motion.span>
        <motion.span
          className="block"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease }}
        >
          One{" "}
          <motion.span
            className="relative inline-block font-hand text-[1.12em] font-normal tracking-normal text-fr-yellow"
            initial={{ rotate: -8, scale: 0.8 }}
            animate={{ rotate: -3, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.35 }}
            style={{ WebkitTextStroke: "2px #0B0B0B", paintOrder: "stroke fill" }}
          >
            Streak<span className="text-fr-blue">!</span>
          </motion.span>
        </motion.span>
      </h1>
      <motion.p
        className="relative mt-6 inline-block font-display text-[1.5rem] font-semibold leading-tight sm:text-4xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Win <span className="relative inline-block">₹30,000<MarkerUnderline className="absolute -bottom-3 left-0 h-4 w-full" /></span> prize money.
      </motion.p>
    </div>
  );
}
