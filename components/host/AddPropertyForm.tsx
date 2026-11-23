'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ApiError, wanaApi } from '@/lib/api-client';
import { CATALOG_AMENITIES } from '@/lib/catalog-params';
import { formatCop } from '@/lib/format';
import { MEDIA_ACCEPT, MEDIA_FORMATS_HINT, uploadPropertyMedia, validateMediaFile } from '@/lib/media-api';
import { hostErrorMessage, isUnauthorized } from './errors';
import HostGate from './HostGate';

// Limits mirror createPropertySchema in api/src/routes/host.ts.
const LIMITS = {
  title: { min: 3, max: 120 },
  city: { min: 2, max: 80 },
  description: { min: 20, max: 5000 },
  maxPrice: 99_999_999,
  guests: { min: 1, max: 20 },
};

// The catalog filters amenities by exact key, so the shared ones must be stored in canonical form.
const AMENITY_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  ...CATALOG_AMENITIES,
  { value: 'Agua caliente', label: 'Agua caliente' },
  { value: 'Cocina', label: 'Cocina' },
  { value: 'Pet friendly', label: 'Pet friendly' },
];

type Field = 'title' | 'city' | 'description' | 'price' | 'max_guests' | 'amenities' | 'file';
type FieldErrors = Partial<Record<Field, string>>;
type Stage = 'idle' | 'creating' | 'uploading' | 'redirecting';

interface Values {
  title: string;
  city: string;
  description: string;
  price: string;
  maxGuests: string;
}

const API_FIELDS: Record<string, Field> = {
  title: 'title',
  city: 'city',
  description: 'description',
  price_per_night: 'price',
  max_guests: 'max_guests',
  amenities: 'amenities',
};

/** Accepts "350000", "350.000", "350,000" or "$ 1.350.000". Prices are whole pesos, so decimals are rejected. */
function parsePrice(input: string): number | null {
  const cleaned = input.replace(/COP|[\s$]/gi, '');
  if (/^\d+$/.test(cleaned)) return Number(cleaned);
  if (/^\d{1,3}([.,]\d{3})+$/.test(cleaned)) return Number(cleaned.replace(/[.,]/g, ''));
  return null;
}

function lengthError(value: string, min: number, max: number, required: string, noun: string) {
  if (!value) return required;
  if (value.length < min) return `${noun} debe tener al menos ${min} caracteres`;
  if (value.length > max) return `${noun} no puede superar los ${max} caracteres`;
  return undefined;
}

function validate(values: Values, amenities: string[], file: File | null) {
  const errors: FieldErrors = {};
  const title = values.title.trim();
  const city = values.city.trim();
  const description = values.description.trim();

  const titleError = lengthError(title, LIMITS.title.min, LIMITS.title.max, 'El título es obligatorio', 'El título');
  if (titleError) errors.title = titleError;
  const cityError = lengthError(city, LIMITS.city.min, LIMITS.city.max, 'La ciudad es obligatoria', 'La ciudad');
  if (cityError) errors.city = cityError;
  const descriptionError = lengthError(
    description,
    LIMITS.description.min,
    LIMITS.description.max,
    'La descripción es obligatoria',
    'La descripción',
  );
  if (descriptionError) errors.description = descriptionError;

  let price: number | null = null;
  if (!values.price.trim()) {
    errors.price = 'El precio por noche es obligatorio';
  } else {
    price = parsePrice(values.price.trim());
    if (price === null) errors.price = 'Escribe el precio en pesos, sin decimales (por ejemplo 350000 o 350.000)';
    else if (price < 1) errors.price = 'El precio por noche debe ser mayor a 0';
    else if (price > LIMITS.maxPrice) errors.price = 'El precio por noche es demasiado alto';
  }

  let maxGuests: number | null = null;
  const guestsText = values.maxGuests.trim();
  if (!/^\d+$/.test(guestsText)) {
    errors.max_guests = 'Indica cuántos huéspedes caben, con un número entero';
  } else {
    maxGuests = Number(guestsText);
    if (maxGuests < LIMITS.guests.min) errors.max_guests = 'El máximo de huéspedes debe ser al menos 1';
    else if (maxGuests > LIMITS.guests.max) errors.max_guests = `El máximo de huéspedes es ${LIMITS.guests.max}`;
  }

  const fileError = file ? validateMediaFile(file) : null;
  if (fileError) errors.file = fileError;

  if (Object.keys(errors).length > 0 || price === null || maxGuests === null) {
    return { errors, payload: null };
  }
  return {
    errors,
    payload: { title, description, city, price_per_night: price, max_guests: maxGuests, amenities },
  };
}

