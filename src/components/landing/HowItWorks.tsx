"use client";

import { motion } from "framer-motion";
import { Camera, Flame, ShieldCheck, TrendingUp, Trophy, UserPlus } from "lucide-react";
import { SectionHead } from "@/components/ui/SectionHead";
import { Arrow } from "@/components/doodle/Doodles";

export function HowItWorks({ fee }: { fee: number }) {
  const steps = [
    { n: "01", t: "Join", d: `Create your Femrise! account and pay ₹${fee}.`, Icon: UserPlus, bg: "#FBBE18", rot: -2 },
    { n: "02", t: "Play", d: "Play a sport every day for 30 days.", Icon: Flame, bg: "#DCE8FF", rot: 1.5 },
    { n: "03", t: "Check in", d: "Upload your daily snap showing your participation.", Icon: Camera, bg: "#E5F4DF", rot: -1 },
    { n: "04", t: "Stay consistent", d: "Don't miss a day. Every check-in keeps your streak alive.", Icon: ShieldCheck, bg: "#FFF6D8", rot: 2 },
    { n: "05", t: "Climb", d: "Earn points, invite friends and climb the leaderboard.", Icon: TrendingUp, bg: "#FBBE18", rot: -1.5 },
    { n: "06", t: "Final round", d: "Finish strong and compete in the on-ground final to win ₹30,000.", Icon: Trophy, bg: "#DCE8FF", rot: 1 },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-24 py-24 lg:py-32">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHead eyebrow="How it works" title={<>Six steps.<br />One final.</>} />
          <p className="max-w-xs font-hand text-3xl leading-tight text-fr-blue lg:text-right">
            simple enough to start today, hard enough to be proud of
          </p>
        </div>

        <ol className="relative mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {steps.map(({ n, t, d, Icon, bg, rot }, i) => (
            <motion.li
              key={n}
              initial={{ opacity: 0, y: 40, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: rot }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ type: "spring", stiffness: 130, damping: 15, delay: i * 0.08 }}
              whileHover={{ rotate: 0, y: -6 }}
              className="card-pop relative flex flex-col p-5"
              style={{ backgroundColor: bg }}
            >
              <div className="flex items-start justify-between">
                <span className="h-display text-5xl">{n}</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-white">
                  <Icon className="h-5 w-5" strokeWidth={2.4} />
                </span>
              </div>
              <h3 className="mt-8 font-display text-xl font-bold leading-tight">{t}</h3>
              <p className="mt-2 text-[14px] leading-snug text-fr-charcoal">{d}</p>
              {i < steps.length - 1 && (i + 1) % 3 !== 0 && <Arrow variant="curve" className="absolute -right-8 top-6 z-10 hidden h-8 w-12 -rotate-12 lg:block" />}
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
