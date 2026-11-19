export const metadata = {
  title: 'Moderación de contenido | Eleveri',
  description: 'Política de moderación de contenido de Eleveri para propiedades, reseñas y perfiles.',
};

export default function ContentModerationPage() {
  return (
    <article className="max-w-3xl">
      <p className="elevari-eyebrow">Legal</p>
      <h1 className="mt-2 font-display text-3xl text-elevari-slate">Moderación de contenido</h1>
      <p className="mt-2 text-sm text-elevari-muted">
        Última actualización: 19 de noviembre de 2026
      </p>

      <div className="mt-8 space-y-6 text-elevari-slate leading-relaxed">
        <section>
          <h2 className="font-semibold text-elevari-slate">1. Propósito</h2>
          <p className="mt-2">
            Esta política describe cómo Eleveri revisa, aprueba y elimina el contenido publicado en
            la plataforma, incluidos anuncios de propiedades, fotos, descripciones, reseñas y
            perfiles de usuario. Nuestro objetivo es mantener una comunidad segura, confiable y
            respetuosa.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">2. Contenido prohibido</h2>
          <p className="mt-2">
            No se permite publicar contenido que:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-elevari-slate">
            <li>Sea ilegal, fraudulento o engañoso.</li>
            <li>Contenga discurso de odio, acoso, amenazas o violencia.</li>
            <li>Incluya información personal de terceros sin su consentimiento.</li>
            <li>Infrinja derechos de autor, marcas u otros derechos de propiedad intelectual.</li>
            <li>Sea sexualmente explícito o contenido para adultos no consentido.</li>
            <td>Promueva el consumo de sustancias ilegales o actividades peligrosas.</td>
            <li>Sea spam, contenido duplicado o de baja calidad.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">3. Proceso de revisión</h2>
          <p className="mt-2">
            Todo el contenido nuevo (anuncios, fotos, reseñas) pasa por una revisión antes de
            publicarse. El proceso incluye:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-elevari-slate">
            <li>Revisión automatizada de palabras clave y contenido sensible.</li>
            <li>Revisión manual por el equipo de moderación de Eleveri.</li>
            <li>Verificación de identidad y propiedad para anfitriones.</li>
          </ul>
          <p className="mt-2">
            El tiempo de revisión es de hasta 48 horas hábiles. Recibirás una notificación cuando tu
            contenido sea aprobado o rechazado.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">4. Apelaciones</h2>
          <p className="mt-2">
            Si tu contenido es rechazado o eliminado, puedes apelar la decisión enviando un correo a
            moderacion@eleveri.app explicando por qué consideras que la decisión es incorrecta.
            Revisaremos tu apelación en un plazo de 5 días hábiles.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">5. Reportes de usuarios</h2>
          <p className="mt-2">
            Cualquier usuario puede reportar contenido que considere inapropiado desde la página del
            anuncio o reseña correspondiente. Los reportes se revisan en un plazo de 72 horas.
            Eleveri tomará las medidas adecuadas, que pueden incluir la eliminación del contenido o
            la suspensión de la cuenta del infractor.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">6. Suspensión de cuentas</h2>
          <p className="mt-2">
            Las cuentas que violen repetidamente nuestras políticas pueden ser suspendidas o
            terminadas. En caso de suspensión, el usuario será notificado por correo electrónico con
            los motivos y las opciones disponibles.
          </p>
        </section>
      </div>
    </article>
  );
}