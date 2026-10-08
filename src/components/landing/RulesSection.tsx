"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { SectionHead } from "@/components/ui/SectionHead";

/** Rules come from the admin-editable challenge settings. Styled like a journal page. */
export function RulesSection({ rules, guidelines }: { rules: string[]; guidelines: string | null }) {
  const [open, setOpen] = useState(false);
  const preview = 8;
  const shown = open ? rules : rules.slice(0, preview);
  const ring = ["#FBBE18", "#1748E8", "#62B946", "#F4A623"];

  return (
    <section id="rules" className="scroll-mt-24 py-24 lg:py-32">
      <div className="container-x grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHead
            eyebrow="The rules"
            title={
              <>
                Simple.
                <br />
                Fair.
                <br />
                <span className="font-hand font-normal text-fr-yellow" style={{ WebkitTextStroke: "1.5px #0B0B0B" }}>
                  Same for all.
                </span>
              </>
            }
          />
        </div>

        <div className="card-pop notebook relative bg-white px-5 py-6 sm:px-8">
          <span className="absolute bottom-0 left-12 top-0 hidden w-[2px] bg-fr-red/40 sm:block" aria-hidden />
          <ol className="sm:pl-10">
            <AnimatePresence initial={false}>
              {shown.map((rule, i) => (
                <motion.li
                  key={rule}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  className="flex items-center gap-4 py-2"
                >
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center font-display text-sm font-bold">
                    <svg viewBox="0 0 40 40" className="absolute inset-0" aria-hidden>
                      <circle cx="20" cy="20" r="16" fill="none" stroke={ring[i % ring.length]} strokeWidth="3.5" filter="url(#fr-rough)" />
                    </svg>
                    {i + 1}
                  </span>
                  <span className="text-[16px] font-medium">{rule}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>

          {open && guidelines && (
            <div className="mt-6 rounded-[10px] bg-fr-softgreen p-4 sm:ml-10">
              <p className="text-[12px] font-bold uppercase tracking-[0.16em]">Community guidelines</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{guidelines}</p>
            </div>
          )}

          {rules.length > preview && (
            <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="btn-primary mt-6 sm:ml-10">
              {open ? "Show less ↑" : "Read full rules ↓"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
