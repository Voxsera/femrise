"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

/** Sticky bottom CTA on phones so the main action is always one tap away. */
export function MobileJoinBar({ fee }: { fee: number }) {
  const { scrollY } = useScroll();
  const [show, setShow] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setShow(y > 640));

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden"
        >
          <Link href="/join" className="btn-yellow w-full py-4 !shadow-pop">
            Join the challenge — ₹{fee}
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
