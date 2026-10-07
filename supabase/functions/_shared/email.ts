// Transactional email through Resend (https://resend.com). Disabled when not configured.

export interface Email {
  to: string;
  subject: string;
  html: string;
  headers?: Record<string, string>;
}

export function emailConfigured(): boolean {
  return Boolean(Deno.env.get("RESEND_API_KEY") && Deno.env.get("EMAIL_FROM"));
}

export async function sendEmails(emails: Email[]): Promise<number> {
  if (!emailConfigured() || emails.length === 0) return 0;
  const key = Deno.env.get("RESEND_API_KEY")!;
  const from = Deno.env.get("EMAIL_FROM")!;
  let sent = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const batch = emails.slice(i, i + 100).map((e) => ({ from, to: [e.to], subject: e.subject, html: e.html, headers: e.headers }));
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    });
    if (res.ok) sent += batch.length;
    else console.error("Resend error", res.status, await res.text());
  }
  return sent;
}
