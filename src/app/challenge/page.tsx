import { redirect } from "next/navigation";

/** Referral links look like  /challenge?ref=USERNAME  — forward to signup with the code kept. */
export default async function ChallengeRedirect({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  redirect(ref ? `/join?ref=${encodeURIComponent(ref)}` : "/join");
}
