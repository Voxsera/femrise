"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { blobPath, scribbleCircle } from "@/lib/doodle";

const draw = {
  initial: { pathLength: 0, opacity: 0 },
  whileInView: { pathLength: 1, opacity: 1 },
  viewport: { once: true, margin: "-40px" },
} as const;

/**
 * Organic crayon blob. Position it with className (absolute + width).
 * Static on purpose: animating an SVG that uses the crayon filter forces the browser
 * to re-render the filter every frame, which makes scrolling slow.
 */
export function Blob({ seed, color, className, wobble = 0.28 }: { seed: number; color: string; className?: string; wobble?: number }) {
  return (
    <svg viewBox="0 0 200 200" className={clsx("pointer-events-none animate-fadein", className)} aria-hidden>
      <path d={blobPath(seed, wobble)} fill={color} filter="url(#fr-crayon)" />
    </svg>
  );
}

/** Marker underline that draws itself in. */
export function MarkerUnderline({ color = "#FBBE18", className, width = 9 }: { color?: string; className?: string; width?: number }) {
  return (
    <svg viewBox="0 0 300 24" preserveAspectRatio="none" className={clsx("pointer-events-none", className)} aria-hidden>
      <motion.path
        d="M4 16 C70 6 160 3 296 11"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        fill="none"
        filter="url(#fr-rough)"
        {...draw}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
      />
    </svg>
  );
}

/** Loose hand-drawn circle around content. */
export function Circled({ children, color = "#1748E8", className, seed = 4 }: { children: React.ReactNode; color?: string; className?: string; seed?: number }) {
  return (
    <span className={clsx("relative inline-block", className)}>
      {children}
      <svg viewBox="0 0 200 80" preserveAspectRatio="none" className="pointer-events-none absolute -inset-x-[12%] -inset-y-[30%] h-[160%] w-[124%]" aria-hidden>
        <motion.path d={scribbleCircle(seed)} stroke={color} strokeWidth={2.6} fill="none" strokeLinecap="round" filter="url(#fr-rough)" {...draw} transition={{ duration: 0.9, ease: "easeInOut", delay: 0.3 }} />
      </svg>
    </span>
  );
}

/** Three short "energy" strokes (like the yellow lines beside the CTA). */
export function Burst({ color = "#FBBE18", className, flip = false }: { color?: string; className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className={clsx("pointer-events-none", flip && "-scale-x-100", className)} aria-hidden>
      {["M6 8 L16 16", "M4 21 L17 21", "M7 34 L16 26"].map((d, i) => (
        <motion.path key={i} d={d} stroke={color} strokeWidth={4} strokeLinecap="round" {...draw} transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }} />
      ))}
    </svg>
  );
}

/** Curved hand-drawn arrow. `variant` picks a shape. */
export function Arrow({ className, color = "#0B0B0B", variant = "curve" }: { className?: string; color?: string; variant?: "curve" | "loop" | "up" }) {
  const shapes = {
    curve: { body: "M8 10 C 30 50, 70 62, 104 44", head: "M90 34 L105 44 L90 55" },
    loop: { body: "M10 60 C 20 10, 70 10, 60 40 C 52 62, 30 40, 60 26 C 80 18, 98 22, 108 30", head: "M96 20 L109 31 L94 38" },
    up: { body: "M20 70 C 40 60, 60 40, 78 12", head: "M64 14 L79 10 L80 26" },
  }[variant];
  return (
    <svg viewBox="0 0 120 80" className={clsx("pointer-events-none overflow-visible", className)} aria-hidden>
      <motion.path d={shapes.body} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" {...draw} transition={{ duration: 0.8 }} />
      <motion.path d={shapes.head} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" {...draw} transition={{ duration: 0.3, delay: 0.7 }} />
    </svg>
  );
}

/** Rotated handwritten label on a crayon highlight (e.g. "Stronger Mind"). */
export function Sticker({ children, color = "#DCE8FF", rotate = -6, className }: { children: React.ReactNode; color?: string; rotate?: number; className?: string }) {
  return (
    <motion.span
      className={clsx("relative inline-block px-3 py-1.5 font-hand sm:px-4 sm:py-2 text-lg leading-[0.95] text-ink sm:text-2xl lg:text-[28px]", className)}
      style={{ rotate }}
      initial={{ scale: 0, rotate: rotate - 10 }}
      whileInView={{ scale: 1, rotate }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.06, rotate: rotate + 3 }}
      transition={{ type: "spring", stiffness: 260, damping: 14 }}
    >
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 -z-0 h-full w-full" aria-hidden>
        <rect x="2" y="4" width="96" height="52" rx="3" fill={color} filter="url(#fr-crayon)" />
      </svg>
      <span className="relative">{children}</span>
    </motion.span>
  );
}

/** Wavy hand-drawn divider. */
export function Squiggle({ className, color = "#0B0B0B" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 400 20" preserveAspectRatio="none" className={clsx("pointer-events-none", className)} aria-hidden>
      <motion.path
        d="M2 10 Q 22 0 42 10 T 82 10 T 122 10 T 162 10 T 202 10 T 242 10 T 282 10 T 322 10 T 362 10 T 398 10"
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        {...draw}
        transition={{ duration: 1.2 }}
      />
    </svg>
  );
}

/** Little crown / sparkle marks drawn above things. */
export function Sparks({ className, color = "#0B0B0B" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={clsx("pointer-events-none", className)} aria-hidden>
      <motion.path d="M6 36 L14 8 L26 30 L34 6 L46 32 L54 14" stroke={color} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" {...draw} transition={{ duration: 0.6 }} />
    </svg>
  );
}
