export type EntityType = 'Location' | 'Amenity' | 'Experience' | 'Intention';

export type SeoEntityNode = {
  id: string;
  type: EntityType;
  name: string;
  slug: string;
  canonical: string;
  keyword: string;
  intention: string;
  description?: string;
};

export const ENTITY_GRAPH: SeoEntityNode[] = [
  // Ubicación
  { id: 'loc-bogota', type: 'Location', name: 'Bogotá', slug: 'bogota', canonical: '/bogota', keyword: 'glamping bogotá', intention: 'escapadas cerca de bogotá', description: 'Glamping cerca de Bogotá' },
  { id: 'loc-cundinamarca', type: 'Location', name: 'Cundinamarca', slug: 'cundinamarca', canonical: '/cundinamarca', keyword: 'glamping cundinamarca', intention: 'naturaleza cundinamarca', description: 'Glamping en Cundinamarca' },
  { id: 'loc-cerca-bogota', type: 'Location', name: 'Escapadas cerca de Bogotá', slug: 'cerca-de-bogota', canonical: '/cerca-de-bogota', keyword: 'escapadas cerca de bogotá', intention: 'escapadas fin de semana', description: 'Escapadas de fin de semana cerca de Bogotá' },

  // Amenidades
  { id: 'amen-wifi', type: 'Amenity', name: 'WiFi', slug: 'glamping-con-wifi', canonical: '/glamping-con-wifi', keyword: 'glamping con wifi', intention: 'glamping con wifi', description: 'Propiedades con conexión WiFi' },
  { id: 'amen-fogata', type: 'Amenity', name: 'Fogata', slug: 'glamping-con-fogata', canonical: '/glamping-con-fogata', keyword: 'glamping con fogata', intention: 'glamping con fogata', description: 'Propiedades con fogata' },
  { id: 'amen-vista', type: 'Amenity', name: 'Vista', slug: 'glamping-con-vista', canonical: '/glamping-con-vista', keyword: 'glamping con vista', intention: 'glamping con vista', description: 'Propiedades con vista panorámica' },
  { id: 'amen-estacionamiento', type: 'Amenity', name: 'Estacionamiento', slug: 'glamping-con-estacionamiento', canonical: '/glamping-con-estacionamiento', keyword: 'glamping con estacionamiento', intention: 'glamping con estacionamiento', description: 'Propiedades con estacionamiento' },

  // Intenciones
  { id: 'int-escapadas', type: 'Intention', name: 'Escapadas', slug: 'escapadas', canonical: '/escapadas', keyword: 'escapadas fin de semana', intention: 'escapadas', description: 'Escapadas de fin de semana' },
  { id: 'int-naturaleza', type: 'Intention', name: 'Naturaleza', slug: 'naturaleza', canonical: '/naturaleza', keyword: 'glamping naturaleza', intention: 'naturaleza', description: 'Glamping en contacto con la naturaleza' },
  { id: 'int-glamping', type: 'Intention', name: 'Glamping', slug: 'glamping', canonical: '/glamping', keyword: 'glamping colombia', intention: 'glamping', description: 'Glamping en Colombia' },
  { id: 'int-fin-semana', type: 'Intention', name: 'Fin de semana', slug: 'fin-de-semana', canonical: '/fin-de-semana', keyword: 'glamping fin de semana', intention: 'fin de semana', description: 'Escapadas de fin de semana' },
];

export const ENTITY_MAP = new Map(ENTITY_GRAPH.map(e => [e.slug, e]));
