export const metadata = {
  title: 'Política de reembolso | Eleveri',
  description: 'Política de reembolso y cancelación de reservas de Eleveri.',
};

export default function RefundPage() {
  return (
    <article className="max-w-3xl">
      <p className="elevari-eyebrow">Legal</p>
      <h1 className="mt-2 font-display text-3xl text-elevari-slate">Política de reembolso</h1>
      <p className="mt-2 text-sm text-elevari-muted">
        Última actualización: 19 de noviembre de 2026
      </p>

      <div className="mt-8 space-y-6 text-elevari-slate leading-relaxed">
        <section>
          <h2 className="font-semibold text-elevari-slate">1. Alcance</h2>
          <p className="mt-2">
            Esta política se aplica a todas las reservas realizadas a través de la plataforma
            Eleveri (web y móvil). Los reembolsos se procesan según la política de cancelación
            publicada por cada anfitrión y los plazos establecidos a continuación.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">2. Cancelación por el huésped</h2>
          <p className="mt-2">
            Puedes cancelar una reserva antes del check-in. El monto reembolsable depende de la
            política del anfitrión y del tiempo de antelación:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-elevari-slate">
            <li>
              <strong>Flexible:</strong> reembolso completo si cancelas hasta 24 horas antes del
              check-in.
            </li>
            <li>
              <strong>Moderada:</strong> reembolso completo si cancelas con 5 o más días de
              antelación; 50% entre 2 y 4 días; sin reembolso con menos de 48 horas.
            </li>
            <li>
              <strong>Estricta:</strong> reembolso del 50% si cancelas con 7 o más días de
              antelación; sin reembolso después de ese plazo.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">3. Cancelación por el anfitrión</h2>
          <p className="mt-2">
            Si el anfitrión cancela la reserva, recibirás un reembolso completo del monto pagado,
            incluida la tarifa de servicio de Elevari. El anfitrión puede enfrentar sanciones según
            nuestros Términos y Condiciones.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">4. Fuerza mayor</h2>
          <p className="mt-2">
            En casos de fuerza mayor (desastres naturales, restricciones gubernamentales,
            emergencias sanitarias), se evaluará cada caso individualmente. Eleveri se reserva el
            derecho de ofrecer reembolsos completos o créditos para futuras reservas.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">5. Proceso de reembolso</h2>
          <p className="mt-2">
            Los reembolsos se procesan al mismo método de pago utilizado para la reserva. El tiempo
            de acreditación depende de la entidad financiera y puede tardar entre 5 y 10 días
            hábiles. Eleveri no cobra comisiones por procesar reembolsos.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">6. No-show y llegada tardía</h2>
          <p className="mt-2">
            Si el huésped no se presenta en la fecha de check-in sin previo aviso, la reserva se
            considera cancelada sin derecho a reembolso. Las llegadas tardías no dan derecho a
            reembolso parcial por las noches no utilizadas.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">7. Contacto</h2>
          <p className="mt-2">
            Para solicitar un reembolso o reportar un problema con tu reserva, contáctanos a través
            de nuestra página de Información de Contacto o envía un correo a
            soporte@eleveri.app.
          </p>
        </section>
      </div>
    </article>
  );
}