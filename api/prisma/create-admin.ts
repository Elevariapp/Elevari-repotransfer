import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Creates (or promotes) the first production admin.
 *
 * Usage (inside the api container):
 *   ADMIN_EMAIL=reserve@elevari.live ADMIN_PASSWORD='...' npm run create-admin
 *
 * An existing user keeps its password unless RESET_PASSWORD=true.
 */
const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL is required and must be a valid email');
  }
  if (email.endsWith('@elevari.local')) {
    throw new Error('Demo domain @elevari.local is not allowed for a real admin');
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing && process.env.RESET_PASSWORD !== 'true') {
    await prisma.user.update({ where: { email }, data: { role: 'admin' } });
    console.log(`Admin ready: ${email} (existing user promoted, password unchanged)`);
    return;
  }

  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD is required and must have at least 12 characters');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { role: 'admin', passwordHash },
    create: { email, name: 'Elevari Admin', role: 'admin', passwordHash },
  });
  console.log(`Admin ready: ${email}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
