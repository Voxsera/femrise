import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RazorpayEvent = {
  event: string;
  payload: {
    payment?: { entity: { id: string; order_id: string; error_description?: string } };
    order?: { entity: { id: string } };
  };
};

/** Source of truth for payments. Challenge access is only granted after a verified event. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const evt = JSON.parse(raw) as RazorpayEvent;
  const payment = evt.payload.payment?.entity;
  const orderId = payment?.order_id ?? evt.payload.order?.entity.id;
  if (!orderId) return NextResponse.json({ ok: true });

  const { data: row } = await admin.from("payments").select("payment_type").eq("provider_order_id", orderId).maybeSingle();
  if (!row) return NextResponse.json({ ok: true }); // not one of ours

  if (evt.event === "payment.captured" || evt.event === "order.paid") {
    const fn = row.payment_type === "restore" ? "apply_restore_payment" : "apply_registration_payment";
    const { error } = await admin.rpc(fn, { p_order_id: orderId, p_payment_id: payment?.id ?? null, p_raw: evt });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (evt.event === "payment.failed") {
    await admin.rpc("mark_payment_failed", {
      p_order_id: orderId,
      p_reason: payment?.error_description ?? "Payment failed",
      p_raw: evt,
    });
  }
  return NextResponse.json({ ok: true });
}
