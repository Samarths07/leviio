import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Integration health check. Reports which env-based integrations are configured
 * on THIS deployment — booleans only, never the secret values. Visit
 * /api/health to confirm what's wired up (e.g. on the live site vs locally).
 */
export async function GET() {
  const has = (v?: string) => Boolean(v && v.trim().length > 0);

  const supabase = {
    url: has(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: has(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    // Needed for: client login provisioning, account deletion, payment fulfilment.
    serviceRoleKey: has(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
  const payments = {
    razorpayKeyId: has(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
    razorpayKeySecret: has(process.env.RAZORPAY_KEY_SECRET),
    razorpayWebhookSecret: has(process.env.RAZORPAY_WEBHOOK_SECRET),
  };
  const email = { resend: has(process.env.RESEND_API_KEY) };
  const ai = { anthropic: has(process.env.ANTHROPIC_API_KEY) };
  const site = { siteUrl: has(process.env.NEXT_PUBLIC_SITE_URL) };

  const ready = {
    database: supabase.url && supabase.anonKey,
    adminActions: supabase.serviceRoleKey, // login provisioning, delete account
    checkout: payments.razorpayKeyId && payments.razorpayKeySecret,
    webhookSafetyNet: payments.razorpayWebhookSecret,
    transactionalEmail: email.resend,
    aiDietPlans: ai.anthropic,
  };

  return NextResponse.json({ ok: true, ready, supabase, payments, email, ai, site });
}
