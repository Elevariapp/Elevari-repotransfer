import { PrismaClient } from '@prisma/client';
import {
  GLAMPING_WANA_PROPERTY,
  GLAMPING_WANA_SLUG,
  glampingWanaMediaSeedData,
} from './glamping-wana.js';

/**
 * Publishes the real "Glamping Waná" property (a listing, not the brand).
 * Unlike the demo seed it creates no demo accounts and no reviews.
 *
 * Usage: HOST_EMAIL=reserve@elevari.live npm run seed:property
 * HOST_EMAIL (default ADMIN_EMAIL) must already exist (see create-admin).
 */
const prisma = new PrismaClient();

async function main() {
  const hostEmail = (process.env.HOST_EMAIL ?? process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  if (!hostEmail) throw new Error('HOST_EMAIL (or ADMIN_EMAIL) is required');

  const host = await prisma.user.findUnique({ where: { email: hostEmail } });
  if (!host) throw new Error(`User ${hostEmail} does not exist. Run create-admin first.`);

  const data = {
    title: GLAMPING_WANA_PROPERTY.title,
    description: GLAMPING_WANA_PROPERTY.description,
    pricePerNight: GLAMPING_WANA_PROPERTY.pricePerNight,
    maxGuests: GLAMPING_WANA_PROPERTY.maxGuests,
    status: 'published' as const,
    city: GLAMPING_WANA_PROPERTY.city,
    country: GLAMPING_WANA_PROPERTY.country,
    latitude: GLAMPING_WANA_PROPERTY.latitude,
    longitude: GLAMPING_WANA_PROPERTY.longitude,
    amenities: GLAMPING_WANA_PROPERTY.amenities,
    hostId: host.id,
  };

  const property = await prisma.property.upsert({
    where: { slug: GLAMPING_WANA_SLUG },
    update: data,
    create: { slug: GLAMPING_WANA_SLUG, ...data },
  });

  await prisma.propertyMedia.deleteMany({ where: { propertyId: property.id } });
  await prisma.propertyMedia.createMany({
    data: glampingWanaMediaSeedData().map((m) => ({ propertyId: property.id, ...m })),
  });

  console.log(`Property published: ${property.slug} (host ${hostEmail})`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
