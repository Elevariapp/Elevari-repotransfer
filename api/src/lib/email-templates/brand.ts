export const EMAIL_BRAND = {
  companyName: 'Elevari S.A.S',
  companyNIT: '902088849',
  companyAddress: 'CR 5 NO. 16 14 OF 711 ED EL GLOBO, BOGOTÁ, D.C, código postal 111711',
  logoUrl: 'https://raw.githubusercontent.com/Elevariapp/Elevari-repotransfer/b-main/public/brand/logo-concept-1-horizon.svg',
  primaryColor: '#D97706',
  secondaryColor: '#0F172A',
  accentColor: '#D97706',
  buttonBackground: '#D97706',
  buttonText: '#FFFFFF',
  linkColor: '#D97706',
  footerBackground: '#0F172A',
  footerText: '#FEF3C7',
  supportEmail: 'reserve@elevari.live',
  whatsappPhone: '+57 3232688534',
} as const;

export type EmailBrand = typeof EMAIL_BRAND;