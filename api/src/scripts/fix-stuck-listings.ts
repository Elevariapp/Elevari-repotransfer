/**
 * Unblocks listings that were created before automated moderation existed.
 *
 * Run it inside the API container (it uses the service's own DATABASE_URL, so no credentials
 * ever leave the server):
 *
 *   docker compose -f docker-compose.prod.yml exec -T api node dist/scripts/fix-stuck-listings.js --report
 *   docker compose -f docker-compose.prod.yml exec -T api node dist/scripts/fix-stuck-listings.js \
 *     --approve-pending-media --publish-drafts --apply
 *
 * Flags:
 *   --report                 (default) print what is stuck and why. Changes nothing.
 *   --approve-pending-media  approve media left in `pending` by the old human queue.
 *   --publish-drafts         publish drafts that have at least one usable photo.
 *   --verify-hosts a@b,c@d   mark those hosts verified (identity confirmed out of band).
 *   --apply                  actually write. Without it every mode is a dry run.
 *
 * Why a CLI and not an API call: a one-off data repair should not be reachable over HTTP, and it
 * keeps the audit trail in the deploy log.
 */
import { prisma } from '../lib/prisma.js';

const argv = process.argv.slice(2);
const has = (flag: string) => argv.includes(flag);
const value = (flag: string) => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
};

const apply = has('--apply');
const approveMedia = has('--approve-pending-media');
const publishDrafts = has('--publish-drafts');
const verifyHosts = (value('--verify-hosts') ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function log(...parts: unknown[]) {
  console.log(...parts);
}

async function report() {
  const [pendingMedia, draftProperties, publishedProperties, pendingHosts, hosts] = await Promise.all([
    prisma.propertyMedia.count({ where: { status: 'pending' } }),
    prisma.property.count({ where: { status: 'draft' } }),
    prisma.property.count({ where: { status: 'published' } }),
    prisma.user.count({ where: { verificationStatus: 'pending' } }),
    prisma.user.count({ where: { role: 'host' } }),
  ]);

  log('— current state —');
  log(`  media pending review      : ${pendingMedia}`);
  log(`  properties draft          : ${draftProperties}`);
  log(`  properties published      : ${publishedProperties}`);
  log(`  hosts pending verification: ${pendingHosts}`);
  log(`  hosts total               : ${hosts}`);

  if (draftProperties > 0) {
    const drafts = await prisma.property.findMany({
      where: { status: 'draft' },
      take: 25,
      select: {
        id: true,
        slug: true,
        title: true,
        city: true,
        host: { select: { email: true } },
        _count: { select: { media: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    log('— drafts —');
    for (const draft of drafts) {
      log(`  ${draft.slug} | ${draft.city ?? 'sin ciudad'} | media=${draft._count.media} | ${draft.host.email}`);
    }
  }
}

async function approvePendingMedia() {
  const pending = await prisma.propertyMedia.findMany({
    where: { status: 'pending' },
    select: { id: true },
  });
  log(`— media: ${pending.length} pending —`);
  if (!apply) {
    log('  dry run: add --apply to approve them');
    return;
  }
  if (pending.length === 0) return;

  const now = new Date();
  const result = await prisma.propertyMedia.updateMany({
    where: { id: { in: pending.map((row) => row.id) } },
    data: {
      status: 'approved',
      aiVerdict: 'approved',
      aiReason: 'manual_approval_backfill',
      reviewedAt: now,
      reviewDueAt: null,
    },
  });
  log(`  approved ${result.count}`);
}

async function publishDraftProperties() {
  const drafts = await prisma.property.findMany({
    where: { status: 'draft' },
    select: {
      id: true,
      slug: true,
      media: { where: { status: { in: ['approved', 'pending'] } }, select: { id: true }, take: 1 },
    },
  });
  const publishable = drafts.filter((draft) => draft.media.length > 0);
  const skipped = drafts.length - publishable.length;

  log(`— publish: ${publishable.length} draft(s) with photos, ${skipped} without —`);
  if (!apply) {
    log('  dry run: add --apply to publish them');
    for (const draft of publishable.slice(0, 25)) log(`  would publish ${draft.slug}`);
    return;
  }
  if (publishable.length === 0) return;

  const result = await prisma.property.updateMany({
    where: { id: { in: publishable.map((draft) => draft.id) } },
    data: { status: 'published' },
  });
  log(`  published ${result.count}`);
}

async function verifyHostsByEmail() {
  if (verifyHosts.length === 0) return;
  log(`— verification: ${verifyHosts.length} e-mail(s) —`);
  for (const email of verifyHosts) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, idVerified: true, role: true },
    });
    if (!user) {
      log(`  ✗ ${email}: not found`);
      continue;
    }
    if (!apply) {
      log(`  would verify ${email} (role=${user.role}, alreadyVerified=${user.idVerified})`);
      continue;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        idVerified: true,
        idVerifiedAt: new Date(),
        verificationStatus: 'verified',
        verificationReviewedAt: new Date(),
        verificationVerdict: 'approved',
        verificationReason: 'manual_approval_backfill',
      },
    });
    log(`  ✓ ${email} verified`);
  }
}

async function main() {
  log(`fix-stuck-listings — mode=${apply ? 'APPLY' : 'DRY RUN'}`);
  await report();
  if (approveMedia) await approvePendingMedia();
  if (publishDrafts) await publishDraftProperties();
  await verifyHostsByEmail();
  log('done');
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : err);
  await prisma.$disconnect();
  process.exit(1);
});
