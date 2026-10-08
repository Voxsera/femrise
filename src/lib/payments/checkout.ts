"use client";

/** Loads Razorpay Checkout and resolves once the payment is verified on our server. */

type OrderResponse = { keyId: string; orderId: string; amount: number; currency: string; type: string; error?: string };
type RazorpayHandlerResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
  }
}

function loadScript(): Promise<void> {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load the payment window. Check your connection."));
    document.body.appendChild(s);
  });
}

export async function startPayment(opts: {
  type: "registration" | "restore";
  referralCode?: string;
  prefill?: { name?: string; email?: string; contact?: string };
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/payments/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: opts.type, referralCode: opts.referralCode }),
  });
  const order = (await res.json()) as OrderResponse;
  if (!res.ok) return { ok: false, error: order.error ?? "Could not start payment" };

  await loadScript();
  if (!window.Razorpay) return { ok: false, error: "Payment window unavailable" };

  return new Promise((resolve) => {
    const rzp = new window.Razorpay!({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "Fem Rise Club",
      description: opts.type === "restore" ? "Streak Restore" : "30 Day Sports Challenge entry",
      image: `${window.location.origin}/brand/femrise-logo.png`,
      prefill: opts.prefill,
      theme: { color: "#0A0A0A" },
      modal: { ondismiss: () => resolve({ ok: false, error: "Payment cancelled" }) },
      handler: async (r: RazorpayHandlerResponse) => {
        const v = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(r),
        });
        if (v.ok) resolve({ ok: true });
        else resolve({ ok: false, error: "Payment received but verification is pending. It will update shortly." });
      },
    });
    rzp.on("payment.failed", () => resolve({ ok: false, error: "Payment failed. Please try again." }));
    rzp.open();
  });
}
