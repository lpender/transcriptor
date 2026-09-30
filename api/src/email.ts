// One door for mail. With RESEND_API_KEY set, Resend sends it; without (dev,
// tests) the message is logged and returned so a test can read the link.

export interface Mail { to: string; subject: string; text: string }

export async function send(env: { RESEND_API_KEY?: string; MAIL_FROM?: string }, mail: Mail): Promise<{ sent: boolean }> {
  if (!env.RESEND_API_KEY) {
    console.log(`[mail] to ${mail.to}: ${mail.subject}\n${mail.text}`);
    return { sent: false };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM ?? 'Tablework <noreply@tablework.com>', to: mail.to, subject: mail.subject, text: mail.text }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`);
  return { sent: true };
}
