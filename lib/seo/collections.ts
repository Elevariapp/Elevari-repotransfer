import { siteUrl } from '../site-url';
import { ENTITY_GRAPH } from './entity-graph';

export type CollectionPredicate = {
  city?: string;
  amenities?: string[];
  radiusKm?: number;
  center?: { lat: number; lon: number };
};

export type CollectionDefinition = {
  slug: string;
  keyword: string;
  intention: string;
  predicate: CollectionPredicate;
  title: string;
  description: string;
  editorial: string;
  faq: { q: string; a: string }[];
  canonical: string;
};

export const COLLECTIONS: CollectionDefinition[] = [
  {
    slug: 'cerca-de-bogota',
    keyword: 'escapadas cerca de bogotá',
    intention: 'escapadas fin de semana',
    predicate: { city: 'Bogotá' },
    title: 'Escapadas cerca de Bogotá',
    description: 'Glamping y cabañas a menos de 2 horas de Bogotá para escapadas de fin de semana.',
    editorial: 'Descubre propiedades reales cerca de Bogotá con acceso rápido desde la ciudad.',
    faq: [
      { q: '¿A qué distancia están?', a: 'Todas las propiedades están a menos de 2 horas de Bogotá.' },
      { q: '¿Se puede ir en fin de semana?', a: 'Sí, ideal para escapadas de 2 a 3 días.' },
    ],
    canonical: '/cerca-de-bogota',
  },
  {
    slug: 'glamping-con-fogata',
    keyword: 'glamping con fogata',
    intention: 'glamping con fogata',
    predicate: { amenities: ['fogata'] },
    title: 'Glamping con fogata',
    description: 'Propiedades con fogata para noches cálidas bajo las estrellas.',
    editorial: 'Disfruta de noches alrededor del fuego en glamping verificado.',
    faq: [
      { q: '¿La fogata está incluida?', a: 'Sí, las propiedades listadas cuentan con área de fogata.' },
    ],
    canonical: '/glamping-con-fogata',
  },
  {
    slug: 'glamping-con-wifi',
    keyword: 'glamping con wifi',
    intention: 'glamping con wifi',
    predicate: { amenities: ['wifi'] },
    title: 'Glamping con WiFi',
    description: 'Conecta con la naturaleza sin desconectarte del trabajo.',
    editorial: 'Espacios con conexión estable para trabajo remoto.',
    faq: [
      { q: '¿El WiFi es estable?', a: 'Las propiedades verificadas ofrecen conexión funcional.' },
    ],
    canonical: '/glamping-con-wifi',
  },
  {
    slug: 'glamping-con-vista',
    keyword: 'glamping con vista',
    intention: 'glamping con vista',
    predicate: { amenities: ['vista'] },
    title: 'Glamping con vista',
    description: 'Propiedades con vistas panorámicas a montañas y valles.',
    editorial: 'Despierta con vistas espectaculares en glamping real.',
    faq: [
      { q: '¿Qué tipo de vistas?', a: 'Montaña, valle y atardeceres verificados.' },
    ],
    canonical: '/glamping-con-vista',
  },
  {
    slug: 'glamping-con-estacionamiento',
    keyword: 'glamping con estacionamiento',
    intention: 'glamping con estacionamiento',
    predicate: { amenities: ['estacionamiento'] },
    title: 'Glamping con estacionamiento',
    description: 'Llega tranquilo con espacio para tu vehículo.',
    editorial: 'Propiedades con estacionamiento seguro.',
    faq: [
      { q: '¿Es gratuito?', a: 'El estacionamiento está incluido en la propiedad.' },
    ],
    canonical: '/glamping-con-estacionamiento',
  },
  {
    slug: 'escapadas',
    keyword: 'escapadas fin de semana',
    intention: 'escapadas',
    predicate: {},
    title: 'Escapadas de fin de semana',
    description: 'Escapadas reales para desconectar.',
    editorial: 'Selecciona propiedades verificadas para tu próximo fin de semana.',
    faq: [
      { q: '¿Cuánto dura?', a: 'Ideal para 2 a 3 noches.' },
    ],
    canonical: '/escapadas',
  },
  {
    slug: 'naturaleza',
    keyword: 'glamping naturaleza',
    intention: 'naturaleza',
    predicate: {},
    title: 'Glamping en la naturaleza',
    description: 'Inmersión total en entornos naturales.',
    editorial: 'Propiedades rodeadas de naturaleza verificada.',
    faq: [
      { q: '¿Hay actividades?', a: 'Depende de la propiedad, consulta detalles.' },
    ],
    canonical: '/naturaleza',
  },
  {
    slug: 'glamping',
    keyword: 'glamping colombia',
    intention: 'glamping',
    predicate: {},
    title: 'Glamping en Colombia',
    description: 'El mejor glamping verificado en Colombia.',
    editorial: 'Catálogo oficial de glamping con inventario real.',
    faq: [
      { q: '¿Qué es glamping?', a: 'Glamping es camping con confort.' },
    ],
    canonical: '/glamping',
  },
  {
    slug: 'fin-de-semana',
    keyword: 'glamping fin de semana',
    intention: 'fin de semana',
    predicate: {},
    title: 'Glamping fin de semana',
    description: 'Plan perfecto para el fin de semana.',
    editorial: 'Propiedades disponibles para escapadas cortas.',
    faq: [
      { q: '¿Se puede reservar con poca anticipación?', a: 'Depende de disponibilidad.' },
    ],
    canonical: '/fin-de-semana',
  },
];

export const COLLECTION_MAP = new Map(COLLECTIONS.map(c => [c.slug, c]));

export function collectionCanonical(slug: string) {
  return siteUrl(`/collections/${slug}`);
}

export function getCollection(slug: string): CollectionDefinition | undefined {
  return COLLECTION_MAP.get(slug);
}

export function buildCollectionUrl(slug: string) {
  return siteUrl(`/${slug}`);
}
