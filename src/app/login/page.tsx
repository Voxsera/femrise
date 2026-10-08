import type { Metadata } from "next";
import { AuthShell } from "@/components/ui/AuthShell";
import { LoginForm } from "@/components/join/LoginForm";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Log in — Fem Rise Club" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return (
    <AuthShell kicker="Welcome back" title="Log in">
      <LoginForm next={safeNext} supabaseReady={isSupabaseConfigured} oauthError={error === "oauth"} />
    </AuthShell>
  );
}
