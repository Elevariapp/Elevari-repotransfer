import { EMAIL_BRAND } from './brand.js';

const FONT_STACK = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Escapes user-controlled values (names, property titles…) before they go into HTML. */
export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** "Hola Ana," / "Hello Ana," — bilingual greeting that degrades gracefully without a name. */
export function emailGreeting(name?: string | null): string {
  const clean = name?.trim();
  const suffix = clean ? ` ${esc(clean)}` : '';
  return `<p style="margin:0 0 4px 0;">Hola${suffix},</p><p style="margin:0 0 16px 0; color:#64748B;">Hello${suffix},</p>`;
}

export function emailHeading(text: string): string {
  return `<h2 style="color:#0F172A; font-size:22px; line-height:1.3; margin:0 0 20px 0;">${esc(text)}</h2>`;
}

/** Spanish line followed by its English twin. Both are escaped, so interpolate raw values. */
export function emailBilingual(es: string, en: string, { muted = false }: { muted?: boolean } = {}): string {
  const color = muted ? 'color:#64748B; font-size:14px;' : '';
  return `<p style="margin:0 0 16px 0; ${color}">${esc(es)}<br/>${esc(en)}</p>`;
}

export function emailButton({ href, label }: { href: string; label: string }): string {
  return `<a href="${esc(href)}" style="display:inline-block; background-color:${EMAIL_BRAND.buttonBackground}; color:${EMAIL_BRAND.buttonText}; padding:14px 28px; text-decoration:none; border-radius:6px; font-weight:600; font-size:16px;">${esc(label)}</a>`;
}

/** Two-column label/value table; values are escaped here so callers pass raw strings. */
export function emailFacts(rows: Array<[label: string, value: string]>): string {
  const body = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:8px 12px 8px 0; color:#64748B; width:38%; vertical-align:top;">${esc(label)}</td>
        <td style="padding:8px 0; color:#0F172A; font-weight:600; word-break:break-word;">${esc(value)}</td>
      </tr>`,
    )
    .join('');
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px 0;">${body}</table>`;
}

/**
 * WhatsApp as a quiet text link with a small hairline glyph (no green, no button). The glyph is decorative:
 * the label names WhatsApp, so nothing reads twice when images are blocked. `onDark` is for the footer.
 */
export function emailWhatsAppLink({ onDark = false }: { onDark?: boolean } = {}): string {
  const phone = EMAIL_BRAND.whatsappPhone;
  const glyph = onDark ? EMAIL_BRAND.whatsappGlyphLightUrl : EMAIL_BRAND.whatsappGlyphUrl;
  const color = onDark ? 'color:#EA9A2E; text-decoration:none;' : `color:${EMAIL_BRAND.linkColor};`;
  return `<a href="https://wa.me/${phone.replace(/\D/g, '')}" style="${color} font-weight:600; white-space:nowrap;"><img src="${glyph}" alt="" width="18" height="18" style="display:inline-block; vertical-align:-4px; border:0; margin-right:6px;">WhatsApp ${phone}</a>`;
}

export function emailHelpLine(): string {
  return `<p style="margin-top:24px; color:#64748B; font-size:14px;">
      ¿Necesitas ayuda? Escríbenos.<br/>
      Need help? Message us.<br/>
      ${emailWhatsAppLink()}
    </p>`;
}

export function emailLayout({ content, previewText }: { content: string; previewText: string }): string {
  return `
<!DOCTYPE html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${EMAIL_BRAND.companyName}</title>
  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
</head>
<body style="margin:0; padding:0; font-family:${FONT_STACK}; background-color:#FEF3C7; background-image: linear-gradient(135deg, rgba(217, 119, 6, 0.12) 0%, rgba(15, 23, 42, 0.06) 100%);">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#FEF3C7; opacity:0;">${esc(previewText)}</div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px; margin:0 auto; background-color:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 20px 60px rgba(15, 23, 42, 0.12);">
    <!-- Hero: flat render of the Elevari scene (public/brand/email/banner.jpg) with live text on top.
         Email clients can't run SVG or animation, so this is the static member of the scene family.
         Layers: bgcolor (images blocked) < CSS background (most clients) < VML (Outlook for Windows). -->
    <tr>
      <td align="left" valign="middle" height="200" bgcolor="${EMAIL_BRAND.bannerFallbackColor}" background="${EMAIL_BRAND.bannerUrl}" style="height:200px; padding:0; background-color:${EMAIL_BRAND.bannerFallbackColor}; background-image:url('${EMAIL_BRAND.bannerUrl}'); background-size:cover; background-position:center; background-repeat:no-repeat;">
        <!--[if gte mso 9]>
        <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px; height:200px;">
          <v:fill type="frame" src="${EMAIL_BRAND.bannerUrl}" color="${EMAIL_BRAND.bannerFallbackColor}" />
          <v:textbox inset="0,0,0,0">
        <![endif]-->
        <div>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td valign="middle" height="200" style="height:200px; padding:0 32px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td valign="middle" style="padding:0 14px 0 0;">
                      <img src="${EMAIL_BRAND.logoUrl}" alt="" width="44" height="44" style="display:block; border:0; border-radius:10px; box-shadow:0 4px 14px rgba(28, 8, 3, 0.45);">
                    </td>
                    <td valign="middle">
                      <h1 style="margin:0; font-family:${FONT_STACK}; font-size:30px; line-height:1.1; color:#FFFFFF; font-weight:700; letter-spacing:-0.02em; text-shadow:0 2px 10px rgba(28, 8, 3, 0.5);">${EMAIL_BRAND.brandName}</h1>
                    </td>
                  </tr>
                </table>
                <p style="margin:14px 0 0 0; font-family:${FONT_STACK}; font-size:13px; line-height:1.45; color:#FEF3C7; font-weight:500; letter-spacing:0.02em; text-shadow:0 1px 6px rgba(28, 8, 3, 0.55);">Hospitalidad&nbsp;de&nbsp;montaña · Mountain&nbsp;hospitality</p>
              </td>
            </tr>
          </table>
        </div>
        <!--[if gte mso 9]>
          </v:textbox>
        </v:rect>
        <![endif]-->
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:32px 24px; color:#0F172A; font-size:16px; line-height:1.6;">
        ${content}
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td align="center" style="padding:32px 24px; background-color:#0F172A; color:#FEF3C7; font-size:14px; border-top:1px solid rgba(217, 119, 6, 0.25);">
        <p style="margin:0 0 8px 0; font-weight:600;">${EMAIL_BRAND.companyName}</p>
        <p style="margin:0 0 8px 0;">NIT: ${EMAIL_BRAND.companyNIT}</p>
        <p style="margin:0 0 8px 0;">${EMAIL_BRAND.companyAddress}</p>
        <p style="margin:0 0 16px 0;">
          <a href="mailto:${EMAIL_BRAND.supportEmail}" style="color:#EA9A2E; text-decoration:none; font-weight:600;">${EMAIL_BRAND.supportEmail}</a>
        </p>
        <p style="margin:0;">${emailWhatsAppLink({ onDark: true })}</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
