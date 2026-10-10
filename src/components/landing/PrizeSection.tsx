"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHead } from "@/components/ui/SectionHead";
import { Blob, Sticker, Sparks, Burst } from "@/components/doodle/Doodles";
import { PrizeCard } from "./PrizeCard";

export function PrizeSection({ prizeText, prizeTerms }: { prizeText: string; prizeTerms: string | null }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-8, 6]);

  return (
    <section id="prize" ref={ref} className="relative scroll-mt-24 overflow-hidden py-24 lg:py-32">
      <div className="container-x grid items-center gap-16 lg:grid-cols-2">
        <div className="relative mx-auto aspect-square w-full max-w-[480px]">
          <Blob seed={41} color="#FBBE18" className="absolute inset-0 w-full" />
          <Blob seed={5} color="#1748E8" wobble={0.4} className="absolute -bottom-4 -left-4 w-[32%]" />
          <div className="absolute left-1/2 top-[22%] w-[62%] -translate-x-1/2 text-[13px] sm:text-[18px]">
            <motion.div style={{ y, rotate }}>
              <PrizeCard />
            </motion.div>
          </div>
          <Sparks className="absolute left-[24%] top-[6%] h-10 w-14 -rotate-12" />
          <Burst className="absolute right-[18%] top-[16%] h-10 w-10 -rotate-12" color="#0B0B0B" />
          <div className="absolute bottom-[10%] right-[2%]">
            <Sticker color="#E5F4DF" rotate={-8}>
              21 days.
              <br />
              one streak.
            </Sticker>
          </div>
        </div>

        <div>
          <SectionHead
            eyebrow="The prize"
            title={
              <>
                Your streak leads to the <span className="marker">final.</span>
              </>
            }
            intro={prizeText}
          />
          <ol className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              ["01", "Complete the 21-day challenge"],
              ["02", "Stay consistent, every day"],
              ["03", "Climb the leaderboard"],
              ["04", "Win the on-ground final — ₹30,000"],
            ].map(([n, t]) => (
              <li key={n} className="flex items-center gap-3 rounded-[12px] border-2 border-ink bg-white px-4 py-3 text-[15px] font-bold shadow-pop-sm">
                <span className="font-display text-fr-blue">{n}</span> {t}
              </li>
            ))}
          </ol>
          <div className="mt-9 flex flex-wrap items-center gap-x-12 gap-y-4">
            <ButtonLink href="/join" variant="yellow">
              Start my streak
            </ButtonLink>
            <a href="#prize-terms" className="text-[14px] font-medium text-fr-muted underline underline-offset-4 hover:text-ink">
              Prize terms &amp; conditions apply
            </a>
          </div>
          <div id="prize-terms" className="mt-10 max-w-md rounded-[12px] border-2 border-dashed border-ink/40 p-4">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em]">Prize terms</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-fr-charcoal">
              {prizeTerms ?? "Official prize terms and conditions will be published here by Fem Rise Club before the challenge begins."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
