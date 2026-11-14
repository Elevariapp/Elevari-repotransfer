import AdminInvoicesPanel from '@/components/admin/AdminInvoicesPanel';

export default function AdminInvoicesPage() {
  return (
    <div>
      <header className="mb-8">
        <p className="wana-eyebrow">Admin</p>
        <h1 className="mt-2 font-display text-3xl text-elevari-slate">Facturas Alegra</h1>
        <p className="mt-2 text-elevari-muted">
          Facturas pendientes o fallidas tras confirmar pago. Reintenta emisión manual.
        </p>
      </header>
      <AdminInvoicesPanel />
    </div>
  );
}
