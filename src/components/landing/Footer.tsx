import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/motion";
import { Blob, Squiggle } from "@/components/doodle/Doodles";

/** Final call-to-action + footer. Set `cta={false}` on inner pages. */
export function Footer({ fee, cta = true }: { fee?: number; cta?: boolean }) {
  return (
    <footer className="relative overflow-hidden">
      {cta && (
        <div className="relative py-24 text-center lg:py-32">
          <div className="absolute left-1/2 top-1/2 w-[min(900px,130vw)] -translate-x-1/2 -translate-y-1/2">
            <Blob seed={71} color="#FBBE18" className="w-full" />
          </div>
          <Blob seed={13} color="#62B946" wobble={0.35} className="absolute bottom-6 left-[6%] hidden w-40 sm:block" />
          <Blob seed={17} color="#1748E8" wobble={0.35} className="absolute right-[8%] top-8 hidden w-32 sm:block" />
          <Reveal className="container-x relative">
            <span className="eyebrow !bg-none bg-white">Ready to start your streak?</span>
            <h2 className="h-display mx-auto mt-6 max-w-4xl text-5xl sm:text-7xl lg:text-8xl">
              30 days. One streak.
              <br />
              <span className="font-hand font-normal">Win ₹30,000 prize money!</span>
            </h2>
            <div className="mt-10 flex justify-center">
              <ButtonLink href="/join">Join the challenge — ₹{fee ?? 99}</ButtonLink>
            </div>
            <p className="mt-6 text-lg font-bold">Show up. Play your sport. Protect your streak.</p>
          </Reveal>
        </div>
      )}

      <div className="border-t-2 border-ink bg-fr-warm">
        <div className="container-x grid gap-10 pb-28 pt-14 sm:pb-12 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo size={84} />
            <p className="mt-4 max-w-[240px] text-[15px] text-fr-charcoal">A community for women who play. 30 Day Sports Challenge.</p>
          </div>
          <FooterCol title="Challenge" links={[["/#how-it-works", "How it works"], ["/#prize", "Prize"], ["/#rules", "Rules"], ["/#prize-terms", "Prize terms"]]} />
          <FooterCol title="Community" links={[["/leaderboard", "Leaderboard"], ["/#community", "Participants"], ["/#referrals", "Referrals"]]} />
          <FooterCol title="Account" links={[["/join", "Join"], ["/login", "Log in"], ["/dashboard", "Dashboard"]]} />
        </div>
        <Squiggle className="container-x block h-4 w-full opacity-30" />
        <div className="container-x flex flex-col gap-2 py-5 text-[13px] text-fr-muted sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Fem Rise Club</span>
          <a href="https://voxsera.com/" target="_blank" rel="noopener noreferrer" className="hover:text-ink">
            Built by Voxsera AI Solutions
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <p className="font-display text-lg font-bold">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-[15px] text-fr-charcoal hover:text-ink hover:underline hover:decoration-fr-yellow hover:decoration-[3px] hover:underline-offset-4">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
