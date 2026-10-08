/**
 * Prize ticket: ₹30,000 prize money for the winner of the final on-ground round.
 * Sized with em units — set the font size on the parent to scale it.
 */
export function PrizeCard({ short = false, className }: { short?: boolean; className?: string }) {
  return (
    <div className={className} aria-hidden>
      <div className="relative rounded-[16px] border-[3px] border-ink bg-white p-[0.5em] shadow-pop">
        <div className="relative flex flex-col items-center rounded-[11px] border-2 border-dashed border-ink bg-fr-yellow px-[0.8em] py-[1em] text-center">
          <span className="absolute -left-[0.75em] top-1/2 h-[1.3em] w-[1.3em] -translate-y-1/2 rounded-full border-2 border-ink bg-fr-warm" />
          <span className="absolute -right-[0.75em] top-1/2 h-[1.3em] w-[1.3em] -translate-y-1/2 rounded-full border-2 border-ink bg-fr-warm" />
          <span className="text-[0.7em] font-bold uppercase tracking-[0.18em]">Prize money</span>
          <span className="mt-[0.15em] font-display text-[2.6em] font-bold leading-none tracking-[-0.03em]">{short ? "₹30K" : "₹30,000"}</span>
          <span className="mt-[0.6em] rounded-full bg-ink px-[0.8em] py-[0.35em] text-[0.62em] font-bold uppercase tracking-wide text-white">
            On-ground final
          </span>
        </div>
      </div>
    </div>
  );
}
