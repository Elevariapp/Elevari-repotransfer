export const metadata = {
  title: 'Información de contacto | Eleveri',
  description: 'Formas de contactar con Eleveri: soporte, privacidad, moderación y consultas generales.',
};

export default function ContactPage() {
  return (
    <article className="max-w-3xl">
      <p className="elevari-eyebrow">Legal</p>
      <h1 className="mt-2 font-display text-3xl text-elevari-slate">Información de contacto</h1>
      <p className="mt-2 text-sm text-elevari-muted">
        Última actualización: 19 de noviembre de 2026
      </p>

      <div className="mt-8 space-y-6 text-elevari-slate leading-relaxed">
        <section>
          <h2 className="font-semibold text-elevari-slate">1. Canales de contacto</h2>
          <p className="mt-2">
            Puedes contactar con Eleveri a través de los siguientes canales según el motivo de tu
            consulta:
          </p>
          <table className="mt-2 w-full text-left border-collapse text-elevari-slate">
            <thead>
              <tr className="border-b border-elevari-muted/30">
                <th className="pb-2 text-left font-semibold">Motivo</th>
                <th className="pb-2 text-left font-semibold">Correo electrónico</th>
                <th className="pb-2 text-left font-semibold">Tiempo de respuesta</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-elevari-muted/30">
                <td className="py-2">Soporte general y reservas</td>
                <td className="py-2">soporte@elevari.live</td>
                <td className="py-2">1-2 días hábiles</td>
              </tr>
              <tr className="border-b border-elevari-muted/30">
                <td className="py-2">Privacidad y protección de datos</td>
                <td className="py-2">privacidad@elevari.live</td>
                <td className="py-2">5 días hábiles</td>
              </tr>
              <tr className="border-b border-elevari-muted/30">
                <td className="py-2">Moderación de contenido y apelaciones</td>
                <td className="py-2">moderacion@elevari.live</td>
                <td className="py-2">5 días hábiles</td>
              </tr>
              <tr className="border-b border-elevari-muted/30">
                <td className="py-2">Anfitriones y listados</td>
                <td className="py-2">anfitriones@elevari.live</td>
                <td className="py-2">1-2 días hábiles</td>
              </tr>
              <tr className="border-b border-elevari-muted/30">
                <td className="py-2">Accesibilidad</td>
                <td className="py-2">accesibilidad@elevari.live</td>
                <td className="py-2">5 días hábiles</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">2. Datos del responsable</h2>
          <p className="mt-2">
            Eleveri opera la plataforma de reservas de experiencias de glamping y refugios en
            Colombia. Para consultas legales o administrativas, puedes dirigirte a:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-elevari-slate">
            <li>Nombre comercial: Eleveri</li>
            <li>Correo legal: legal@elevari.live</li>
            <li>Sede: Colombia</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">3. Antes de contactarnos</h2>
          <p className="mt-2">
            Te recomendamos revisar nuestras Preguntas Frecuentes y la sección de Ayuda en la
            plataforma, donde encontrarás respuestas sobre reservas, pagos, cancelaciones y gestión
            de tu cuenta.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">4. Enlaces relacionados</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-elevari-slate">
            <li>
              <a href="/legal/terms" className="text-elevari-forest hover:underline">
                Términos y condiciones
              </a>
            </li>
            <li>
              <a href="/legal/privacy" className="text-elevari-forest hover:underline">
                Política de privacidad
              </a>
            </li>
            <li>
              <a href="/legal/refund" className="text-elevari-forest hover:underline">
                Política de reembolso
              </a>
            </li>
            <li>
              <a href="/legal/account-deletion" className="text-elevari-forest hover:underline">
                Eliminar mi cuenta
              </a>
            </li>
            <li>
              <a href="/legal/content-moderation" className="text-elevari-forest hover:underline">
                Moderación de contenido
              </a>
            </li>
            <li>
              <a href="/legal/accessibility" className="text-elevari-forest hover:underline">
                Accesibilidad
              </a>
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}