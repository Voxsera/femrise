"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { SectionHead } from "@/components/ui/SectionHead";
import { Blob } from "@/components/doodle/Doodles";
import type { CommunityCard } from "@/lib/types";

const tints = ["#FBBE18", "#DCE8FF", "#E5F4DF", "#F4A623", "#FFF6D8", "#1748E8"];

/** "Polaroid" participant cards with tape — private profiles stay locked. */
export function CommunitySection({ cards, participantCount, cities }: { cards: CommunityCard[]; participantCount: number; cities: string[] }) {
  return (
    <section id="community" className="relative scroll-mt-24 overflow-hidden border-y-2 border-ink bg-fr-cream py-24 lg:py-32">
      <Blob seed={61} color="#E5F4DF" className="absolute -left-16 bottom-0 w-80" />
      <div className="container-x relative">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHead
            eyebrow="Community"
            title={
              <>
                Don&apos;t do it <span className="font-hand font-normal text-fr-blue">alone!</span>
              </>
            }
            intro="Discover other women taking on the challenge, follow their streaks and keep each other going."
          />
          <div className="flex gap-4">
            <div className="card-pop bg-fr-yellow px-5 py-3 -rotate-2">
              <p className="h-display text-4xl">{participantCount}</p>
              <p className="text-[12px] font-bold uppercase tracking-[0.12em]">Participants</p>
            </div>
            <div className="card-pop bg-white px-5 py-3 rotate-2">
              <p className="h-display text-4xl">{Math.max(cities.length, 1)}</p>
              <p className="text-[12px] font-bold uppercase tracking-[0.12em]">Cities</p>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => {
            const rot = [-2.5, 1.5, -1, 2, -1.5, 1][i % 6];
            const tint = tints[i % tints.length];
            return (
              <motion.article
                key={c.username}
                initial={{ opacity: 0, y: 40, rotate: 0 }}
                whileInView={{ opacity: 1, y: 0, rotate: rot }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ type: "spring", stiffness: 120, damping: 15, delay: (i % 3) * 0.08 }}
                whileHover={{ rotate: 0, y: -6, scale: 1.02 }}
                className="card-pop relative bg-white p-3"
              >
                <span className="tape" />
                <div
                  className="relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-[8px] border-2 border-ink p-4"
                  style={{ backgroundColor: c.isPrivate ? "#292929" : tint }}
                >
                  <div className="flex justify-between text-[12px] font-bold uppercase tracking-[0.1em]" style={{ color: c.isPrivate || tint === "#1748E8" ? "#fff" : "#0B0B0B" }}>
                    <span>Day {c.latestDay ?? c.currentStreak}</span>
                    <span>{c.sport}</span>
                  </div>
                  {c.isPrivate ? (
                    <div className="text-center text-white">
                      <Lock className="mx-auto h-7 w-7 text-fr-yellow" strokeWidth={2.4} />
                      <p className="mt-2 font-bold">Private profile</p>
                      <p className="mx-auto mt-1 max-w-[220px] text-[13px] text-white/70">Follow to request access to their challenge updates.</p>
                    </div>
                  ) : (
                    <p className="font-hand text-3xl leading-tight" style={{ color: tint === "#1748E8" ? "#fff" : "#0B0B0B" }}>
                      {c.latestCaption ? `“${c.latestCaption}”` : "Checked in today!"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 px-1 pb-1 pt-3">
                  <Avatar name={c.fullName || c.username} src={c.avatarUrl} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">@{c.username}</p>
                    <p className="text-[13px] text-fr-muted">
                      {c.currentStreak}-day streak · {c.points} pts
                    </p>
                  </div>
                  <Link
                    href={`/join?follow=${encodeURIComponent(c.username)}`}
                    className={c.isPrivate ? "btn-outline !px-4 !py-2 !text-[13px]" : "btn-primary !px-4 !py-2 !text-[13px]"}
                  >
                    {c.isPrivate ? "Request" : "Follow"}
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
