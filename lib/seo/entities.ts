export type SeoEntity = {
  id: string;
  type: 'Property' | 'Collection' | 'Location';
  name: string;
  slug?: string;
  canonical: string;
  updatedAt?: string;
};

export const BRAND_NAME = 'Elevari';
export const BRAND_SITE_NAME = 'Elevari';
