import { EMAIL_BRAND } from './email-templates/brand';

export const EMAIL_SENDER = {
  name: EMAIL_BRAND.companyName,
  email: 'reserve@elevari.live',
};

export function getEmailBrand() {
  return EMAIL_BRAND;
}