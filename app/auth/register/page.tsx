import { safeAuthRedirect } from '@/lib/auth-session';
import RegisterClient from './RegisterClient';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; role?: string }>;
}) {
  const sp = await searchParams;
  const initialRole = sp.role === 'host' ? 'host' : 'guest';
  return (
    <RegisterClient
      redirectTo={safeAuthRedirect(sp.redirect)}
      initialRole={initialRole}
    />
  );
}
