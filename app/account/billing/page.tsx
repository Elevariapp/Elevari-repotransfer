import type { Metadata } from 'next';
import AccountSubpage from '@/components/account/AccountSubpage';
import InvoicesList from '@/components/account/InvoicesList';

export const metadata: Metadata = { title: 'Facturación' };

export default function BillingPage() {
  return (
    <AccountSubpage
      eyebrow="Configuración"
      title="Facturación"
      description="Tus facturas electrónicas por cada reserva pagada."
    >
      <InvoicesList />
    </AccountSubpage>
  );
}
