import type { ComponentProps } from 'react';
import type Badge from '@/components/ui/Badge';
import type { PropertyStatus } from '@/lib/api-client';

type BadgeTone = NonNullable<ComponentProps<typeof Badge>['tone']>;

export interface PropertyStatusMeta {
  label: string;
  tone: BadgeTone;
  /** One line shown under the property so hosts know what the status means for them. */
  description: string;
}

export const PROPERTY_STATUS_META: Record<PropertyStatus, PropertyStatusMeta> = {
  draft: {
    label: 'En revisión',
    tone: 'accent',
    description: 'Aún no es visible para los huéspedes. La publicaremos cuando termine la revisión.',
  },
  published: {
    label: 'Publicada',
    tone: 'brand',
    description: 'Visible en el catálogo y lista para recibir reservas.',
  },
  unavailable: {
    label: 'No disponible',
    tone: 'neutral',
    description: 'No aparece en el catálogo ni recibe reservas por ahora.',
  },
  maintenance: {
    label: 'Mantenimiento',
    tone: 'neutral',
    description: 'Está en mantenimiento: no aparece en el catálogo ni recibe reservas por ahora.',
  },
};

export function propertyStatusMeta(status: string): PropertyStatusMeta {
  return (
    PROPERTY_STATUS_META[status as PropertyStatus] ?? {
      label: status || 'Sin estado',
      tone: 'neutral',
      description: '',
    }
  );
}
