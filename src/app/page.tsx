import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { SportsMarquee } from "@/components/landing/SportsMarquee";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ChallengeSection } from "@/components/landing/ChallengeSection";
import { PrizeSection } from "@/components/landing/PrizeSection";
import { RulesSection } from "@/components/landing/RulesSection";
import { ReferralSection } from "@/components/landing/ReferralSection";
import { CommunitySection } from "@/components/landing/CommunitySection";
import { LeaderboardPreview } from "@/components/landing/LeaderboardPreview";
import { Footer } from "@/components/landing/Footer";
import { MobileJoinBar } from "@/components/landing/MobileJoinBar";
import { DemoBanner } from "@/components/DemoBanner";
import { getLandingData } from "@/lib/data/challenge";
import { env } from "@/lib/env";

// Leaderboard and counts refresh every minute.
export const revalidate = 60;

export default async function HomePage() {
  const { settings, leaderboard, community, participantCount, isDemo } = await getLandingData();
  const fee = settings.registrationFee;
  const cities = Array.from(new Set(leaderboard.map((r) => r.city).filter((c): c is string => Boolean(c))));

  return (
    <>
      {isDemo && <DemoBanner />}
      <Navbar fee={fee} />
      <main>
        <Hero fee={fee} restoreFee={settings.restoreFee} participantCount={participantCount} avatars={leaderboard} />
        <SportsMarquee />
        <HowItWorks fee={fee} restoreFee={settings.restoreFee} />
        <ChallengeSection duration={settings.durationDays} restoreFee={settings.restoreFee} />
        <PrizeSection prizeText={settings.prizeText} prizeTerms={settings.prizeTerms} />
        <RulesSection rules={settings.rules} guidelines={settings.communityGuidelines} />
        <ReferralSection referralPoints={settings.referralPoints} siteUrl={env.siteUrl} />
        <CommunitySection cards={community} participantCount={participantCount} cities={cities} />
        <LeaderboardPreview rows={leaderboard.slice(0, 5)} />
      </main>
      <Footer fee={fee} />
      <MobileJoinBar fee={fee} />
    </>
  );
}
