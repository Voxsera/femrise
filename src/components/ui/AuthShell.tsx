import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Blob, Sticker, Arrow } from "@/components/doodle/Doodles";

/** Split layout for signup / login: playful brand panel + form column. Stacks on mobile. */
export function AuthShell({ children, title, kicker }: { children: React.ReactNode; title: React.ReactNode; kicker: string }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden overflow-hidden border-r-2 border-ink bg-fr-cream p-12 lg:flex lg:flex-col lg:justify-between">
        <Blob seed={3} color="#FBBE18" className="absolute -right-24 top-1/4 w-[120%]" />
        <Blob seed={11} color="#1748E8" wobble={0.35} className="absolute -left-10 bottom-[-40px] w-56" />
        <Blob seed={21} color="#62B946" wobble={0.3} className="absolute right-8 top-6 w-28" />
        <div className="relative">
          <Logo size={84} />
        </div>
        <div className="relative">
          <p className="h-display text-7xl">
            21 Days.
            <br />
            One <span className="font-hand font-normal text-white" style={{ WebkitTextStroke: "2px #0B0B0B" }}>Streak!</span>
          </p>
          <p className="mt-4 text-lg font-bold">Your sport. Your streak. Your challenge.</p>
        </div>
        <div className="relative flex items-end gap-4">
          <Sticker color="#DCE8FF" rotate={-6}>
            ₹99 entry
          </Sticker>
          <Sticker color="#E5F4DF" rotate={5}>
            ₹30K prize
          </Sticker>
          <Arrow variant="up" className="h-12 w-16" />
        </div>
      </aside>
      <main className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:py-12">
        <div className="flex items-center justify-between">
          <span className="lg:hidden">
            <Logo size={56} />
          </span>
          <Link href="/" className="ml-auto text-[14px] font-bold underline decoration-fr-yellow decoration-[3px] underline-offset-4">
            ← Back to site
          </Link>
        </div>
        <div className="mx-auto w-full max-w-md flex-1 pt-10 lg:pt-14">
          <span className="eyebrow">{kicker}</span>
          <h1 className="h-display mt-4 text-5xl sm:text-6xl">{title}</h1>
          <div className="mt-10">{children}</div>
        </div>
      </main>
    </div>
  );
}

export const inputClass = "field";
export const labelClass = "label-field";
