export type Guide = {
  slug: string;
  title: string;
  description: string;
  category: 'Reservas' | 'Pagos' | 'Cancelaciones' | 'Escapadas' | 'Naturaleza' | 'Glamping' | 'Cómo usar Elevari';
  heroSummary: string;
  sections: {
    introduccion: string;
    queDebesSaber: string[];
    comoFunciona: string[];
  };
  faq: { question: string; answer: string }[];
  relatedCollections: string[];
  relatedProperties: string[];
  reviewedAt: string;
};

export const guides: Guide[] = [
  {
    slug: 'como-reservar-en-elevari',
    title: 'Cómo reservar en Elevari',
    description: 'Guía oficial para reservar propiedades en Elevari con verificación de disponibilidad y pago seguro.',
    category: 'Reservas',
    heroSummary: 'Reserva en minutos con verificación real de disponibilidad y pago en COP con Wompi.',
    sections: {
      introduccion: 'Elevari permite reservar propiedades verificadas con proceso transparente y confirmación inmediata.',
      queDebesSaber: [
        'La disponibilidad se verifica en tiempo real con el inventario.',
        'El pago se procesa en pesos colombianos con Wompi.',
        'Recibirás confirmación por correo al completar el pago.',
      ],
      comoFunciona: [
        'Selecciona fechas y número de huéspedes.',
        'Revisa políticas de cancelación y normas de la casa.',
        'Completa el pago con tarjeta, PSE, Nequi o Bancolombia.',
        'Recibe voucher y acceso a la propiedad.',
      ],
    },
    faq: [
      { question: '¿Puedo modificar mi reserva?', answer: 'Las modificaciones dependen de la política del anfitrión y disponibilidad. Contacta soporte.' },
      { question: '¿Cuándo recibo la confirmación?', answer: 'Inmediatamente después del pago aprobado.' },
    ],
    relatedCollections: ['cerca-de-bogota', 'glamping-con-fogata'],
    relatedProperties: [],
    reviewedAt: new Date().toISOString(),
  },
  {
    slug: 'pagos-y-seguridad',
    title: 'Pagos y seguridad en Elevari',
    description: 'Información verificada sobre métodos de pago, seguridad y protección de datos.',
    category: 'Pagos',
    heroSummary: 'Pagos en COP con Wompi, protección de datos y transparencia total.',
    sections: {
      introduccion: 'Todos los pagos se procesan con Wompi en pesos colombianos.',
      queDebesSaber: [
        'Aceptamos tarjetas, PSE, Nequi y Bancolombia.',
        'Los datos de pago no se almacenan en Elevari.',
        'El cobro incluye tarifa de servicio transparente.',
      ],
      comoFunciona: [
        'Elige método de pago en checkout.',
        'Wompi procesa la transacción de forma segura.',
        'Recibe comprobante por correo.',
      ],
    },
    faq: [
      { question: '¿Es seguro pagar con Elevari?', answer: 'Sí, el procesamiento lo realiza Wompi con encriptación y cumplimiento PCI.' },
      { question: '¿Puedo pagar en otra moneda?', answer: 'No, los pagos se realizan únicamente en COP.' },
    ],
    relatedCollections: [],
    relatedProperties: [],
    reviewedAt: new Date().toISOString(),
  },
  {
    slug: 'politicas-de-cancelacion',
    title: 'Políticas de cancelación',
    description: 'Políticas reales de cancelación aplicadas en Elevari.',
    category: 'Cancelaciones',
    heroSummary: 'Reembolso total con 5 días o más, 50% entre 2 y 4 días, sin reembolso con menos de 48 horas.',
    sections: {
      introduccion: 'Las políticas de cancelación son definidas por el anfitrión y se muestran antes de pagar.',
      queDebesSaber: [
        'Reembolso total con 5 días o más de anticipación.',
        '50% entre 2 y 4 días antes.',
        'Sin reembolso con menos de 48 horas.',
      ],
      comoFunciona: [
        'Revisa la política en la página de la propiedad.',
        'Solicita cancelación desde tu cuenta.',
        'El reembolso se procesa según la política aplicable.',
      ],
    },
    faq: [
      { question: '¿Puedo cancelar gratis?', answer: 'Depende de la política y la anticipación. Revisa los términos antes de reservar.' },
    ],
    relatedCollections: [],
    relatedProperties: [],
    reviewedAt: new Date().toISOString(),
  },
  {
    slug: 'como-usar-elevari',
    title: 'Cómo usar Elevari',
    description: 'Guía oficial para navegar, buscar y reservar en Elevari.',
    category: 'Cómo usar Elevari',
    heroSummary: 'Navega por colecciones verificadas, filtra por ciudad y amenities reales.',
    sections: {
      introduccion: 'Elevari organiza propiedades verificadas en colecciones temáticas.',
      queDebesSaber: [
        'Las colecciones se generan desde inventario real.',
        'Los filtros reflejan amenities verificadas.',
        'Las imágenes son de propiedades reales.',
      ],
      comoFunciona: [
        'Explora colecciones en la página principal.',
        'Usa filtros de ciudad, precio y amenities.',
        'Revisa detalles y políticas antes de reservar.',
      ],
    },
    faq: [
      { question: '¿Cómo encuentro propiedades cerca de Bogotá?', answer: 'Usa la colección cerca-de-bogota o filtra por ciudad.' },
    ],
    relatedCollections: ['cerca-de-bogota'],
    relatedProperties: [],
    reviewedAt: new Date().toISOString(),
  },
];
