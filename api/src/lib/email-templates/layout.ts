import { EMAIL_BRAND, escHtml, siteUrl } from './brand.js';

export interface EmailLayoutOptions {
  preheader: string;
  eyebrow?: string;
  title: string;
  bodyHtml: string;
  cta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  footerNote?: string;
}

function renderButton(href: string, label: string, primary = true): string {
  const bg = primary ? EMAIL_BRAND.colors.champagne : EMAIL_BRAND.colors.white;
  const color = primary ? EMAIL_BRAND.colors.black : EMAIL_BRAND.colors.charcoal;
  const border = primary ? EMAIL_BRAND.colors.champagne : EMAIL_BRAND.colors.border;

  return `\n    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:28px auto 0;">\n      <tr>\n        <td style="border-radius:999px;background:${bg};border:1px solid ${border};">\n          <a href="${escHtml(href)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:${color};text-decoration:none;letter-spacing:0.02em;">\n            ${escHtml(label)}\n          </a>\n        </td>\n      </tr>\n    </table>`;
}

export function renderEmailLayout(options: EmailLayoutOptions): string {
  const url = siteUrl();
  const preheader = escHtml(options.preheader);
  const eyebrow = options.eyebrow ? escHtml(options.eyebrow) : '';
  const title = escHtml(options.title);
  const footerNote = options.footerNote\n    ? `<p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${EMAIL_BRAND.colors.muted};">${escHtml(options.footerNote)}</p>`\n    : '';

  const ctaBlock = options.cta ? renderButton(options.cta.href, options.cta.label, true) : '';
  const secondaryCtaBlock = options.secondaryCta\n    ? `<p style="margin:18px 0 0;text-align:center;">\n        <a href="${escHtml(options.secondaryCta.href)}" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:${EMAIL_BRAND.colors.charcoal};text-decoration:underline;">\n          ${escHtml(options.secondaryCta.label)}\n        </a>\n      </p>`\n    : '';

  return `<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <meta http-equiv="X-UA-Compatible" content="IE=edge">\n  <title>${title}</title>\n  <!--[if mso]><style>body,table,td{font-family:Arial,Helvetica,sans-serif!important;}</style><![endif]-->\n</head>\n<body style="margin:0;padding:0;background:${EMAIL_BRAND.colors.sand};-webkit-text-size-adjust:100%;">\n  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>\n  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${EMAIL_BRAND.colors.sand};">\n    <tr>\n      <td align="center" style="padding:32px 16px;">\n        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">\n          <tr>\n            <td style="border-radius:20px 20px 0 0;background:${EMAIL_BRAND.colors.black};padding:24px 32px 20px;text-align:center;">\n              <a href="${escHtml(url)}" target="_blank" style="text-decoration:none;display:block;">\n                <img src="${escHtml(EMAIL_BRAND.logoUrl)}" alt="${EMAIL_BRAND.name}" style="display:block;margin:0 auto;width:48px;height:48px;border-radius:12px;" width="48" height="48"/>\n              </a>\n              <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:600;letter-spacing:0.02em;color:${EMAIL_BRAND.colors.white};">${EMAIL_BRAND.name}</p>\n              <p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_BRAND.colors.champagneLight};">${EMAIL_BRAND.tagline}</p>\n            </td>\n          </tr>\n          <tr>\n            <td style="background:${EMAIL_BRAND.colors.cream};padding:36px 32px 32px;border-left:1px solid ${EMAIL_BRAND.colors.border};border-right:1px solid ${EMAIL_BRAND.colors.border};">\n              ${eyebrow ? `<p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${EMAIL_BRAND.colors.champagne};">${eyebrow}</p>` : ''}\n              <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;font-weight:500;color:${EMAIL_BRAND.colors.charcoal};">${title}</h1>\n              <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${EMAIL_BRAND.colors.charcoal};">\n                ${options.bodyHtml}\n              </div>\n              ${ctaBlock}\n              ${secondaryCtaBlock}\n              ${footerNote}\n            </td>\n          </tr>\n          <tr>\n            <td style="border-radius:0 0 20px 20px;background:${EMAIL_BRAND.colors.cream};padding:0 32px 28px;border:1px solid ${EMAIL_BRAND.colors.border};border-top:none;">\n              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid ${EMAIL_BRAND.colors.border};">\n                <tr>\n                  <td style="padding-top:22px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;color:${EMAIL_BRAND.colors.muted};text-align:center;">\n                    <p style="margin:0 0 8px;">¿Necesitas ayuda? Escríbenos a <a href="mailto:${EMAIL_BRAND.supportEmail}" style="color:${EMAIL_BRAND.colors.charcoal};">${EMAIL_BRAND.supportEmail}</a></p>\n                    <p style="margin:0 0 8px;">\n                      <a href="${escHtml(url)}/legal/faq" style="color:${EMAIL_BRAND.colors.muted};text-decoration:underline;">FAQ</a>\n                      &nbsp;·&nbsp;\n                      <a href="${escHtml(url)}/legal/privacy" style="color:${EMAIL_BRAND.colors.muted};text-decoration:underline;">Privacidad</a>\n                      &nbsp;·&nbsp;\n                      <a href="${escHtml(url)}/legal/terms" style="color:${EMAIL_BRAND.colors.muted};text-decoration:underline;">Términos</a>\n                    </p>\n                    <p style="margin:0;">© ${new Date().getFullYear()} ${EMAIL_BRAND.name} · Glamping Waná, Sutatausa/Cucunubá, Cundinamarca, Colombia. reserve@elevari.live</p>\n                  </td>\n                </tr>\n              </table>\n            </td>\n          </tr>\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>`;
}

export function renderInfoCard(rows: Array<{ label: string; value: string }>): string {
  const items = rows\n    .map(\n      (row) => `\n      <tr>\n        <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BRAND.colors.border};font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_BRAND.colors.muted};width:38%;vertical-align:top;">\n          ${escHtml(row.label)}\n        </td>\n        <td style="padding:10px 0 10px 12px;border-bottom:1px solid ${EMAIL_BRAND.colors.border};font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${EMAIL_BRAND.colors.charcoal};vertical-align:top;">\n          ${escHtml(row.value)}\n        </td>\n      </tr>`,\n    )\n    .join('');

  return `\n    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:22px 0 0;border:1px solid ${EMAIL_BRAND.colors.border};border-radius:14px;background:${EMAIL_BRAND.colors.white};overflow:hidden;">\n      <tr><td style="padding:4px 18px 8px;">${items}</td></tr>\n    </table>`;
}

export function renderHighlightBox(html: string): string {
  return `\n    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0 0;">\n      <tr>\n        <td style="padding:16px 18px;border-radius:14px;background:${EMAIL_BRAND.colors.sand};border:1px solid ${EMAIL_BRAND.colors.border};font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:${EMAIL_BRAND.colors.charcoal};">\n          ${html}\n        </td>\n      </tr>\n    </table>`;
}