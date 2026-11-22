import { EMAIL_BRAND } from './email-templates/brand.js';

export const EMAIL_SENDER = {
  name: EMAIL_BRAND.companyName,
  email: 'reserve@elevari.live',
};

export function getEmailBrand() {
  return EMAIL_BRAND;
}

export function publicSiteUrl(): string {
  return process.env.PUBLIC_SITE_URL ?? 'https://elevari.live';
}