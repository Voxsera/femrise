"use client";

import { motion } from "framer-motion";
import { MarkerUnderline, Burst } from "@/components/doodle/Doodles";

const ease = [0.22, 1, 0.36, 1] as const;

/** "30 Days. One Streak! Win ₹30,000 prize money." — staggered entrance. */
export function HeroCopy() {
  return (
    <div className="relative">
      <Burst className="absolute -left-10 top-6 hidden h-10 w-10 -scale-x-100 sm:block" />
      <h1 className="h-display pb-2 text-[13vw] sm:text-[4.6rem] lg:text-[5rem] xl:text-[5.8rem]">
        <motion.span className="block" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          30 Days.
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
