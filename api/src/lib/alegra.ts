import type { ElevariFees } from './fees.js';

/**
 * Alegra (Colombia) invoicing.
 *
 * Tax model (decided with the owner): the platform fee shown to guests ("Tarifa de Servicio Elevari",
 * default 15 % of the base) ALREADY INCLUDES IVA. Guests see no change; the invoice separates the net fee
 * and the IVA so that  base + net_fee + IVA == the amount charged by Wompi. Lodging carries no tax line.
 *
 * Alegra's API: prices are sent WITHOUT tax, taxes are ids, `client` must be an existing contact and every
 * item must reference an existing product/service id.
 */

export interface AlegraClient {
  headers: Record<string, string>;
  baseUrl: string;
}

export function getAlegraClient(): AlegraClient | null {
  const email = process.env.ALEGRA_EMAIL;
  const token = process.env.ALEGRA_API_TOKEN;

  if (!email || !token) {
    return null;
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64');

  return {
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    baseUrl: 'https://api.alegra.com/api/v1',
  };
}

/** IVA percentage that is embedded in the platform fee. */
export const FEE_IVA_PERCENT = 19;

const LODGING_ITEM = { name: 'Hospedaje', description: 'Servicio de hospedaje' };
const FEE_ITEM = {
  name: 'Tarifa de Servicio Elevari',
  description: 'Tarifa de servicio de la plataforma Elevari (IVA incluido)',
};

/** Splits a fee that includes IVA into net amount and IVA (net has 6 decimals: Alegra calculates at scale 6). */
export function splitFeeWithIva(feeIncludingIva: number, ivaPercent: number = FEE_IVA_PERCENT) {
  const net = Math.round((feeIncludingIva / (1 + ivaPercent / 100)) * 1e6) / 1e6;
  return { net, iva: Math.round((feeIncludingIva - net) * 100) / 100 };
}

/** Pure description of the invoice; ids are resolved against Alegra in createAlegraInvoice. */
export interface AlegraInvoiceSpec {
  guestName: string;
  guestEmail: string;
  propertyTitle: string;
  nights: number;
  baseAmount: number;
  feeIncludingIva: number;
  feePercent: number;
  transactionId: string;
}

export function buildAlegraInvoicePayload(params: {
  guestName: string;
  guestEmail: string;
  propertyTitle: string;
  nights: number;
  fees: ElevariFees;
  transactionId: string;
}): AlegraInvoiceSpec {
  const { guestName, guestEmail, propertyTitle, nights, fees, transactionId } = params;
  return {
    guestName,
    guestEmail,
    propertyTitle,
    nights,
    baseAmount: fees.base_amount,
    feeIncludingIva: fees.platform_fee_amount,
    feePercent: fees.platform_fee_percent,
    transactionId,
  };
}

async function alegraFetch<T>(client: AlegraClient, method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${client.baseUrl}${path}`, {
    method,
    headers: client.headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Alegra API ${method} ${path} ${response.status}: ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

const refCache = new Map<string, string>();

async function cached(key: string, resolve: () => Promise<string>): Promise<string> {
  const hit = refCache.get(key);
  if (hit) return hit;
  const value = await resolve();
  refCache.set(key, value);
  return value;
}

async function ivaTaxId(client: AlegraClient): Promise<string> {
  if (process.env.ALEGRA_IVA_TAX_ID) return process.env.ALEGRA_IVA_TAX_ID;
  return cached('tax:iva', async () => {
    const taxes = await alegraFetch<Array<{ id: string | number; percentage: string | number; type?: string }>>(
      client,
      'GET',
      '/taxes',
    );
    const iva = taxes.find((t) => Number(t.percentage) === FEE_IVA_PERCENT && (t.type ?? 'IVA') === 'IVA');
    if (!iva) throw new Error(`Alegra has no IVA ${FEE_IVA_PERCENT}% tax configured`);
    return String(iva.id);
  });
}

async function ensureItem(
  client: AlegraClient,
  item: { name: string; description: string },
  taxIds: string[],
): Promise<string> {
  return cached(`item:${item.name}`, async () => {
    const found = await alegraFetch<Array<{ id: string | number; name: string }>>(
      client,
      'GET',
      `/items?query=${encodeURIComponent(item.name)}&limit=30`,
    );
    const exact = (Array.isArray(found) ? found : []).find((i) => i.name === item.name);
    if (exact) return String(exact.id);

    const created = await alegraFetch<{ id: string | number }>(client, 'POST', '/items', {
      name: item.name,
      description: item.description,
      type: 'service',
      price: 0,
      tax: taxIds.map((id) => ({ id })),
    });
    return String(created.id);
  });
}

/** Alegra's built-in "Consumidor Final" contact (id 1) is the fallback when the guest has no email. */
const FINAL_CONSUMER_ID = '1';

async function ensureClient(client: AlegraClient, name: string, email: string): Promise<string> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return FINAL_CONSUMER_ID;

  const found = await alegraFetch<Array<{ id: string | number; email?: string }>>(
    client,
    'GET',
    `/contacts?query=${encodeURIComponent(cleanEmail)}&type=client&limit=30`,
  );
  const match = (Array.isArray(found) ? found : []).find((c) => c.email?.toLowerCase() === cleanEmail);
  if (match) return String(match.id);

  const parts = name.trim().split(/\s+/).filter(Boolean);
  const created = await alegraFetch<{ id: string | number }>(client, 'POST', '/contacts', {
    nameObject: { firstName: parts[0] ?? 'Huésped', lastName: parts.slice(1).join(' ') || 'Elevari' },
    email: cleanEmail,
    type: ['client'],
    kindOfPerson: 'PERSON_ENTITY',
  });
  return String(created.id);
}

/** Today in Colombia (UTC-5, no DST) as yyyy-mm-dd. */
function bogotaToday(): string {
  return new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);
}

/**
 * Creates the sales invoice in Alegra.
 *
 * Disabled unless ALEGRA_INVOICE_STATUS=open. Alegra drafts all share id "1" (they cannot be tracked or deleted
 * through the API) and non-electronic "open" invoices are not DIAN-valid, so nothing is created until
 * electronic invoicing is enabled in Alegra. Until then the booking keeps a failed PendingInvoice that an admin can
 * retry (retryPendingInvoice) once the integration is switched on.
 * ALEGRA_BANK_ACCOUNT_ID (optional): when set, the Wompi payment is recorded against that bank account.
 */
export async function createAlegraInvoice(spec: object): Promise<{ id: string }> {
  const client = getAlegraClient();
  if (!client) {
    throw new Error('ALEGRA_NOT_CONFIGURED');
  }
  if (process.env.ALEGRA_INVOICE_STATUS !== 'open') {
    throw new Error('ALEGRA_INVOICING_DISABLED: set ALEGRA_INVOICE_STATUS=open after enabling DIAN electronic invoicing');
  }
  const s = spec as AlegraInvoiceSpec;

  const taxId = await ivaTaxId(client);
  const [lodgingId, feeId, clientId] = await Promise.all([
    ensureItem(client, LODGING_ITEM, []),
    ensureItem(client, FEE_ITEM, [taxId]),
    ensureClient(client, s.guestName, s.guestEmail),
  ]);

  const nights = s.nights > 0 ? s.nights : 1;
  const { net } = splitFeeWithIva(s.feeIncludingIva);
  const today = bogotaToday();
  const total = Math.round((s.baseAmount + s.feeIncludingIva) * 100) / 100;

  const payload: Record<string, unknown> = {
    date: today,
    dueDate: today,
    status: 'open',
    client: { id: clientId },
    observations: `Elevari reserva · Ref: ${s.transactionId}`,
    items: [
      {
        id: lodgingId,
        description: `Hospedaje — ${s.propertyTitle} (${nights} ${nights === 1 ? 'noche' : 'noches'})`,
        price: s.baseAmount / nights,
        quantity: nights,
        tax: [],
      },
      {
        id: feeId,
        description: `Tarifa de Servicio Elevari (${s.feePercent}%, IVA incluido)`,
        price: net,
        quantity: 1,
        tax: [{ id: taxId }],
      },
    ],
  };

  if (process.env.ALEGRA_BANK_ACCOUNT_ID) {
    payload.payments = [
      {
        date: today,
        account: { id: process.env.ALEGRA_BANK_ACCOUNT_ID },
        amount: total,
        paymentMethod: 'transfer',
      },
    ];
  }

  return alegraFetch<{ id: string }>(client, 'POST', '/invoices', payload);
}
