/**
 * Hand-drawn style phone used for the prize (generic outline, no product photo or trademarks).
 * Swap for the official prize image once Fem Rise Club shares one.
 */
export function PhoneSketch({ className, label = "Chance to win" }: { className?: string; label?: string }) {
  return (
    <div className={className} aria-hidden>
      <div className="relative aspect-[9/18.5] rounded-[22%/11%] border-[3px] border-ink bg-white p-[6%] shadow-pop">
        <span className="absolute -left-[5px] top-[22%] h-[9%] w-[4px] rounded-l bg-ink" />
        <span className="absolute -left-[5px] top-[34%] h-[12%] w-[4px] rounded-l bg-ink" />
        <span className="absolute -right-[5px] top-[28%] h-[16%] w-[4px] rounded-r bg-ink" />
        <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-[18%/9%] border-2 border-ink bg-fr-yellow">
          <span className="absolute left-1/2 top-[4%] h-[4%] w-[34%] -translate-x-1/2 rounded-full bg-ink" />
          <span className="font-display text-[2.6em] font-bold leading-none">30</span>
          <span className="mt-1 text-[0.62em] font-bold uppercase tracking-widest">day streak</span>
          <span className="mt-3 rounded-full bg-ink px-2 py-1 text-[0.55em] font-bold uppercase tracking-wide text-white">{label}</span>
          <span className="absolute bottom-[3%] left-1/2 h-[1.5%] w-[34%] -translate-x-1/2 rounded-full bg-ink/70" />
        </div>
      </div>
    </div>
  );
}
