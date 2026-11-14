import Accordion from '@/components/Accordion';

const faqItems = [
  {
    title: '¿Cómo reservo un espacio?',
    content:
      'Explora propiedades, elige fechas en el calendario de la propiedad y pulsa Reservar. Tras iniciar sesión completas el pago en checkout (modo demo en staging).',
  },
  {
    title: '¿Cómo publico mi propiedad?',
    content:
      'Regístrate como anfitrión, entra a Anfitrión → Publicar espacio, completa el formulario y sube fotos. Un administrador revisa el media y publica el listado.',
  },
  {
    title: '¿Cómo cancelo una reserva?',
    content:
      'En Mi cuenta puedes cancelar reservas pendientes de pago sin cargo. Para reservas confirmadas aplicamos política moderada: reembolso completo si cancelas con 5 o más días de antelación; 50% entre 2 y 4 días; sin reembolso con menos de 48 h antes del check-in. Los reembolsos se procesan al mismo método de pago.',
  },
  {
    title: '¿Qué métodos de pago aceptan?',
    content:
      'Todos los pagos se procesan en pesos colombianos (COP) a través de Wompi: tarjetas, PSE, Nequi y Bancolombia. El monto cobrado es siempre en COP; si pagas desde el exterior verás una referencia en dólares antes de confirmar. Tras confirmar el pago recibirás un correo de confirmación.',
  },
  {
    title: '¿El precio que veo es el precio final?',
    content:
      'Sí. Antes de pagar ves el desglose completo: precio por noche × número de noches + Tarifa de Servicio Elevari = total. No añadimos cargos sorpresa en el checkout.',
  },
  {
    title: '¿Cómo cambio mi contraseña?',
    content: 'Inicia sesión y ve a Mi cuenta → Cambiar contraseña.',
  },
];

export default function FAQPage() {
  return (
    <article className="max-w-3xl">
        <p className="elevari-eyebrow">Ayuda</p>
        <h1 className="mt-2 font-display text-3xl text-elevari-slate">Preguntas frecuentes</h1>
        <p className="mt-2 text-elevari-muted">
          Respuestas sobre reservas, anfitriones y tu cuenta en Eleveri.
        </p>
        <div className="mt-8 space-y-3">
          {faqItems.map((item) => (
            <Accordion key={item.title} title={item.title} content={item.content} />
          ))}
        </div>
      </article>
  );
}
