export const metadata = {
  title: 'Términos y condiciones',
  description: 'Términos y condiciones de uso de la plataforma Elevari.',
};

export default function TermsPage() {
  return (
    <article className="max-w-3xl">
      <p className="elevari-eyebrow">Legal</p>
      <h1 className="mt-2 font-display text-3xl text-elevari-slate">Términos y condiciones</h1>
      <p className="mt-2 text-sm text-elevari-muted">Última actualización: 19 de noviembre de 2026</p>

      <div className="mt-8 space-y-6 text-elevari-slate leading-relaxed">
        <section>
          <h2 className="font-semibold text-elevari-slate">1. Aceptación</h2>
          <p className="mt-2">
            Al usar Elevari aceptas estos términos. Si no estás de acuerdo, no utilices la
            plataforma. El uso de la plataforma implica la aceptación plena y sin reservas de todas
            las disposiciones incluidas en este documento.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">2. Servicio</h2>
          <p className="mt-2">
            Elevari conecta huéspedes con anfitriones de espacios de glamping y refugios. Elevari no
            es propietario de los alojamientos salvo que se indique expresamente. La plataforma
            funciona como intermediario para facilitar reservas y pagos.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">3. Reservas y pagos</h2>
          <p className="mt-2">
            El precio total mostrado antes del pago incluye el desglose de tarifas aplicables. El
            pago confirma la solicitud de reserva según la política de cada propiedad. Los
            reembolsos dependen de la cancelación y las políticas publicadas en el espacio. Todos los
            pagos se procesan en pesos colombianos (COP) a través de Wompi.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">4. Tarifa de servicio de Elevari</h2>
          <p className="mt-2">
            Elevari aplica una tarifa de servicio del 15% sobre el precio del alojamiento. Esta
            tarifa se muestra desglosada antes de confirmar el pago y no es reembolsable salvo en
            casos de cancelación por el anfitrión o fuerza mayor.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">5. Anfitriones</h2>
          <p className="mt-2">
            Los anfitriones deben proporcionar información veraz, mantener calendarios actualizados y
            cumplir normas locales de turismo y seguridad. Elevari puede suspender listados que
            incumplan estándares de calidad o legalidad.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">6. Huéspedes</h2>
          <p className="mt-2">
            Los huéspedes deben respetar las reglas del espacio, el entorno natural y las comunidades
            locales. Conductas dañinas pueden resultar en cancelación sin reembolso.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">7. Limitación de responsabilidad</h2>
          <p className="mt-2">
            Elevari facilita la conexión entre partes. No garantizamos disponibilidad continua del
            servicio ni ausencia de errores. La responsabilidad directa de Elevari se limita al valor
            de la reserva correspondiente cuando la ley lo permita.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">8. Cambios a los términos</h2>
          <p className="mt-2">
            Podemos actualizar estos términos. Los cambios relevantes se comunicarán en la
            plataforma. El uso continuado implica aceptación de la versión vigente.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">9. Ley aplicable</h2>
          <p className="mt-2">
            Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa se
            resolverá en los tribunales competentes de Colombia.
          </p>
        </section>
      </div>
    </article>
  );
}
