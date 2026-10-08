import { NextResponse } from "next/server";
import { isRazorpayConfigured } from "@/lib/env";
import { verifyCheckoutSignature } from "@/lib/payments/razorpay";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Called by the browser right after Razorpay Checkout succeeds, so the user is
 * activated immediately. The webhook does the same thing as a backup — both are idempotent.
 */
export async function POST(req: Request) {
  const admin = createSupabaseAdminClient();
  if (!isRazorpayConfigured || !admin) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = (await req.json()) as Record<string, string>;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!verifyCheckoutSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { data: payment } = await admin
    .from("payments")
    .select("payment_type")
    .eq("provider_order_id", razorpay_order_id)
    .single();
  if (!payment) return NextResponse.json({ error: "Unknown order" }, { status: 404 });

  const fn = payment.payment_type === "restore" ? "apply_restore_payment" : "apply_registration_payment";
  const { error } = await admin.rpc(fn, { p_order_id: razorpay_order_id, p_payment_id: razorpay_payment_id, p_raw: null });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, type: payment.payment_type });
}
