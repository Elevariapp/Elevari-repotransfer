import type { Metadata } from 'next';
import AccountSubpage from '@/components/account/AccountSubpage';
import PaymentsList from '@/components/account/PaymentsList';

export const metadata: Metadata = { title: 'Pagos' };

export default function PaymentsPage() {
  return (
    <AccountSubpage
      eyebrow="Configuración"
      title="Pagos"
      description="El historial de pagos y reembolsos de tus reservas."
    >
      <PaymentsList />
    </AccountSubpage>
  );
}
