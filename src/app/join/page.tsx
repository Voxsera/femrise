import type { Metadata } from "next";
import { AuthShell } from "@/components/ui/AuthShell";
import { JoinFlow } from "@/components/join/JoinFlow";
import { getLandingData } from "@/lib/data/challenge";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Join the challenge — Fem Rise Club" };

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const { settings } = await getLandingData();
  return (
    <AuthShell kicker={`Entry fee ₹${settings.registrationFee}`} title="Start your streak">
      <JoinFlow fee={settings.registrationFee} referralCode={ref ?? ""} supabaseReady={isSupabaseConfigured} />
    </AuthShell>
  );
}
