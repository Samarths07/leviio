/**
 * Transactional email via Resend's REST API (no SDK dependency). Server-only.
 * No-ops safely when RESEND_API_KEY isn't set, so the app works without it.
 */
const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "Leviio <onboarding@resend.dev>";

export function emailConfigured(): boolean {
  return Boolean(KEY);
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!KEY) return { ok: false, error: "Email not configured" };
  if (!opts.to || !opts.to.includes("@")) return { ok: false, error: "Invalid recipient" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) return { ok: false, error: `Resend ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}
