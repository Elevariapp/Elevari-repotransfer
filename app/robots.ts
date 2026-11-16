import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/checkout/', '/auth/', '/host/', '/_next/', '/private/'],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
