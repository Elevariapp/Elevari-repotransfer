function maskEmail(value: string): string {
  const [local, domain] = value.split('@');
  if (!domain) return '[invalid-email]';
  const head = local.slice(0, 2);
  return `${head}***@${domain}`;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    if (process.env.NODE_ENV === 'development') {
      // Never log guest PII or message bodies.
      console.log('[email:mock]', {
        to: maskEmail(params.to),
        subject: params.subject,
        textLength: params.text.length,
        hasHtml: Boolean(params.html),
      });
    }
    return { sent: false, reason: 'RESEND_API_KEY not configured' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? 'Eleveri <reservas@eleveri.app>',
      to: params.to,
      subject: params.subject,
      text: params.text,
      ...(params.html ? { html: params.html } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    console.error('[email:resend]', res.status, err);
    return { sent: false, reason: err || `HTTP ${res.status}` };
  }

  return { sent: true };
}

export function publicSiteUrl(): string {
  return (
    process.env.PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000'
  );
}
