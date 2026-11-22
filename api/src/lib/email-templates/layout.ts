import { EMAIL_BRAND } from './brand.js';

export function emailLayout({ content, previewText }: { content: string; previewText: string }): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${EMAIL_BRAND.companyName}</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#FEF3C7; background-image: linear-gradient(135deg, rgba(217, 119, 6, 0.12) 0%, rgba(15, 23, 42, 0.06) 100%);">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px; margin:0 auto; background-color:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 20px 60px rgba(15, 23, 42, 0.12);">
    <!-- Hero banner — mountain/nature background with premium amber gradient -->
    <tr>
      <td align="center" style="padding:0; background: linear-gradient(135deg, rgba(15, 23, 42, 0.55) 0%, rgba(15, 23, 42, 0.75) 100%), url('https://raw.githubusercontent.com/Elevariapp/Elevari-repotransfer/b-main/public/properties/glamping-wana/01-cover.jpeg'); background-size: cover; background-position: center; background-repeat: no-repeat; height:200px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td align="center" style="padding:40px 24px;">
              <img src="${EMAIL_BRAND.logoUrl}" alt="${EMAIL_BRAND.companyName}" width="48" height="48" style="display:block; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.3);">
              <h1 style="margin:16px 0 0 0; font-size:26px; color:#FFFFFF; font-weight:700; letter-spacing:-0.02em; text-shadow:0 2px 8px rgba(0,0,0,0.35);">${EMAIL_BRAND.companyName}</h1>
              <p style="margin:8px 0 0 0; font-size:14px; color:#FEF3C7; font-weight:500; text-shadow:0 1px 4px rgba(0,0,0,0.3);">Hospitalidad de montaña · Mountain hospitality</p>
            </td>
          </tr>
        </table>
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
          <a href="mailto:${EMAIL_BRAND.supportEmail}" style="color:#D97706; text-decoration:none; font-weight:600;">${EMAIL_BRAND.supportEmail}</a>
        </p>
        <p style="margin:0;">
          <a href="https://wa.me/${EMAIL_BRAND.whatsappPhone.replace('+', '')}" style="color:#D97706; text-decoration:none; font-weight:600;">WhatsApp: ${EMAIL_BRAND.whatsappPhone}</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
