import { SPORTS } from "@/lib/defaults";

const items = SPORTS.filter((s) => s !== "Other");
const dots = ["bg-fr-blue", "bg-fr-green", "bg-fr-orange", "bg-ink"];

/** Slightly tilted yellow "tape" ticker — any sport counts. */
export function SportsMarquee() {
  const row = [...items, ...items];
  return (
    <div className="relative z-10 -my-2 -rotate-[1.5deg] overflow-hidden border-y-2 border-ink bg-fr-yellow py-3" aria-label="Sports that count">
      <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
        {row.map((s, i) => (
          <span key={i} className="flex items-center gap-8 font-display text-xl font-bold uppercase sm:text-2xl">
            {s}
            <span className={`h-3 w-3 rounded-full border-2 border-ink ${dots[i % dots.length]}`} aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}
