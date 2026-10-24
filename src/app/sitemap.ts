import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base + '/', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: base + '/explore', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: base + '/trending', lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: base + '/channels', lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: base + '/communities', lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: base + '/auth/login', lastModified: new Date(), priority: 0.5 },
    { url: base + '/auth/register', lastModified: new Date(), priority: 0.5 },
  ];

  try {
    const posts = await prisma.post.findMany({
      where: { visibility: 'PUBLIC' },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 500,
    });
    const postRoutes: MetadataRoute.Sitemap = posts.map(p => ({
      url: base + '/post/' + p.id,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
    return [...staticRoutes, ...postRoutes];
  } catch {
    return staticRoutes;
  }
}
