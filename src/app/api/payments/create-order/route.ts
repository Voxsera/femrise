import { NextResponse } from "next/server";
import { env, isRazorpayConfigured, isSupabaseAdminConfigured } from "@/lib/env";
import { createOrder } from "@/lib/payments/razorpay";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * POST { type: "registration" | "restore", referralCode?: string }
 * Amount is always read from the challenge settings on the server — never from the browser.
 */
export async function POST(req: Request) {
  if (!isRazorpayConfigured || !isSupabaseAdminConfigured) {
    return NextResponse.json(
      { error: "Payments are not connected yet. Add Supabase and Razorpay keys to .env.local." },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { type?: string; referralCode?: string };
  const type = body.type === "restore" ? "restore" : "registration";

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first" }, { status: 401 });

  const { data: challenge } = await admin.from("challenges").select("*").eq("slug", env.challengeSlug).single();
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

  // Ensure a participant row exists (created as pending_payment, with referral link if any).
  type ParticipantRow = { id: string; status: string; restore_used: boolean; pending_restore_day: number | null };
  let participant: ParticipantRow | null = null;
  if (type === "registration") {
    const { data, error } = await supabase.rpc("join_challenge", {
      p_challenge: challenge.id,
      p_referral_code: body.referralCode ?? null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    participant = data as ParticipantRow;
    if (participant.status !== "pending_payment") {
      return NextResponse.json({ error: "Your challenge is already active" }, { status: 409 });
    }
  } else {
    const { data } = await admin
      .from("challenge_participants")
      .select("*")
      .eq("challenge_id", challenge.id)
      .eq("user_id", user.id)
      .single();
    participant = data as ParticipantRow | null;
    if (!participant || participant.status !== "restore_pending" || participant.restore_used) {
      return NextResponse.json({ error: "Restore is not available" }, { status: 409 });
    }
  }

  const amount = type === "registration" ? challenge.registration_fee : challenge.restore_fee // rupees;

  const order = await createOrder(amount * 100, `${type}-${participant.id}`, {
    participant_id: participant.id,
    payment_type: type,
  });

  const { error: insertError } = await admin.from("payments").insert({
    user_id: user.id,
    participant_id: participant.id,
    challenge_id: challenge.id,
    payment_type: type,
    amount,
    provider_order_id: order.id,
    challenge_day: type === "restore" ? participant.pending_restore_day : null,
  });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({
    keyId: env.razorpayKeyId,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    type,
  });
}
