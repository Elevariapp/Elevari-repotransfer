export const metadata = {
  title: 'Términos y condiciones | Eleveri',
};

export default function TermsPage() {
  return (
    <article className="max-w-3xl">
      <p className="elevari-eyebrow">Legal</p>
      <h1 className="mt-2 font-display text-3xl text-elevari-slate">Términos y condiciones</h1>
      <p className="mt-2 text-sm text-elevari-muted">Última actualización: junio 2026</p>

      <div className="mt-8 space-y-6 text-elevari-slate leading-relaxed">
        <section>
          <h2 className="font-semibold text-elevari-slate">1. Aceptación</h2>
          <p className="mt-2">
            Al usar Eleveri aceptas estos términos. Si no estás de acuerdo, no utilices la plataforma.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">2. Servicio</h2>
          <p className="mt-2">
            Eleveri conecta huéspedes con anfitriones de espacios de glamping y refugios. Eleveri no es
            propietario de los alojamientos salvo que se indique expresamente.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">3. Reservas y pagos</h2>
          <p className="mt-2">
            El precio total mostrado antes del pago incluye el desglose de tarifas aplicables. El
            pago confirma la solicitud de reserva según la política de cada propiedad. Los reembolsos
            dependen de la cancelación y las políticas publicadas en el espacio.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">4. Anfitriones</h2>
          <p className="mt-2">
            Los anfitriones deben proporcionar información veraz, mantener calendarios actualizados y
            cumplir normas locales de turismo y seguridad. Eleveri puede suspender listados que incumplan
            estándares de calidad o legalidad.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">5. Huéspedes</h2>
          <p className="mt-2">
            Los huéspedes deben respetar las reglas del espacio, el entorno natural y las comunidades
            locales. Conductas dañinas pueden resultar en cancelación sin reembolso.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">6. Limitación de responsabilidad</h2>
          <p className="mt-2">
            Eleveri facilita la conexión entre partes. No garantizamos disponibilidad continua del
            servicio ni ausencia de errores. La responsabilidad directa de Eleveri se limita al valor
            de la reserva correspondiente cuando la ley lo permita.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">7. Cambios</h2>
          <p className="mt-2">
            Podemos actualizar estos términos. Los cambios relevantes se comunicarán en la plataforma.
            El uso continuado implica aceptación de la versión vigente.
          </p>
        </section>
      </div>
    </article>
  );
}