/** Field messages the API returns in `details.fieldErrors` (already in Spanish). */
function fieldErrorsFromApi(details: unknown): FieldErrors {
  const fieldErrors = (details as { fieldErrors?: Record<string, unknown> } | null | undefined)?.fieldErrors;
  const result: FieldErrors = {};
  if (!fieldErrors || typeof fieldErrors !== 'object') return result;
  for (const [apiField, messages] of Object.entries(fieldErrors)) {
    const field = API_FIELDS[apiField];
    const message = Array.isArray(messages) ? messages.find((m): m is string => typeof m === 'string') : undefined;
    if (field && message) result[field] = message;
  }
  return result;
}

export default function AddPropertyForm() {
  return (
    <HostGate redirectTo="/host/add-property">
      <PropertyForm />
    </HostGate>
  );
}

function PropertyForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const submitting = useRef(false);
  const [values, setValues] = useState<Values>({ title: '', city: '', description: '', price: '', maxGuests: '2' });
  const [amenities, setAmenities] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<{ message: string; sessionExpired: boolean } | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const busy = stage !== 'idle';

  // Runs after the errors are committed so aria-invalid is already in the DOM.
  useEffect(() => {
    if (focusRequest > 0) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusRequest]);

  const showErrors = (next: FieldErrors) => {
    setErrors(next);
    setFocusRequest((n) => n + 1);
  };

  const clearError = (field: Field) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const change =
    (key: keyof Values, field: Field) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setValues((prev) => ({ ...prev, [key]: value }));
      clearError(field);
    };

  const toggleAmenity = (value: string) => {
    setAmenities((prev) => (prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]));
    clearError('amenities');
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    const problem = selected ? validateMediaFile(selected) : null;
    if (problem) {
      event.target.value = '';
      setFile(null);
      setErrors((prev) => ({ ...prev, file: problem }));
      return;
    }
    setFile(selected);
    clearError('file');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;

    setFormError(null);
    const { errors: found, payload } = validate(values, amenities, file);
    if (!payload) {
      showErrors(found);
      return;
    }
    setErrors({});

    submitting.current = true;
    setStage('creating');

    let propertyId: string;
    try {
      const { property } = await wanaApi.createHostProperty(payload);
      propertyId = property.id;
    } catch (err) {
      submitting.current = false;
      setStage('idle');
      const apiErrors = err instanceof ApiError && err.status === 400 ? fieldErrorsFromApi(err.details) : {};
      if (Object.keys(apiErrors).length > 0) {
        showErrors(apiErrors);
      } else {
        setFormError({
          message: hostErrorMessage(err, 'No pudimos crear tu espacio. Inténtalo de nuevo en unos minutos.'),
          sessionExpired: isUnauthorized(err),
        });
      }
      return;
    }

    // The property exists from here on: always continue to the media page, or a retry would create a duplicate.
    setCreatedId(propertyId);
    let uploadWarning: string | null = null;
    if (file) {
      setStage('uploading');
      try {
        await uploadPropertyMedia(propertyId, file, { onProgress: setUploadPercent });
      } catch (err) {
        uploadWarning = hostErrorMessage(err, 'No pudimos subir el archivo.');
      }
    }

    setStage('redirecting');
    if (uploadWarning) {
      toast.error(
        `Tu espacio se creó, pero no pudimos subir el archivo. ${uploadWarning} Puedes agregarlo en esta pantalla.`,
        { duration: 8000 },
      );
    } else {
      toast.success('Tu espacio quedó en revisión. Agrega fotos y videos mientras lo revisamos.', {
        duration: 6000,
      });
    }
    router.push(`/host/properties/${encodeURIComponent(propertyId)}/media`);
  };

  const parsedPrice = parsePrice(values.price.trim());
  const fieldProps = (field: Field, name: string, hint = false) => ({
    id: `property-${field}`,
    name,
    disabled: busy,
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby':
      [hint ? `property-${field}-hint` : '', errors[field] ? `property-${field}-error` : ''].filter(Boolean).join(' ') ||
      undefined,
  });
  const inputClass = (field: Field) => `elevari-input${errors[field] ? ' border-elevari-error' : ''}`;

  const statusText =
    stage === 'creating'
      ? 'Creando tu espacio…'
      : stage === 'uploading'
        ? `Subiendo el archivo… ${uploadPercent}%`
        : stage === 'redirecting'
          ? 'Listo. Abriendo tus fotos y videos…'
          : '';
  const buttonLabel =
    stage === 'creating'
      ? 'Creando…'
      : stage === 'uploading'
        ? 'Subiendo archivo…'
        : stage === 'redirecting'
          ? 'Abriendo…'
          : 'Crear espacio';

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      aria-busy={busy}
      className="elevari-card space-y-6 p-6 sm:p-8"
    >
      <div className="rounded-xl border border-elevari-amber/30 bg-elevari-ivory/80 p-4 text-sm text-elevari-slate">
        <p className="font-semibold">Guía de calidad</p>
        <p className="mt-1 text-elevari-muted">
          Usa fotos bien iluminadas en alta resolución. Tu espacio quedará en revisión hasta que nuestro equipo lo
          publique; mientras tanto no será visible para los huéspedes.
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-elevari-error/25 bg-elevari-error-soft p-4 text-sm text-elevari-error"
        >
          <p>{formError.message}</p>
          {formError.sessionExpired && (
            <Link href="/auth/login?redirect=%2Fhost%2Fadd-property" className="mt-2 inline-block font-semibold underline">
              Iniciar sesión
            </Link>
          )}
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <p role="alert" className="text-sm font-medium text-elevari-error">
          Revisa los campos marcados e inténtalo de nuevo.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell field="title" label="Título" error={errors.title}>
          <input
            {...fieldProps('title', 'title')}
            type="text"
            required
            maxLength={LIMITS.title.max}
            autoComplete="off"
            value={values.title}
            onChange={change('title', 'title')}
            className={inputClass('title')}
            placeholder="Domo en el bosque"
          />
        </FieldShell>
        <FieldShell field="city" label="Ciudad / zona" error={errors.city}>
          <input
            {...fieldProps('city', 'city')}
            type="text"
            required
            maxLength={LIMITS.city.max}
            value={values.city}
            onChange={change('city', 'city')}
            className={inputClass('city')}
            placeholder="Guatavita, Cundinamarca"
          />
        </FieldShell>
      </div>

      <FieldShell
        field="description"
        label="Descripción"
        error={errors.description}
        hint={`${values.description.trim().length}/${LIMITS.description.max} caracteres · mínimo ${LIMITS.description.min}`}
      >
        <textarea
          {...fieldProps('description', 'description', true)}
          required
          rows={5}
          maxLength={LIMITS.description.max}
          value={values.description}
          onChange={change('description', 'description')}
          className={`${inputClass('description')} min-h-[120px]`}
          placeholder="Describe la experiencia, acceso y lo que incluye la estadía…"
        />
      </FieldShell>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell
          field="price"
          label="Precio por noche (COP)"
          error={errors.price}
          hint={parsedPrice !== null && parsedPrice >= 1 ? `Se mostrará como ${formatCop(parsedPrice)} por noche` : undefined}
        >
          <input
            {...fieldProps('price', 'price', parsedPrice !== null && parsedPrice >= 1)}
            type="text"
            inputMode="numeric"
            required
            value={values.price}
            onChange={change('price', 'price')}
            className={inputClass('price')}
            placeholder="350000"
          />
        </FieldShell>
        <FieldShell field="max_guests" label="Huéspedes máx." error={errors.max_guests}>
          <input
            {...fieldProps('max_guests', 'max_guests')}
            type="number"
            inputMode="numeric"
            min={LIMITS.guests.min}
            max={LIMITS.guests.max}
            step={1}
            value={values.maxGuests}
            onChange={change('maxGuests', 'max_guests')}
            className={inputClass('max_guests')}
          />
        </FieldShell>
      </div>

      <fieldset disabled={busy}>
        <legend className="elevari-label">Comodidades</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map(({ value, label }) => {
            const active = amenities.includes(value);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => toggleAmenity(value)}
                className={`elevari-chip ${active ? 'elevari-chip-active' : ''}`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {errors.amenities && <p className="mt-2 text-xs font-medium text-elevari-error">{errors.amenities}</p>}
      </fieldset>

      <FieldShell field="file" label="Foto o video destacado" optional hint={MEDIA_FORMATS_HINT} error={errors.file}>
        <input
          {...fieldProps('file', 'file', true)}
          type="file"
          accept={MEDIA_ACCEPT}
          onChange={onFileChange}
          className={`${inputClass('file')} text-sm`}
        />
      </FieldShell>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" disabled={busy} className="elevari-btn-primary min-h-[48px] w-full sm:w-auto">
          {buttonLabel}
        </button>
        {!busy && (
          <Link href="/host" className="elevari-btn-ghost min-h-[48px] w-full sm:w-auto">
            Cancelar
          </Link>
        )}
      </div>

      {busy && (
        <p role="status" className="text-sm text-elevari-muted">
          {statusText}
          {stage === 'redirecting' && createdId && (
            <>
              {' '}
              <Link
                href={`/host/properties/${encodeURIComponent(createdId)}/media`}
                className="font-semibold text-elevari-forest hover:underline"
              >
                Si no avanza, ábrelo aquí
              </Link>
            </>
          )}
        </p>
      )}
    </form>
  );
}

function FieldShell({
  field,
  label,
  optional,
  hint,
  error,
  children,
}: {
  field: Field;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={`property-${field}`} className="elevari-label block">
        {label}
        {optional && <span className="font-normal text-elevari-muted"> (opcional)</span>}
      </label>
      {children}
      {hint && (
        <p id={`property-${field}-hint`} className="text-xs text-elevari-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`property-${field}-error`} className="text-xs font-medium text-elevari-error">
          {error}
        </p>
      )}
    </div>
  );
}
