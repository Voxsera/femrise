import type { Metadata } from "next";
import { AuthShell } from "@/components/ui/AuthShell";
import { JoinFlow } from "@/components/join/JoinFlow";
import { getLandingData } from "@/lib/data/challenge";
import { env, isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Join the Mid-Winter Arc — Femrise!" };

/** The GPay QR image: public/payments/upi-qr.jpeg (also accepts .jpg / .png with the same name). */
const QR_FILES = ["/payments/upi-qr.jpeg", "/payments/upi-qr.jpg", "/payments/upi-qr.png"];

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const { settings } = await getLandingData();
  return (
    <AuthShell kicker={`Entry fee ₹${settings.registrationFee}`} title="Start your streak">
      <JoinFlow
        fee={settings.registrationFee}
        referralCode={ref ?? ""}
        supabaseReady={isSupabaseConfigured}
        challengeId={settings.id}
        upi={{ qrFiles: QR_FILES, upiId: env.upiId, upiName: env.upiName }}
      />
    </AuthShell>
  );
}
