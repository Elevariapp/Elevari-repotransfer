import type { Metadata } from 'next';
import AccountSubpage from '@/components/account/AccountSubpage';
import DeleteAccountForm from '@/components/account/DeleteAccountForm';

export const metadata: Metadata = { title: 'Eliminar mi cuenta' };

export default function DeleteAccountPage() {
  return (
    <AccountSubpage
      eyebrow="Zona de riesgo"
      title="Eliminar mi cuenta"
      description="Lee con calma qué ocurre antes de continuar."
    >
      <DeleteAccountForm />
    </AccountSubpage>
  );
}
