"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Blob, Sticker, Arrow, Sparks } from "@/components/doodle/Doodles";
import { Avatar } from "@/components/ui/Avatar";
import { StreakCalendar } from "@/components/ui/StreakCalendar";
import { PhoneSketch } from "./PhoneSketch";
import { demoDays } from "@/lib/streak";
import type { LeaderboardRow } from "@/lib/types";

const pop = (delay: number, rotate = 0) => ({
  initial: { opacity: 0, y: 30, rotate: rotate - 6 },
  animate: { opacity: 1, y: 0, rotate },
  transition: { type: "spring" as const, stiffness: 140, damping: 15, delay },
});

/** Right side of the hero: crayon blobs + cut-out photo (or illustrated cards) + handwritten stickers. */
export function HeroVisual({ photo, participantCount, avatars }: { photo: string | null; participantCount: number; avatars: LeaderboardRow[] }) {
  return (
    <div className="relative mx-auto aspect-[1/1.02] w-full max-w-[600px]">
      {/* colour blobs */}
      <Blob seed={3} color="#FBBE18" className="absolute left-[10%] top-[14%] w-[82%]" />
      <Blob seed={11} color="#1748E8" wobble={0.35} className="absolute -left-[4%] bottom-[-2%] w-[42%]" />
      <Blob seed={21} color="#62B946" wobble={0.3} className="absolute -right-[6%] top-[46%] w-[34%]" />
      <Blob seed={7} color="#FBBE18" wobble={0.2} className="absolute right-[-2%] top-[-2%] w-[24%]" />

      {photo ? (
        <motion.div {...pop(0.2)} className="absolute inset-x-[8%] bottom-0 top-[4%]">
          <Image
            src={photo}
            alt="Femrise athlete in motion"
            fill
            priority
            sizes="(min-width: 1024px) 560px, 90vw"
            className="object-contain object-bottom"
            style={{
              filter:
                "drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff) drop-shadow(5px 0 0 #FBBE18) drop-shadow(-5px 0 0 #FBBE18) drop-shadow(0 -5px 0 #FBBE18)",
            }}
          />
        </motion.div>
      ) : (
        <>
          {/* streak card */}
          <motion.div {...pop(0.25, -4)} className="card-pop absolute left-[14%] top-[24%] w-[60%] p-3 sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] sm:text-[11px]">Your streak</p>
            <p className="h-display mt-1 text-[2rem] sm:text-5xl">12 days</p>
            <div className="mt-2 flex items-center justify-between text-[11px] font-bold sm:text-[13px]">
              <span>Day 12 / 30</span>
              <span className="rounded-full border-2 border-ink bg-fr-green px-2 py-0.5 text-[11px]">Active</span>
            </div>
            <StreakCalendar days={demoDays(11)} compact className="mt-4" />
          </motion.div>

          {/* prize phone */}
          <motion.div {...pop(0.45, 8)} className="absolute right-[6%] top-[38%] w-[30%]">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}>
              <PhoneSketch />
            </motion.div>
          </motion.div>

          {/* check-in toast */}
          <motion.div {...pop(0.65, -2)} className="absolute bottom-[14%] left-[22%] flex items-center gap-2 whitespace-nowrap rounded-full border-2 border-ink bg-white px-3 py-1.5 shadow-pop-sm sm:left-[30%] sm:px-4 sm:py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-fr-green text-[13px] font-bold">✓</span>
            <span className="text-[12px] font-bold sm:text-[14px]">Day 12 complete · 7:42 PM</span>
          </motion.div>
        </>
      )}

      {/* stickers + arrows */}
      <div className="absolute left-[2%] top-[4%]">
        <Sticker color="#DCE8FF" rotate={-7}>
          Show up
          <br />
          daily
        </Sticker>
        <Arrow className="ml-14 mt-1 h-10 w-16 rotate-[20deg]" />
      </div>
      <div className="absolute right-[2%] top-[24%]">
        <Sticker color="#FFF6D8" rotate={6}>
          Win an
          <br />
          iPhone
        </Sticker>
      </div>
      <div className="absolute bottom-[30%] left-[-4%]">
        <Sticker color="#E5F4DF" rotate={-5}>
          Protect your
          <br />
          streak
        </Sticker>
      </div>
      <Sparks className="absolute left-[46%] top-[4%] h-10 w-14 -rotate-6" />

      {/* participants */}
      <motion.div {...pop(0.8, 3)} className="absolute bottom-[1%] right-[2%] flex items-center gap-2 rounded-[14px] scale-90 sm:scale-100 border-2 border-ink bg-fr-warm px-3 py-2 shadow-pop-sm">
        <div className="flex -space-x-2">
          {avatars.slice(0, 3).map((a) => (
            <Avatar key={a.username} name={a.fullName || a.username} src={a.avatarUrl} size={28} />
          ))}
        </div>
        <span className="text-[13px] font-bold leading-tight">
          {participantCount}+ women
          <br />
          <span className="font-normal text-fr-muted">already playing</span>
        </span>
      </motion.div>
    </div>
  );
}
