export const metadata = {
  title: 'Política de privacidad | Eleveri',
  description: 'Política de privacidad y protección de datos personales de Eleveri.',
};

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl">
      <p className="elevari-eyebrow">Legal</p>
      <h1 className="mt-2 font-display text-3xl text-elevari-slate">Política de privacidad</h1>
      <p className="mt-2 text-sm text-elevari-muted">Última actualización: 19 de noviembre de 2026</p>

      <div className="mt-8 space-y-6 text-elevari-slate leading-relaxed">
        <section>
          <h2 className="font-semibold text-elevari-slate">1. Responsable</h2>
          <p className="mt-2">
            Eleveri opera la plataforma de reservas de experiencias de glamping y refugios en
            Colombia. Para consultas sobre privacidad escríbenos a privacidad@elevari.live.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">2. Datos que recopilamos</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-elevari-slate">
            <li>
              Datos de cuenta: nombre, correo electrónico, contraseña (hash) y rol (huésped o
              anfitrión).
            </li>
            <li>
              Datos de reserva: fechas, número de huéspedes, desglose de precios y estado de la
              reserva.
            </li>
            <li>
              Datos de pago: procesados por Wompi (tarjetas, PSE, Nequi y Bancolombia) en pesos
              colombianos; no almacenamos números completos de tarjeta.
            </li>
            <li>
              Contenido multimedia subido por anfitriones para describir sus espacios (fotos,
              descripciones).
            </li>
            <li>
              Datos técnicos: cookies de sesión, logs de acceso, dirección IP y métricas de uso
              (analytics).
            </li>
            <li>
              Datos de ubicación aproximada para mostrar propiedades cercanas (solo con tu
              consentimiento en la app móvil).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">3. Uso de la información</h2>
          <p className="mt-2">
            Utilizamos tus datos para gestionar reservas, procesar pagos, emitir facturas cuando
            aplique, comunicar el estado de tu estadía, mejorar la plataforma, enviar notificaciones
            y cumplir obligaciones legales en Colombia.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">4. Compartición con terceros</h2>
          <p className="mt-2">
            Compartimos datos solo con proveedores necesarios para el servicio: procesadores de
            pago (Wompi), almacenamiento de archivos, email transaccional, facturación (Alegra) y
            herramientas de analítica. No vendemos datos personales.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">5. Tus derechos</h2>
          <p className="mt-2">
            Puedes solicitar acceso, corrección, supresión o portabilidad de tus datos
            contactándonos a privacidad@elevari.live. Responderemos conforme a la Ley 1581 de 2012 y
            normas complementarias sobre protección de datos en Colombia. También puedes solicitar la
            eliminación completa de tu cuenta desde la sección Eliminar mi cuenta.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">6. Seguridad</h2>
          <p className="mt-2">
            Aplicamos autenticación segura, comunicación cifrada en tránsito (TLS) y controles de
            acceso por rol. Ningún sistema es 100% seguro; te recomendamos usar contraseñas fuertes.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">7. Retención de datos</h2>
          <p className="mt-2">
            Conservamos tus datos mientras sea necesario para los fines descritos en esta política o
            para cumplir obligaciones legales. Tras la eliminación de tu cuenta, los datos se
            anonimizan o se eliminan salvo requisitos legales de retención.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-elevari-slate">8. Transferencias internacionales</h2>
          <p className="mt-2">
            Algunos proveedores de servicios pueden estar ubicados fuera de Colombia. En esos casos,
            garantizamos que existan cláusulas contractuales tipo o mecanismos equivalentes de
            protección de datos.
          </p>
        </section>
      </div>
    </article>
  );
}
