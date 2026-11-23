export const metadata = {
  title: 'Eliminar mi cuenta',
  description: 'Procedimiento para eliminar tu cuenta de Elevari y solicitar la eliminación de tus datos personales.',
};

export default function AccountDeletionPage() {
  return (
    <article className="max-w-3xl">
      <p className="elevari-eyebrow">Legal</p>
      <h1 className="mt-2 font-display text-3xl text-elevari-slate">Eliminar mi cuenta</h1>
      <p className="mt-2 text-sm text-elevari-muted">
        Última actualización: 23 de noviembre de 2026
      </p>

      <div className="mt-8 space-y-6 text-elevari-slate leading-relaxed">
        <section>
          <h2 className="font-semibold text-elevari-slate">1. Derecho de eliminación</h2>
          <p className="mt-2">
            Conforme a la Ley 1581 de 2012 y normas complementarias sobre protección de datos
            personales en Colombia, tienes derecho a solicitar la eliminación de tu cuenta y de
            todos los datos personales asociados a ella.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">2. Qué se elimina</h2>
          <p className="mt-2">
            Al eliminar tu cuenta se borran de inmediato:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-elevari-slate">
            <li>Tus datos de perfil: nombre, correo electrónico y teléfono.</li>
            <li>
              Tu contraseña y tus sesiones abiertas: no podrás volver a iniciar sesión con esa
              cuenta.
            </li>
            <li>Los identificadores de notificaciones push de tus dispositivos.</li>
            <li>El nombre y el correo de huésped guardados en tus reservas.</li>
          </ul>
          <p className="mt-2 text-elevari-muted">
            Las reservas, los pagos y las facturas se conservan sin tus datos de contacto, porque son
            registros contables. Las facturas electrónicas pendientes de emisión conservan los datos
            del cliente hasta que se emitan, y los documentos ya emitidos pueden conservarse según lo
            requiera la normativa fiscal y de cumplimiento legal colombiana.
          </p>
          <p className="mt-2 text-elevari-muted">
            Si eres anfitrión, tus espacios publicados dejan de ser visibles y pasan a borrador.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">3. Reservas activas</h2>
          <p className="mt-2">
            No puedes eliminar tu cuenta mientras tengas reservas pendientes de pago, confirmadas o
            en curso, ya sea como huésped o en los espacios que publicas como anfitrión. Cancélalas
            o espera a que terminen y vuelve a intentarlo.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">4. Cómo solicitar la eliminación</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-elevari-slate">
            <li>Inicia sesión en tu cuenta en la plataforma Elevari.</li>
            <li>
              Ve a Mi cuenta → Eliminar mi cuenta, o abre directamente{' '}
              <a href="/account/delete" className="text-elevari-forest hover:underline">
                elevari.live/account/delete
              </a>
              .
            </li>
            <li>
              Confirma con tu contraseña (si ingresas con Google, escribe tu correo electrónico).
            </li>
            <li>
              Confirma que entiendes que la acción es irreversible y pulsa «Eliminar mi cuenta».
            </li>
          </ol>
          <p className="mt-2">
            Te enviaremos un correo confirmando la eliminación. Si no puedes iniciar sesión, también
            puedes enviar un correo a privacidad@elevari.live desde el correo asociado a tu cuenta
            solicitando la eliminación.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">5. Plazo de procesamiento</h2>
          <p className="mt-2">
            Si eliminas tu cuenta desde Elevari, el cambio es inmediato. Las solicitudes enviadas
            por correo electrónico las procesamos en un plazo de 30 días hábiles y te confirmamos
            por el mismo medio cuando la eliminación esté completa.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">6. Irreversibilidad</h2>
          <p className="mt-2">
            La eliminación de la cuenta es irreversible. Una vez eliminada, no podrás recuperar tu
            historial, reservas ni contenido asociado. Si deseas usar Elevari nuevamente, deberás
            crear una nueva cuenta.
          </p>
        </section>
      </div>
    </article>
  );
}