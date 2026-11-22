import { redirect, notFound } from 'next/navigation';

const STATIC_TYPES: Record<string, string> = {
  privacy: '/legal/privacy',
  terms: '/legal/terms',
  faq: '/legal/faq',
};

export default async function LegalTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const target = STATIC_TYPES[type];
  if (target) redirect(target);
  notFound();
}
