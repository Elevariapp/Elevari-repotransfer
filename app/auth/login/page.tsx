import { safeAuthRedirect } from '@/lib/auth-session';
import LoginClient from './LoginClient';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const sp = await searchParams;
  return <LoginClient redirectTo={safeAuthRedirect(sp.redirect)} />;
}
