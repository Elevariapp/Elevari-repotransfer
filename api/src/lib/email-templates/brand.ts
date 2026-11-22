export const EMAIL_BRAND = {
  companyName: 'Elevari S.A.S',
  companyNIT: '902088849',
  companyAddress: 'CR 5 NO. 16 14 OF 711 ED EL GLOBO, BOGOTÁ, D.C, código postal 111711',
  logoUrl: 'https://raw.githubusercontent.com/Elevariapp/Elevari-repotransfer/b-main/public/brand/logo-concept-4-blend.svg',
  primaryColor: '#F59E0B',
  secondaryColor: '#0F172A',
  accentColor: '#FCD34D',
  buttonBackground: '#F59E0B',
  buttonText: '#FFFFFF',
  linkColor: '#F59E0B',
  footerBackground: '#0F172A',
  footerText: '#F1F5F9',
  supportEmail: 'soporte@elevari.com',
  whatsappPhone: '+57 3232688534',
} as const;

export type EmailBrand = typeof EMAIL_BRAND;