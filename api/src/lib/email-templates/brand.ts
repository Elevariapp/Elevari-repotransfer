export const EMAIL_BRAND = {
  companyName: 'Elevari S.A.S',
  companyNIT: '902088849',
  companyAddress: 'CR 5 NO. 16 14 OF 711 ED EL GLOBO, BOGOTÁ, D.C, código postal 111711',
  // GitHub raw, not elevari.live: Cloudflare challenges mail image proxies (non-browser clients), so the logo would break.
  logoUrl: 'https://raw.githubusercontent.com/Elevariapp/Elevari-repotransfer/b-main/public/brand/icons/icon-128.png',
  primaryColor: '#C2410C',
  secondaryColor: '#0F172A',
  accentColor: '#C2410C',
  buttonBackground: '#C2410C',
  buttonText: '#FFFFFF',
  linkColor: '#C2410C',
  footerBackground: '#0F172A',
  footerText: '#FEF3C7',
  supportEmail: 'reserve@elevari.live',
  whatsappPhone: '+57 3232688534',
} as const;

export type EmailBrand = typeof EMAIL_BRAND;