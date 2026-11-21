export const metadata = {
  title: 'Eliminar mi cuenta | Elevari',
  description: 'Procedimiento para eliminar tu cuenta de Elevari y solicitar la eliminación de tus datos personales.',
};

export default function AccountDeletionPage() {
  return (
    <article className="max-w-3xl">
      <p className="elevari-eyebrow">Legal</p>
      <h1 className="mt-2 font-display text-3xl text-elevari-slate">Eliminar mi cuenta</h1>
      <p className="mt-2 text-sm text-elevari-muted">
        Última actualización: 19 de noviembre de 2026
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
            Al eliminar tu cuenta se borrarán:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-elevari-slate">
            <li>Datos de perfil: nombre, correo electrónico, foto de perfil y rol.</li>
            <li>Historial de reservas y mensajes asociados a tu cuenta.</li>
            <li>Preferencias de configuración y notificaciones.</li>
            <li>Datos de autenticación y tokens de sesión.</li>
          </ul>
          <p className="mt-2 text-elevari-muted">
            Algunos datos pueden conservarse de forma anonimizada para fines contables, fiscales o
            de cumplimiento legal, según lo requiera la normativa colombiana.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">3. Reservas activas</h2>
          <p className="mt-2">
            No puedes eliminar tu cuenta si tienes reservas pendientes o activas. Debes completar o
            cancelar todas las reservas antes de solicitar la eliminación. Los reembolsos pendientes
            se procesarán antes de eliminar la cuenta.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">4. Cómo solicitar la eliminación</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-elevari-slate">
            <li>Inicia sesión en tu cuenta en la plataforma Elevari.</li>
            <li>Ve a Mi cuenta → Configuración → Eliminar mi cuenta.</li>
            <li>Confirma que entiendes que la acción es irreversible.</li>
            <li>Envía la solicitud de eliminación.</li>
          </ol>
          <p className="mt-2">
            También puedes enviar un correo a reserve@elevari.live desde el correo asociado a tu
            cuenta solicitando la eliminación.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">5. Plazo de procesamiento</h2>
          <p className="mt-2">
            Procesaremos tu solicitud de eliminación en un plazo de 30 días hábiles. Recibirás una
            confirmación por correo electrónico una vez completada la eliminación.
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