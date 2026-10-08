"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { SectionHead } from "@/components/ui/SectionHead";
import { Arrow, Blob } from "@/components/doodle/Doodles";

/** Landing preview of the referral system. Real links live on each participant's dashboard. */
export function ReferralSection({ referralPoints, siteUrl }: { referralPoints: number; siteUrl: string }) {
  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const link = `${host}/challenge?ref=yourname`;
  const [copied, setCopied] = useState(false);
  const exampleReferrals = 7;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`https://${link}`);
    } catch {
      /* clipboard may be blocked */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section id="referrals" className="relative scroll-mt-24 overflow-hidden border-y-2 border-ink bg-fr-softblue py-24 lg:py-32">
      <Blob seed={51} color="#1748E8" className="absolute -right-20 -top-20 w-80" />
      <div className="container-x relative grid items-center gap-14 lg:grid-cols-2">
        <div>
          <SectionHead
            eyebrow="Referrals"
            title={
              <>
                Play together.
                <br />
                <span className="text-fr-blue">Climb together.</span>
              </>
            }
            intro={
              <>
                Every participant gets a unique referral link. When a friend signs up and completes their entry payment
                through your link, you earn <b>+{referralPoints} points</b>.
              </>
            }
          />
          <div className="mt-6 flex items-center gap-2">
            <span className="font-hand text-3xl">bring your squad</span>
            <Arrow variant="curve" className="h-10 w-16 -rotate-6" />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, rotate: 2 }}
          whileInView={{ opacity: 1, y: 0, rotate: -1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 110, damping: 16 }}
          className="card-pop bg-white p-6 sm:p-8"
        >
          <p className="text-[12px] font-bold uppercase tracking-[0.16em]">Your referral link</p>
          <div className="mt-3 flex items-stretch overflow-hidden rounded-full border-2 border-ink bg-fr-warm">
            <span className="flex min-w-0 flex-1 items-center truncate px-5 text-[14px] font-medium">{link}</span>
            <button type="button" onClick={copy} className="shrink-0 bg-ink px-5 py-3 text-[14px] font-bold text-white transition hover:bg-fr-blue">
              {copied ? "Copied ✓" : "Copy link"}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-[12px] border-2 border-ink bg-fr-yellow p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em]">Successful referrals</p>
              <p className="h-display mt-2 text-5xl sm:text-6xl">{exampleReferrals}</p>
            </div>
            <div className="rounded-[12px] border-2 border-ink bg-fr-softgreen p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em]">Referral points</p>
              <p className="h-display mt-2 text-5xl sm:text-6xl">+{exampleReferrals * referralPoints}</p>
            </div>
          </div>
          <p className="mt-4 text-[13px] text-fr-muted">Example only. Points are added after your friend&apos;s entry payment is confirmed.</p>
        </motion.div>
      </div>
    </section>
  );
}
