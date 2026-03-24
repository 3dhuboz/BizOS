/**
 * Shared email helper for Cloudflare Pages Functions.
 * Pure fetch + Web Crypto — zero Node.js packages, CF Workers native.
 * Supports Amazon SES v2 HTTP API (SigV4 signed) and SendGrid HTTP API.
 */

const enc = (s: string) => new TextEncoder().encode(s);
const hex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
const sha256 = async (data: string) =>
  hex(await crypto.subtle.digest('SHA-256', enc(data)));
const importHmac = async (raw: ArrayBuffer | Uint8Array) =>
  crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
const hmac = async (key: CryptoKey, msg: string): Promise<ArrayBuffer> =>
  crypto.subtle.sign('HMAC', key, enc(msg));

async function sesHeaders(
  url: string, body: string, region: string, accessKey: string, secretKey: string
): Promise<Record<string, string>> {
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const amzDate = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
  const { host, pathname } = new URL(url);

  const payloadHash = await sha256(body);
  const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-date';
  const canonicalRequest = ['POST', pathname, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');

  const credScope = `${dateStamp}/${region}/ses/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credScope}\n${await sha256(canonicalRequest)}`;

  const kDate = await importHmac(await hmac(await importHmac(enc('AWS4' + secretKey)), dateStamp));
  const kRegion = await importHmac(await hmac(kDate, region));
  const kService = await importHmac(await hmac(kRegion, 'ses'));
  const kSigning = await importHmac(await hmac(kService, 'aws4_request'));
  const signature = hex(await hmac(kSigning, stringToSign));

  return {
    'Content-Type': 'application/json',
    'X-Amz-Date': amzDate,
    Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

export async function sendEmail(
  env: any,
  settings: any,
  to: string,
  subject: string,
  text: string,
  html: string
): Promise<{ messageId: string; provider: string }> {
  const fromEmail = settings?.fromEmail || env.SES_FROM_EMAIL || 'noreply@bizos.app';
  const fromName = settings?.fromName || env.SES_FROM_NAME || 'BizOS';

  // Primary: Amazon SES v2 HTTP API (fetch + Web Crypto SigV4 — no SDK needed)
  if (env.AWS_SES_ACCESS_KEY_ID && env.AWS_SES_SECRET_ACCESS_KEY) {
    const region = env.AWS_SES_REGION || 'ap-southeast-2';
    const url = `https://email.${region}.amazonaws.com/v2/email/outbound-emails`;
    const body = JSON.stringify({
      FromEmailAddress: `"${fromName}" <${fromEmail}>`,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Text: { Data: text, Charset: 'UTF-8' },
            Html: { Data: html, Charset: 'UTF-8' },
          },
        },
      },
    });
    const headers = await sesHeaders(url, body, region, env.AWS_SES_ACCESS_KEY_ID, env.AWS_SES_SECRET_ACCESS_KEY);
    const r = await fetch(url, { method: 'POST', headers, body });
    if (!r.ok) {
      const err = await r.text();
      throw new Error(`SES error ${r.status}: ${err.slice(0, 200)}`);
    }
    const data: any = await r.json().catch(() => ({}));
    return { messageId: data.MessageId || '', provider: 'ses' };
  }

  // Fallback: SendGrid HTTP API
  if (env.SENDGRID_API_KEY) {
    const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: fromName },
        subject,
        content: [
          { type: 'text/plain', value: text },
          { type: 'text/html', value: html },
        ],
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      throw new Error(`SendGrid error ${r.status}: ${err.slice(0, 200)}`);
    }
    return { messageId: '', provider: 'sendgrid' };
  }

  throw new Error('No email provider configured. Set AWS_SES_ACCESS_KEY_ID or SENDGRID_API_KEY in Cloudflare Pages environment variables.');
}
