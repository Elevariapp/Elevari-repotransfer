export const metadata = {
  title: 'Accesibilidad',
  description: 'Compromiso de accesibilidad de Eleveri: objetivo WCAG 2.2 AA en web.',
};

const sections = [
  {
    title: 'Nuestro compromiso',
    body: 'Trabajamos para que Eleveri sea usable por la mayor cantidad de personas posible, incluidas quienes navegan con teclado, lectores de pantalla, ampliación o contraste reducido. Nuestro objetivo es WCAG 2.2 nivel AA en la web.',
  },
  {
    title: 'Qué implementamos',
    body: 'Navegación completa por teclado, foco visible en todos los controles, enlace "Saltar al contenido principal", contraste verificado en textos y botones, etiquetas accesibles en galería y diálogos, mensajes de error anunciados y respeto por la preferencia de movimiento reducido.',
  },
  {
    title: 'Tamaños y dispositivos',
    body: 'Las zonas táctiles tienen al menos 44 × 44 px. La interfaz es mobile first y se adapta desde 320 px de ancho. Las imágenes incluyen texto alternativo cuando aportan información.',
  },
  {
    title: 'Limitaciones conocidas',
    body: 'Algunos videos de propiedades pueden no incluir subtítulos si el anfitrión no los proporciona. Estamos trabajando en una guía de publicación accesible para anfitriones.',
  },
  {
    title: 'Cómo reportar una barrera',
    body: 'Si encuentras una barrera de accesibilidad, escríbenos desde la página de contacto o a soporte y describe la pantalla, el dispositivo y la acción que intentabas realizar. Respondemos en un plazo de 5 días hábiles.',
  },
];

export default function AccessibilityPage() {
  return (
    <article className="max-w-3xl">
      <p className="elevari-eyebrow">Legal</p>
      <h1 className="mt-2 font-display text-3xl text-elevari-ink">Accesibilidad</h1>
      <p className="mt-2 text-elevari-muted">
        Última actualización: 2026. Este documento describe el estado de accesibilidad de la
        plataforma web de Eleveri.
      </p>
      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-xl text-elevari-ink">{section.title}</h2>
            <p className="mt-2 leading-relaxed text-elevari-slate">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}