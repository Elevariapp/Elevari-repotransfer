import { EMAIL_BRAND } from './brand';

export function emailLayout({ content, previewText }: { content: string; previewText: string }): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${EMAIL_BRAND.companyName}</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#F8FAFC;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px; margin:0 auto; background-color:#FFFFFF;">
    <!-- Header -->
    <tr>
      <td align="center" style="padding:32px 24px; background-color:#0F172A;">
        <img src="${EMAIL_BRAND.logoUrl}" alt="${EMAIL_BRAND.companyName}" width="48" height="48" style="display:block; border-radius:8px;">
        <h1 style="margin:12px 0 0 0; font-size:24px; color:#FFFFFF; font-weight:700;">${EMAIL_BRAND.companyName}</h1>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:32px 24px; color:#334155; font-size:16px; line-height:1.6;">
        ${content}
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td align="center" style="padding:32px 24px; background-color:#0F172A; color:#F1F5F9; font-size:14px;">
        <p style="margin:0 0 8px 0; font-weight:600;">${EMAIL_BRAND.companyName}</p>
        <p style="margin:0 0 8px 0;">NIT: ${EMAIL_BRAND.companyNIT}</p>
        <p style="margin:0 0 8px 0;">${EMAIL_BRAND.companyAddress}</p>
        <p style="margin:0 0 16px 0;">
          <a href="mailto:${EMAIL_BRAND.supportEmail}" style="color:#FCD34D; text-decoration:none;">${EMAIL_BRAND.supportEmail}</a>
        </p>
        <p style="margin:0;">
          <a href="https://wa.me/${EMAIL_BRAND.whatsappPhone.replace('+', '')}" style="color:#FCD34D; text-decoration:none;">WhatsApp: ${EMAIL_BRAND.whatsappPhone}</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}