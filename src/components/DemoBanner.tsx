/** Shown only when Supabase isn't connected, so sample data is never mistaken for real data. */
export function DemoBanner() {
  return (
    <div className="fixed bottom-3 left-3 z-[60] hidden -rotate-2 rounded-full border-2 border-ink bg-fr-softblue px-3 py-1.5 text-[12px] font-bold shadow-pop-sm sm:block">
      Demo data · connect Supabase
    </div>
  );
}
