const items = [
  { label: 'Espacios verificados', detail: 'Revisión manual' },
  { label: 'Precio transparente', detail: 'Total antes de pagar' },
  { label: 'Pago seguro', detail: 'Wompi · COP' },
  { label: 'Soporte en español', detail: 'Huéspedes y anfitriones' },
];

export default function TrustStrip() {
  return (
    <section aria-label="Garantías de reserva" className="border-y border-elevari-border/80 bg-elevari-ivory">
      <div className="elevari-container py-6 sm:py-8">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {items.map((item) => (
            <li
              key={item.label}
              className="rounded-2xl border border-elevari-border/80 bg-elevari-surface/90 px-3 py-4 text-center shadow-[var(--elevari-shadow-soft)] sm:px-4"
            >
              <p className="text-[11px] font-bold uppercase leading-snug tracking-[0.12em] text-elevari-slate sm:text-xs sm:tracking-[0.15em]">
                {item.label}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-elevari-muted">{item.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
