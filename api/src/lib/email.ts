import { EMAIL_BRAND } from './email-templates/brand';

export const EMAIL_SENDER = {
  name: EMAIL_BRAND.companyName,
  email: 'noreply@elevari.com',
};

export function getEmailBrand() {
  return EMAIL_BRAND;
}