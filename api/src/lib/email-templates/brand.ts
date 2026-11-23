export const EMAIL_BRAND = {
  brandName: 'Elevari',
  companyName: 'Elevari S.A.S',
  companyNIT: '902088849',
  companyAddress: 'CR 5 NO. 16 14 OF 711 ED EL GLOBO, BOGOTÁ, D.C, código postal 111711',
  // GitHub raw, not elevari.live: Cloudflare challenges mail image proxies (non-browser clients), so the logo would break.
  logoUrl: 'https://raw.githubusercontent.com/Elevariapp/Elevari-repotransfer/b-main/public/brand/icons/icon-128.png',
  // Flat 1200x400 render of the scene artwork (npm run scene:generate). Same hosting rule as the logo.
  bannerUrl: 'https://raw.githubusercontent.com/Elevariapp/Elevari-repotransfer/b-main/public/brand/email/banner.jpg',
  // Shown while images are blocked and in Outlook builds without VML; white text stays above 9:1 on it.
  bannerFallbackColor: '#7C2D12',
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