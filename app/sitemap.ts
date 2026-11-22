import type { MetadataRoute } from 'next';
import { wanaApi } from '@/lib/api-client';
import { siteUrl } from '@/lib/site-url';
import { COLLECTIONS } from '@/lib/seo/collections';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl(), lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: siteUrl('/properties'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: siteUrl('/legal/faq'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  const collectionRoutes: MetadataRoute.Sitemap = COLLECTIONS.map(c => ({
    url: siteUrl(c.canonical),
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  try {
    const { data } = await wanaApi.listProperties({ limit: 50 });
    const propertyRoutes: MetadataRoute.Sitemap = data.map((p) => ({
      url: siteUrl(`/properties/${p.slug}`),
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
    return [...staticRoutes, ...collectionRoutes, ...propertyRoutes];
  } catch {
    return [...staticRoutes, ...collectionRoutes];
  }
}
