"use client";

import { Check, Copy, ImageUp, Loader2, Smartphone } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { inputClass, labelClass } from "@/components/ui/AuthShell";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * ₹99 entry via GPay / any UPI app.
 * 1. Participant scans the QR (or taps "Pay with UPI app" on a phone) and pays.
 * 2. She enters the UPI transaction ID and uploads the payment screenshot.
 * 3. An admin checks it on /admin/payments and approves → her challenge becomes active.
 */
export function UpiPayment({
  fee,
  challengeId,
  referralCode,
  qrFiles,
  upiId,
  upiName,
  notice,
  onSubmitted,
}: {
  fee: number;
  challengeId: string;
  referralCode?: string;
  qrFiles: string[];
  upiId: string;
  upiName: string;
  notice?: string | null;
  onSubmitted: () => void;
}) {
  const supabase = getSupabaseBrowserClient();
  const [utr, setUtr] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  // Try each file name in turn (upi-qr.jpeg → .jpg → .png) until one loads.
  const [qrIndex, setQrIndex] = useState(0);
  const qrSrc = qrFiles[qrIndex] ?? null;
  const [error, setError] = useState<string | null>(null);

  const upiLink = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName || "FemRise")}&am=${fee}&cu=INR&tn=${encodeURIComponent("FemRise Mid-Winter Arc entry")}`
    : null;

  async function copyUpi() {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the ID is visible anyway */
    }
  }

  function pickProof(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("Please upload an image (screenshot) of the payment.");
    if (f.size > 8 * 1024 * 1024) return setError("Screenshot must be under 8 MB.");
    setError(null);
    setProof(f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!supabase) return setError("Registration isn't connected yet. Add your Supabase keys (see README).");
    const clean = utr.replace(/\s/g, "");
    if (!/^[A-Za-z0-9]{10,22}$/.test(clean)) return setError("Enter the 12-digit UPI transaction ID shown in your payment app.");
    if (!proof) return setError("Please upload the payment screenshot.");

    setBusy(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setBusy(false);
      return setError("Your session expired. Please log in again.");
    }
    const ext = proof.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${auth.user.id}/registration-${Date.now()}.${ext}`;
    const up = await supabase.storage.from("payment-proofs").upload(path, proof, { contentType: proof.type });
    if (up.error) {
      setBusy(false);
      return setError(`Screenshot upload failed: ${up.error.message}`);
    }
    const { error: rpcError } = await supabase.rpc("submit_upi_payment", {
      p_challenge: challengeId,
      p_utr: clean,
      p_proof_path: path,
      p_referral_code: referralCode || null,
    });
    setBusy(false);
    if (rpcError) return setError(rpcError.message);
    onSubmitted();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {notice && <p className="rounded-[12px] border-2 border-fr-red bg-fr-red/10 p-4 text-[14px] font-medium text-fr-red">{notice}</p>}

      <div className="card-pop relative p-5 sm:p-6">
        <span className="tape" />
        <div className="flex items-end justify-between border-b-2 border-dashed border-ink/30 pb-4">
          <span className="font-bold text-fr-charcoal">Entry fee</span>
          <span className="h-display text-5xl">₹{fee}</span>
        </div>

        <ol className="mt-4 space-y-1.5 text-[14px] font-medium text-fr-charcoal">
          <li>
            <b className="text-ink">1.</b> Scan the QR with GPay (or any UPI app) and pay exactly <b className="text-ink">₹{fee}</b>.
          </li>
          <li>
            <b className="text-ink">2.</b> Copy the <b className="text-ink">UPI transaction ID</b> from the payment receipt.
          </li>
          <li>
            <b className="text-ink">3.</b> Paste it below and upload the screenshot.
          </li>
        </ol>

        <div className="mt-5 flex flex-col items-center gap-4">
          {qrSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrSrc} alt={`UPI QR code to pay ₹${fee}`} className="w-full max-w-[260px] rounded-[12px] border-2 border-ink bg-white p-2"
              onError={() => setQrIndex((i) => i + 1)}
            />
          ) : (
            <p className="w-full rounded-[12px] border-2 border-dashed border-ink bg-white p-6 text-center text-[14px] font-medium">
              QR code coming soon — pay to the UPI ID below.
            </p>
          )}

          {upiId && (
            <button type="button" onClick={copyUpi} className="flex items-center gap-2 rounded-full border-2 border-ink bg-white px-4 py-2 text-[14px] font-bold">
              {upiId}
              {copied ? <Check className="h-4 w-4 text-fr-green" /> : <Copy className="h-4 w-4" />}
            </button>
          )}

          {upiLink && (
            <a href={upiLink} className="btn-yellow w-full py-3.5 sm:hidden">
              <Smartphone className="h-4 w-4" /> Pay ₹{fee} with UPI app
            </a>
          )}
        </div>
      </div>

      <label className="block">
        <span className={labelClass}>UPI transaction ID (UTR)</span>
        <input
          required
          inputMode="numeric"
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
          className={inputClass}
          placeholder="e.g. 412345678901"
          autoComplete="off"
        />
        <span className="mt-1 block text-[12px] text-fr-muted">In GPay: open the payment → &quot;UPI transaction ID&quot; (12 digits).</span>
      </label>

      <div>
        <span className={labelClass}>Payment screenshot</span>
        <label
          className={clsx(
            "flex cursor-pointer items-center gap-3 rounded-[12px] border-2 border-dashed border-ink p-4 transition",
            proof ? "bg-fr-softgreen" : "bg-white hover:bg-fr-cream",
          )}
        >
          <ImageUp className="h-5 w-5 shrink-0" />
          <span className="truncate text-[14px] font-bold">{proof ? proof.name : "Upload screenshot"}</span>
          <input type="file" accept="image/*" className="sr-only" onChange={pickProof} />
        </label>
      </div>

      {error && <p className="rounded-[10px] border-2 border-fr-red bg-fr-red/10 p-3 text-sm font-medium text-fr-red">{error}</p>}

      <button disabled={busy} className="btn-primary w-full py-4 disabled:opacity-60">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit payment for verification
      </button>
      <p className="text-center text-[13px] text-fr-muted">Our team checks every payment. Your challenge activates once it&apos;s verified.</p>
    </form>
  );
}
