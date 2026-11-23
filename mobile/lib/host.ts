import { api } from './api';
import type { StatusTone } from './booking';
import type {
  CreateHostPropertyInput,
  CreateHostPropertyResponse,
  HostProperty,
  HostPropertiesResponse,
  PropertyStatus,
} from './types';

export const HOST_STATUS_LABELS: Record<PropertyStatus, string> = {
  draft: 'En revisión',
  published: 'Publicada',
  unavailable: 'No disponible',
  maintenance: 'Mantenimiento',
};

export const HOST_STATUS_TONES: Record<PropertyStatus, StatusTone> = {
  draft: 'warning',
  published: 'success',
  unavailable: 'neutral',
  maintenance: 'info',
};

// Same limits as the API (`api/src/routes/host.ts`).
export const PROPERTY_LIMITS = {
  title: { min: 3, max: 120 },
  description: { min: 20, max: 5000 },
  city: { min: 2, max: 80 },
  maxPrice: 99_999_999,
  guests: { min: 1, max: 20 },
  maxAmenities: 30,
} as const;

// The first four are the keys the public catalog filters by, so they must keep this exact form.
export const AMENITY_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'wifi', label: 'WiFi' },
  { value: 'fogata', label: 'Fogata' },
  { value: 'vista', label: 'Vista panorámica' },
  { value: 'estacionamiento', label: 'Estacionamiento' },
  { value: 'Agua caliente', label: 'Agua caliente' },
  { value: 'Cocina', label: 'Cocina' },
  { value: 'Pet friendly', label: 'Pet friendly' },
];

export interface PropertyFormValues {
  title: string;
  city: string;
  description: string;
  price: string;
  maxGuests: number;
  amenities: string[];
}

export type PropertyFormField = 'title' | 'city' | 'description' | 'price' | 'maxGuests' | 'amenities';
export type PropertyFormErrors = Partial<Record<PropertyFormField, string>>;

// Maps the API's field names to the form's.
export const API_FIELD_TO_FORM_FIELD: Record<string, PropertyFormField> = {
  title: 'title',
  city: 'city',
  description: 'description',
  price_per_night: 'price',
  max_guests: 'maxGuests',
  amenities: 'amenities',
};

// Accepts "350000", "350.000", "350,000" or "$ 1.350.000". Prices are whole pesos, so decimals are rejected.
export function parsePrice(input: string): number | null {
  const cleaned = input.replace(/COP|[\s$]/gi, '');
  if (/^\d+$/.test(cleaned)) return Number(cleaned);
  if (/^\d{1,3}([.,]\d{3})+$/.test(cleaned)) return Number(cleaned.replace(/[.,]/g, ''));
  return null;
}

function lengthError(value: string, min: number, max: number, required: string, noun: string): string | undefined {
  if (!value) return required;
  if (value.length < min) return `${noun} debe tener al menos ${min} caracteres.`;
  if (value.length > max) return `${noun} no puede superar los ${max} caracteres.`;
  return undefined;
}

export function validatePropertyForm(values: PropertyFormValues): {
  errors: PropertyFormErrors;
  payload: CreateHostPropertyInput | null;
} {
  const errors: PropertyFormErrors = {};
  const title = values.title.trim();
  const city = values.city.trim();
  const description = values.description.trim();
  const { title: titleLimits, city: cityLimits, description: descriptionLimits } = PROPERTY_LIMITS;

  const titleError = lengthError(title, titleLimits.min, titleLimits.max, 'El título es obligatorio.', 'El título');
  if (titleError) errors.title = titleError;

  const cityError = lengthError(city, cityLimits.min, cityLimits.max, 'La ciudad es obligatoria.', 'La ciudad');
  if (cityError) errors.city = cityError;

  const descriptionError = lengthError(
    description,
    descriptionLimits.min,
    descriptionLimits.max,
    'La descripción es obligatoria.',
    'La descripción',
  );
  if (descriptionError) errors.description = descriptionError;

  let price: number | null = null;
  if (!values.price.trim()) {
    errors.price = 'El precio por noche es obligatorio.';
  } else {
    price = parsePrice(values.price.trim());
    if (price === null) errors.price = 'Escribe el precio en pesos, sin decimales (por ejemplo 350000 o 350.000).';
    else if (price < 1) errors.price = 'El precio por noche debe ser mayor a 0.';
    else if (price > PROPERTY_LIMITS.maxPrice) errors.price = 'El precio por noche es demasiado alto.';
  }

  const { guests } = PROPERTY_LIMITS;
  if (!Number.isInteger(values.maxGuests) || values.maxGuests < guests.min || values.maxGuests > guests.max) {
    errors.maxGuests = `El máximo de huéspedes debe estar entre ${guests.min} y ${guests.max}.`;
  }

  if (values.amenities.length > PROPERTY_LIMITS.maxAmenities) {
    errors.amenities = `Puedes elegir hasta ${PROPERTY_LIMITS.maxAmenities} comodidades.`;
  }

  if (Object.keys(errors).length > 0 || price === null) return { errors, payload: null };
  return {
    errors,
    payload: {
      title,
      description,
      city,
      price_per_night: price,
      max_guests: values.maxGuests,
      amenities: values.amenities,
    },
  };
}

export async function fetchHostProperties(): Promise<HostProperty[]> {
  const response = await api.get<HostPropertiesResponse>('/host/properties');
  return Array.isArray(response.data) ? response.data : [];
}

export async function createHostProperty(input: CreateHostPropertyInput): Promise<HostProperty> {
  const response = await api.post<CreateHostPropertyResponse>('/host/properties', input);
  return response.property;
}
