"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Approve / reject a UPI payment. The database function re-checks that the caller is an admin. */
export async function reviewPayment(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  const id = String(formData.get("id") ?? "");
  const approve = formData.get("decision") === "approve";
  const note = String(formData.get("note") ?? "").trim() || null;
  const { error } = await supabase.rpc("admin_review_upi_payment", { p_payment: id, p_approve: approve, p_note: note });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/payments");
}
