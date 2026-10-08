import "server-only";
import crypto from "node:crypto";
import { env, isRazorpayConfigured } from "@/lib/env";

/**
 * Minimal Razorpay integration over the REST API (no SDK needed).
 * To connect: set NEXT_PUBLIC_RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET,
 * and point a Razorpay webhook (events: payment.captured, payment.failed, order.paid)
 * at  https://<your-domain>/api/payments/webhook
 *
 * Another provider can be swapped in by implementing the same three functions.
 */

export interface CreatedOrder {
  id: string;
  amount: number; // paise
  currency: string;
}

export async function createOrder(amountPaise: number, receipt: string, notes: Record<string, string>): Promise<CreatedOrder> {
  if (!isRazorpayConfigured) throw new Error("Razorpay is not configured");
  const auth = Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt: receipt.slice(0, 40), notes }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as CreatedOrder;
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** Verifies the signature returned to the browser by Razorpay Checkout. */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac("sha256", env.razorpayKeySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

/** Verifies a webhook body against the X-Razorpay-Signature header. */
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", env.razorpayWebhookSecret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}
