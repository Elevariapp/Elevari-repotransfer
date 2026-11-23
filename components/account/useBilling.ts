'use client';

import { useCallback, useEffect, useState } from 'react';
import { wanaApi, type AccountInvoice, type AccountPayment } from '@/lib/api-client';

type BillingState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; payments: AccountPayment[]; invoices: AccountInvoice[] };

export function useBilling() {
  const [state, setState] = useState<BillingState>({ status: 'loading' });

  const load = useCallback(() => {
    wanaApi
      .billing()
      .then((data) => setState({ status: 'ready', payments: data.payments, invoices: data.invoices }))
      .catch((err: unknown) =>
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'No pudimos cargar tu historial.',
        }),
      );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    load();
  }, [load]);

  return { state, reload };
}
