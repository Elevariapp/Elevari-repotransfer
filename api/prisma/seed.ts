import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  GLAMPING_WANA_PROPERTY,
  GLAMPING_WANA_SLUG,
  glampingWanaMediaSeedData,
} from './glamping-wana.js';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'wana12345';

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const host = await prisma.user.upsert({
    where: { email: 'host@wana.local' },
    update: { passwordHash, role: 'host', name: 'Glamping Waná' },
    create: {
      email: 'host@wana.local',
      name: 'Glamping Waná',
      role: 'host',
      passwordHash,
    },
  });

  const guest = await prisma.user.upsert({
    where: { email: 'guest@wana.local' },
    update: { passwordHash, role: 'guest' },
    create: {
      email: 'guest@wana.local',
      name: 'Demo Guest',
      role: 'guest',
      passwordHash,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@wana.local' },
    update: { passwordHash, role: 'admin' },
    create: {
      email: 'admin@wana.local',
      name: 'Waná Admin',
      role: 'admin',
      passwordHash,
    },
  });

  // Slug antiguo de demo — reemplazado por Glamping Waná
  await prisma.property.deleteMany({ where: { slug: 'domo-bosque-sereno' } });

  const property = await prisma.property.upsert({
    where: { slug: GLAMPING_WANA_SLUG },
    update: {
      title: GLAMPING_WANA_PROPERTY.title,
      description: GLAMPING_WANA_PROPERTY.description,
      pricePerNight: GLAMPING_WANA_PROPERTY.pricePerNight,
      maxGuests: GLAMPING_WANA_PROPERTY.maxGuests,
      status: 'published',
      city: GLAMPING_WANA_PROPERTY.city,
      country: GLAMPING_WANA_PROPERTY.country,
      latitude: GLAMPING_WANA_PROPERTY.latitude,
      longitude: GLAMPING_WANA_PROPERTY.longitude,
      amenities: GLAMPING_WANA_PROPERTY.amenities,
      hostId: host.id,
    },
    create: {
      slug: GLAMPING_WANA_SLUG,
      title: GLAMPING_WANA_PROPERTY.title,
      description: GLAMPING_WANA_PROPERTY.description,
      pricePerNight: GLAMPING_WANA_PROPERTY.pricePerNight,
      maxGuests: GLAMPING_WANA_PROPERTY.maxGuests,
      status: 'published',
      city: GLAMPING_WANA_PROPERTY.city,
      country: GLAMPING_WANA_PROPERTY.country,
      latitude: GLAMPING_WANA_PROPERTY.latitude,
      longitude: GLAMPING_WANA_PROPERTY.longitude,
      amenities: GLAMPING_WANA_PROPERTY.amenities,
      hostId: host.id,
    },
  });

  await prisma.propertyMedia.deleteMany({ where: { propertyId: property.id } });
  await prisma.propertyMedia.createMany({
    data: glampingWanaMediaSeedData().map((m) => ({
      propertyId: property.id,
      ...m,
    })),
  });

  await prisma.review.deleteMany({ where: { propertyId: property.id } });
  await prisma.review.createMany({
    data: [
      {
        propertyId: property.id,
        rating: 5,
        comment: 'Un lugar mágico en Sutatausa. El cielo de noche es increíble.',
        isVisible: true,
      },
      {
        propertyId: property.id,
        rating: 5,
        comment: 'Perfecto para desconectar cerca de Cucunubá. Volveremos.',
        isVisible: true,
      },
    ],
  });

  console.log('Seed complete:');
  console.log({
    hostId: host.id,
    guestId: guest.id,
    adminId: admin.id,
    propertySlug: property.slug,
    location: 'Sutatausa, Cucunubá, Cundinamarca',
    demoPassword: DEMO_PASSWORD,
    accounts: {
      guest: 'guest@wana.local',
      host: 'host@wana.local',
      admin: 'admin@wana.local',
    },
    photos: 'Coloca JPG en public/properties/glamping-wana/ (ver scripts/import-glamping-photos.sh)',
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
