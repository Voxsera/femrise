"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, Clock, Loader2, Lock, Globe } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { inputClass, labelClass } from "@/components/ui/AuthShell";
import { SPORTS } from "@/lib/defaults";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { GoogleButton } from "./GoogleButton";
import { UpiPayment } from "./UpiPayment";

type Step = "account" | "profile" | "payment" | "review" | "welcome" | "confirm-email";

const USERNAME_RE = /^[a-z0-9._]{3,24}$/;

export type UpiSettings = { qrFiles: string[]; upiId: string; upiName: string };

export function JoinFlow({
  fee,
  referralCode,
  supabaseReady,
  challengeId,
  upi,
}: {
  fee: number;
  referralCode: string;
  supabaseReady: boolean;
  challengeId: string;
  upi: UpiSettings;
}) {
  const supabase = getSupabaseBrowserClient();
  const [step, setStep] = useState<Step>("account");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [payNotice, setPayNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    city: "",
    sport: "",
    privacy: "public" as "public" | "private",
    referral: referralCode,
  });

  // Already signed in? Skip straight to payment (or welcome if already active).
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;
      const [{ data: profile }, { data: contact }, { data: p }, { data: lastPay }] = await Promise.all([
        supabase.from("profiles").select("full_name, username, city, primary_sport, privacy, onboarded").eq("id", user.id).maybeSingle(),
        supabase.from("profile_contacts").select("phone").eq("user_id", user.id).maybeSingle(),
        supabase.from("challenge_participants").select("status").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("payments")
          .select("status, failure_reason")
          .eq("user_id", user.id)
          .eq("payment_type", "registration")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      setUserId(user.id);
      setForm((f) => ({
        ...f,
        email: user.email ?? f.email,
        fullName: profile?.full_name || (user.user_metadata?.full_name as string | undefined) || f.fullName,
        username: profile?.onboarded ? profile.username : f.username,
        phone: contact?.phone ?? f.phone,
        city: profile?.city ?? f.city,
        sport: profile?.primary_sport ?? f.sport,
        privacy: (profile?.privacy as "public" | "private" | undefined) ?? f.privacy,
      }));
      // Google sign-ups land here without challenge details yet.
      if (profile && !profile.onboarded) return setStep("profile");
      if (p && p.status !== "pending_payment") return setStep("welcome");
      if (lastPay?.status === "submitted") return setStep("review");
      if (lastPay?.status === "rejected")
        setPayNotice(`Your last payment couldn't be verified: ${lastPay.failure_reason ?? "please try again"}. Please pay again or contact us.`);
      setStep("payment");
    });
  }, [supabase]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: k === "username" ? e.target.value.toLowerCase().replace(/\s/g, "") : e.target.value }));

  function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return setError("Profile photo must be under 5 MB.");
    setAvatar(f);
    setAvatarPreview(URL.createObjectURL(f));
  }

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!supabase) return setError("Sign-up isn't connected yet. Add your Supabase keys to .env.local (see README).");
    if (!USERNAME_RE.test(form.username)) return setError("Username: 3–24 characters, lowercase letters, numbers, dots or underscores.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (!form.sport) return setError("Choose your primary sport.");

    setBusy(true);
    const { data: taken } = await supabase.from("profiles").select("id").eq("username", form.username).maybeSingle();
    if (taken) {
      setBusy(false);
      return setError("That username is taken. Try another one.");
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          username: form.username,
          phone: form.phone,
          city: form.city,
          primary_sport: form.sport,
          privacy: form.privacy,
        },
      },
    });
    if (signUpError || !data.user) {
      setBusy(false);
      return setError(signUpError?.message ?? "Could not create your account.");
    }

    if (!data.session) {
      // Email confirmation is on in Supabase — user must confirm, then log in to pay.
      setBusy(false);
      return setStep("confirm-email");
    }

    await uploadAvatar(data.user.id);
    setBusy(false);
    setStep("payment");
  }

  async function uploadAvatar(uid: string) {
    if (!supabase || !avatar) return;
    const ext = avatar.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${uid}/avatar.${ext}`;
    const up = await supabase.storage.from("avatars").upload(path, avatar, { upsert: true, contentType: avatar.type });
    if (!up.error) await supabase.from("profiles").update({ avatar_path: path }).eq("id", uid);
  }

  /** Google (or any OAuth) users: save the challenge details the provider doesn't give us. */
  async function completeProfile(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!supabase || !userId) return setError("Your session expired. Please sign in again.");
    if (!USERNAME_RE.test(form.username)) return setError("Username: 3–24 characters, lowercase letters, numbers, dots or underscores.");
    if (!form.sport) return setError("Choose your primary sport.");
    setBusy(true);
    const { data: taken } = await supabase.from("profiles").select("id").eq("username", form.username).neq("id", userId).maybeSingle();
    if (taken) {
      setBusy(false);
      return setError("That username is taken. Try another one.");
    }
    const { error: pErr } = await supabase
      .from("profiles")
      .update({
        full_name: form.fullName,
        username: form.username,
        city: form.city,
        primary_sport: form.sport,
        privacy: form.privacy,
        onboarded: true,
      })
      .eq("id", userId);
    if (pErr) {
      setBusy(false);
      return setError(pErr.message);
    }
    await supabase.from("profile_contacts").update({ phone: form.phone }).eq("user_id", userId);
    await uploadAvatar(userId);
    setBusy(false);
    setStep("payment");
  }


  return (
    <div>
      {!supabaseReady && (
        <p className="mb-8 rounded-[12px] border-2 border-dashed border-ink bg-fr-softblue p-4 text-[14px] font-medium">
          Demo mode: sign-up and payments activate once Supabase and Razorpay keys are added.
        </p>
      )}

      <Steps step={step} />

      <AnimatePresence mode="wait">
        {step === "account" && (
          <motion.form key="account" onSubmit={createAccount} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <GoogleButton next={`/join${form.referral ? `?ref=${encodeURIComponent(form.referral)}` : ""}`} onError={setError} />
            <div className="flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.14em] text-fr-muted">
              <span className="h-[2px] flex-1 bg-ink/10" /> or sign up with email <span className="h-[2px] flex-1 bg-ink/10" />
            </div>
            <div className="flex items-center gap-4">
              <label className="relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-ink bg-fr-cream transition hover:-rotate-3 hover:bg-fr-yellow">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-6 w-6" />
                )}
                <input type="file" accept="image/*" className="sr-only" onChange={pickAvatar} />
              </label>
              <div>
                <p className="font-bold">Profile photo</p>
                <p className="text-[14px] text-fr-muted">Shown on the leaderboard &amp; community</p>
              </div>
            </div>

            <Field label="Full name">
              <input required value={form.fullName} onChange={set("fullName")} className={inputClass} autoComplete="name" />
            </Field>
            <Field label="Username">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-fr-muted">@</span>
                <input required value={form.username} onChange={set("username")} className={clsx(inputClass, "pl-9")} autoComplete="username" />
              </div>
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Email">
                <input required type="email" value={form.email} onChange={set("email")} className={inputClass} autoComplete="email" />
              </Field>
              <Field label="Phone">
                <input required type="tel" value={form.phone} onChange={set("phone")} className={inputClass} autoComplete="tel" placeholder="+91" />
              </Field>
            </div>
            <Field label="Password">
              <input required type="password" minLength={8} value={form.password} onChange={set("password")} className={inputClass} autoComplete="new-password" />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="City">
                <input required value={form.city} onChange={set("city")} className={inputClass} autoComplete="address-level2" />
              </Field>
              <Field label="Primary sport">
                <select required value={form.sport} onChange={set("sport")} className={inputClass}>
                  <option value="" disabled>
                    Choose…
                  </option>
                  {SPORTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div>
              <span className={labelClass}>Profile visibility</span>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["public", Globe, "Public", "Anyone in the challenge can see your snaps"],
                    ["private", Lock, "Private", "Only approved followers see your snaps"],
                  ] as const
                ).map(([v, Icon, t, d]) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setForm((f) => ({ ...f, privacy: v }))}
                    className={clsx(
                      "rounded-[12px] border-2 border-ink p-4 text-left transition",
                      form.privacy === v ? "bg-fr-yellow shadow-pop-sm" : "bg-white hover:-rotate-1",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <p className="mt-2 font-bold">{t}</p>
                    <p className={clsx("mt-1 text-xs", "text-fr-charcoal")}>{d}</p>
                  </button>
                ))}
              </div>
            </div>

            <Field label="Referral code (optional)">
              <input value={form.referral} onChange={set("referral")} className={inputClass} placeholder="Friend's username" />
            </Field>

            {error && <p className="rounded-[10px] border-2 border-fr-red bg-fr-red/10 p-3 text-sm font-medium text-fr-red">{error}</p>}

            <button disabled={busy} className="btn-primary w-full py-4 disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create account &amp; continue
            </button>
            <p className="text-center text-sm text-fr-muted">
              Already have an account?{" "}
              <Link href="/login?next=/join" className="font-bold text-ink underline decoration-fr-yellow decoration-[3px] underline-offset-4">
                Log in
              </Link>
            </p>
          </motion.form>
        )}

        {step === "profile" && (
          <motion.form key="profile" onSubmit={completeProfile} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <p className="rounded-[12px] border-2 border-ink bg-fr-softgreen p-4 text-[14px] font-medium">
              You&apos;re signed in{form.email ? ` as ${form.email}` : ""}. Finish your challenge profile to continue.
            </p>
            <div className="flex items-center gap-4">
              <label className="relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-ink bg-fr-cream transition hover:-rotate-3 hover:bg-fr-yellow">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-6 w-6" />
                )}
                <input type="file" accept="image/*" className="sr-only" onChange={pickAvatar} />
              </label>
              <div>
                <p className="font-bold">Profile photo</p>
                <p className="text-[14px] text-fr-muted">Shown on the leaderboard &amp; community</p>
              </div>
            </div>

            <Field label="Full name">
              <input required value={form.fullName} onChange={set("fullName")} className={inputClass} autoComplete="name" />
            </Field>
            <Field label="Username">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-fr-muted">@</span>
                <input required value={form.username} onChange={set("username")} className={clsx(inputClass, "pl-9")} autoComplete="username" />
              </div>
            </Field>
            <Field label="Phone">
              <input required type="tel" value={form.phone} onChange={set("phone")} className={inputClass} autoComplete="tel" placeholder="+91" />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="City">
                <input required value={form.city} onChange={set("city")} className={inputClass} autoComplete="address-level2" />
              </Field>
              <Field label="Primary sport">
                <select required value={form.sport} onChange={set("sport")} className={inputClass}>
                  <option value="" disabled>
                    Choose…
                  </option>
                  {SPORTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div>
              <span className={labelClass}>Profile visibility</span>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["public", Globe, "Public", "Anyone in the challenge can see your snaps"],
                    ["private", Lock, "Private", "Only approved followers see your snaps"],
                  ] as const
                ).map(([v, Icon, t, d]) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setForm((f) => ({ ...f, privacy: v }))}
                    className={clsx(
                      "rounded-[12px] border-2 border-ink p-4 text-left transition",
                      form.privacy === v ? "bg-fr-yellow shadow-pop-sm" : "bg-white hover:-rotate-1",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <p className="mt-2 font-bold">{t}</p>
                    <p className={clsx("mt-1 text-xs", "text-fr-charcoal")}>{d}</p>
                  </button>
                ))}
              </div>
            </div>

            <Field label="Referral code (optional)">
              <input value={form.referral} onChange={set("referral")} className={inputClass} placeholder="Friend's username" />
            </Field>

            {error && <p className="rounded-[10px] border-2 border-fr-red bg-fr-red/10 p-3 text-sm font-medium text-fr-red">{error}</p>}

            <button disabled={busy} className="btn-primary w-full py-4 disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save &amp; continue to payment
            </button>
          </motion.form>
        )}

        {step === "payment" && (
          <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <UpiPayment
              fee={fee}
              challengeId={challengeId}
              referralCode={form.referral || referralCode}
              qrFiles={upi.qrFiles}
              upiId={upi.upiId}
              upiName={upi.upiName}
              notice={payNotice}
              onSubmitted={() => {
                setPayNotice(null);
                setStep("review");
              }}
            />
          </motion.div>
        )}

        {step === "review" && (
          <motion.div key="review" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-pop relative bg-fr-softblue p-7 text-center">
            <span className="tape" />
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-white">
              <Clock className="h-7 w-7" strokeWidth={2.4} />
            </span>
            <p className="h-display mt-5 text-4xl">Payment received!</p>
            <p className="mt-3 text-[15px] text-fr-charcoal">
              We&apos;re verifying your ₹{fee} payment. This usually takes a few hours. Once it&apos;s confirmed you&apos;re officially in the
              Mid-Winter Arc — check back on this page anytime.
            </p>
            <p className="mt-4 font-hand text-3xl">see you on 1 Nov!</p>
            <Link href="/" className="btn-outline mt-6">
              Back to site
            </Link>
          </motion.div>
        )}

        {step === "confirm-email" && (
          <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-pop p-6">
            <p className="font-display text-2xl font-bold">Check your email</p>
            <p className="mt-3 text-fr-charcoal">
              We sent a confirmation link to <b>{form.email}</b>. Confirm it, then log in to complete your ₹{fee} entry.
            </p>
            <Link href="/login?next=/join" className="btn-primary mt-6">
              Go to log in
            </Link>
          </motion.div>
        )}

        {step === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: -1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="card-pop relative bg-fr-yellow p-8 text-center"
          >
            <span className="tape" />
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink bg-fr-green"
            >
              <Check className="h-8 w-8" strokeWidth={3} />
            </motion.span>
            <p className="h-display mt-6 text-5xl">Welcome to the challenge.</p>
            <p className="mt-3 font-hand text-3xl">your streak starts now!</p>
            <Link href="/dashboard" className="btn-primary mt-8">
              Go to my dashboard
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function Steps({ step }: { step: Step }) {
  const idx = step === "account" || step === "profile" || step === "confirm-email" ? 0 : step === "payment" || step === "review" ? 1 : 2;
  return (
    <ol className="mb-10 grid grid-cols-3 gap-3">
      {["Sign in", "Payment", "You\u2019re in"].map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={clsx(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink text-[13px] font-bold transition-colors",
              i <= idx ? "bg-fr-yellow" : "bg-white text-fr-muted",
            )}
          >
            {i < idx ? "✓" : i + 1}
          </span>
          <span className={clsx("text-[14px] font-bold", i > idx && "text-fr-muted")}>{s}</span>
        </li>
      ))}
    </ol>
  );
}
