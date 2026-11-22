export function formatCop(amount: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateRange(checkIn: string, checkOut: string) {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const inD = new Date(checkIn);
  const outD = new Date(checkOut);
  return `${inD.toLocaleDateString('es-CO', opts)} – ${outD.toLocaleDateString('es-CO', opts)}`;
}
