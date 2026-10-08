"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { inputClass, labelClass } from "@/components/ui/AuthShell";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { GoogleButton } from "./GoogleButton";

export function LoginForm({ next, supabaseReady, oauthError = false }: { next: string; supabaseReady: boolean; oauthError?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(oauthError ? "Google sign-in didn't complete. Please try again." : null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setError("Log in isn't connected yet. Add your Supabase keys to .env.local (see README).");
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) return setError(err.message);
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!supabaseReady && (
        <p className="rounded-[12px] border-2 border-dashed border-ink bg-fr-softblue p-4 text-[14px] font-medium">Demo mode: log in activates once Supabase keys are added.</p>
      )}
      <GoogleButton next={next} onError={setError} />
      <div className="flex items-center gap-3 py-1 text-[13px] font-bold uppercase tracking-[0.14em] text-fr-muted">
        <span className="h-[2px] flex-1 bg-ink/10" /> or <span className="h-[2px] flex-1 bg-ink/10" />
      </div>
      <label className="block">
        <span className={labelClass}>Email</span>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" />
      </label>
      <label className="block">
        <span className={labelClass}>Password</span>
        <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} autoComplete="current-password" />
      </label>
      {error && <p className="rounded-[10px] border-2 border-fr-red bg-fr-red/10 p-3 text-sm font-medium text-fr-red">{error}</p>}
      <button disabled={busy} className="btn-primary w-full py-4 disabled:opacity-60">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Log in
      </button>
      <p className="text-center text-sm text-fr-muted">
        New here?{" "}
        <Link href="/join" className="font-bold text-ink underline decoration-fr-yellow decoration-[3px] underline-offset-4">
          Join the challenge
        </Link>
      </p>
    </form>
  );
}
