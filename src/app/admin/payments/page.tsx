import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import clsx from "clsx";
import { Logo } from "@/components/brand/Logo";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reviewPayment } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Payments — Femrise! admin" };

const TABS = [
  ["submitted", "To verify"],
  ["paid", "Approved"],
  ["rejected", "Rejected"],
] as const;
type Tab = (typeof TABS)[number][0];

type PaymentRow = {
  id: string;
  user_id: string;
  status: string;
  amount_paise: number;
  utr: string | null;
  proof_path: string | null;
  failure_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  profiles: { username: string; full_name: string; city: string | null } | null;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) notFound();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/payments");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") notFound();

  const { status } = await searchParams;
  const tab: Tab = TABS.some(([k]) => k === status) ? (status as Tab) : "submitted";

  const [{ data: rows }, { count: pendingCount }] = await Promise.all([
    supabase
      .from("payments")
      .select("id, user_id, status, amount_paise, utr, proof_path, failure_reason, created_at, reviewed_at, profiles!payments_user_id_fkey(username, full_name, city)")
      .eq("provider", "upi")
      .eq("status", tab)
      .order("created_at", { ascending: tab === "submitted" })
      .limit(200),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("provider", "upi").eq("status", "submitted"),
  ]);
  const payments = (rows ?? []) as unknown as PaymentRow[];

  const userIds = Array.from(new Set(payments.map((p) => p.user_id)));
  const paths = payments.map((p) => p.proof_path).filter((p): p is string => Boolean(p));
  const [{ data: contacts }, { data: signed }] = await Promise.all([
    userIds.length ? supabase.from("profile_contacts").select("user_id, email, phone").in("user_id", userIds) : Promise.resolve({ data: [] }),
    paths.length ? supabase.storage.from("payment-proofs").createSignedUrls(paths, 60 * 60) : Promise.resolve({ data: [] }),
  ]);
  const contactBy = new Map((contacts ?? []).map((c: { user_id: string; email: string; phone: string | null }) => [c.user_id, c]));
  const urlBy = new Map((signed ?? []).map((s: { path: string | null; signedUrl: string | null }) => [s.path, s.signedUrl]));

  return (
    <div className="min-h-screen pb-20">
      <header className="border-b-2 border-ink bg-fr-warm">
        <div className="container-x flex h-[72px] items-center justify-between">
          <Logo size={52} />
          <span className="rounded-full border-2 border-ink bg-fr-yellow px-3 py-1 text-[13px] font-bold">Admin · Payments</span>
        </div>
      </header>

      <main className="container-x max-w-4xl pt-8">
        <h1 className="h-display text-4xl sm:text-5xl">UPI payments</h1>
        <p className="mt-2 text-[15px] text-fr-charcoal">
          Match the <b>UTR</b> and amount with your GPay / bank statement, then approve. Approving activates the participant.
        </p>

        <nav className="mt-6 flex flex-wrap gap-2">
          {TABS.map(([k, label]) => (
            <Link
              key={k}
              href={`/admin/payments?status=${k}`}
              className={clsx(
                "rounded-full border-2 border-ink px-4 py-1.5 text-[14px] font-bold",
                tab === k ? "bg-ink text-white" : "bg-white hover:bg-fr-cream",
              )}
            >
              {label}
              {k === "submitted" && (pendingCount ?? 0) > 0 && (
                <span className="ml-2 rounded-full bg-fr-yellow px-2 text-ink">{pendingCount}</span>
              )}
            </Link>
          ))}
        </nav>

        {payments.length === 0 && (
          <p className="card-pop mt-8 p-6 text-center font-bold">Nothing here {tab === "submitted" ? "— all payments are reviewed 🎉" : "yet"}.</p>
        )}

        <ul className="mt-8 space-y-5">
          {payments.map((p) => {
            const c = contactBy.get(p.user_id);
            const proof = p.proof_path ? urlBy.get(p.proof_path) : null;
            return (
              <li key={p.id} className="card-pop grid gap-5 bg-white p-5 sm:grid-cols-[1fr_180px]">
                <div className="min-w-0">
                  <p className="font-display text-xl font-bold">
                    {p.profiles?.full_name ?? "—"} <span className="font-sans text-[15px] font-medium text-fr-muted">@{p.profiles?.username}</span>
                  </p>
                  <p className="mt-1 text-[14px] text-fr-charcoal">
                    {[c?.phone, c?.email, p.profiles?.city].filter(Boolean).join(" · ")}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-[14px] sm:grid-cols-3">
                    <div>
                      <dt className="text-[12px] font-bold uppercase tracking-[0.12em] text-fr-muted">UTR</dt>
                      <dd className="break-all font-mono font-bold">{p.utr}</dd>
                    </div>
                    <div>
                      <dt className="text-[12px] font-bold uppercase tracking-[0.12em] text-fr-muted">Amount</dt>
                      <dd className="font-bold">₹{p.amount_paise / 100}</dd>
                    </div>
                    <div>
                      <dt className="text-[12px] font-bold uppercase tracking-[0.12em] text-fr-muted">Submitted</dt>
                      <dd className="font-bold">{fmt(p.created_at)}</dd>
                    </div>
                  </dl>
                  {p.failure_reason && <p className="mt-3 text-[14px] font-medium text-fr-red">Reason: {p.failure_reason}</p>}

                  {p.status === "submitted" && (
                    <div className="mt-5 flex flex-wrap items-end gap-3">
                      <form action={reviewPayment}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="decision" value="approve" />
                        <button className="btn-primary px-6 py-2.5">Approve</button>
                      </form>
                      <form action={reviewPayment} className="flex flex-1 flex-wrap gap-2">
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="decision" value="reject" />
                        <input name="note" placeholder="Reason (e.g. amount not received)" className="field min-w-[180px] flex-1 py-2" />
                        <button className="btn-outline px-5 py-2.5">Reject</button>
                      </form>
                    </div>
                  )}
                </div>

                {proof ? (
                  <a href={proof} target="_blank" rel="noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={proof} alt="Payment screenshot" className="max-h-72 w-full rounded-[10px] border-2 border-ink object-contain" />
                    <span className="mt-1 block text-center text-[12px] font-bold underline">Open full size</span>
                  </a>
                ) : (
                  <p className="text-[13px] text-fr-muted">No screenshot</p>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
