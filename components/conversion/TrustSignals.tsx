export default function TrustSignals() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
      <div className="rounded-xl border border-elevari-border p-4">
        <p className="font-semibold">Pago seguro con Wompi</p>
        <p className="text-elevari-muted">Transacciones encriptadas y protegidas.</p>
      </div>
      <div className="rounded-xl border border-elevari-border p-4">
        <p className="font-semibold">Reserva protegida</p>
        <p className="text-elevari-muted">Política de cancelación clara y verificada.</p>
      </div>
      <div className="rounded-xl border border-elevari-border p-4">
        <p className="font-semibold">Precio transparente</p>
        <p className="text-elevari-muted">Sin cargos ocultos. Lo que ves es lo que pagas.</p>
      </div>
      <div className="rounded-xl border border-elevari-border p-4">
        <p className="font-semibold">Anfitrión verificado</p>
        <p className="text-elevari-muted">Identidad y propiedad verificadas.</p>
      </div>
    </div>
  );
}
