import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInputInstance, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { Banner } from '@/components/States';
import { Stepper } from '@/components/Stepper';
import { getApiErrorMessage, getApiErrorStatus, getApiFieldErrors } from '@/lib/api';
import { colors, radius, spacing, typography } from '@/lib/design-tokens';
import {
  AMENITY_OPTIONS,
  API_FIELD_TO_FORM_FIELD,
  createHostProperty,
  PROPERTY_LIMITS,
  PropertyFormErrors,
  validatePropertyForm,
} from '@/lib/host';
import { HOST_DASHBOARD_URL, openExternalUrl } from '@/lib/support';
import type { HostProperty } from '@/lib/types';

function formErrorsFromApi(err: unknown): PropertyFormErrors {
  const result: PropertyFormErrors = {};
  for (const [apiField, message] of Object.entries(getApiFieldErrors(err))) {
    const field = API_FIELD_TO_FORM_FIELD[apiField];
    if (field) result[field] = message;
  }
  return result;
}

export default function NewPropertyScreen() {
  const router = useRouter();
  const cityRef = useRef<TextInputInstance>(null);
  const descriptionRef = useRef<TextInputInstance>(null);
  const priceRef = useRef<TextInputInstance>(null);
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [maxGuests, setMaxGuests] = useState(2);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [errors, setErrors] = useState<PropertyFormErrors>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<HostProperty | null>(null);

  const toggleAmenity = (value: string) => {
    setAmenities((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  const resetForm = () => {
    setTitle('');
    setCity('');
    setDescription('');
    setPrice('');
    setMaxGuests(2);
    setAmenities([]);
    setErrors({});
    setError('');
    setCreated(null);
  };

  const handleSubmit = async () => {
    if (loading) return;

    const { errors: found, payload } = validatePropertyForm({ title, city, description, price, maxGuests, amenities });
    setErrors(found);
    setError('');
    if (!payload) return;

    setLoading(true);
    try {
      setCreated(await createHostProperty(payload));
    } catch (err) {
      const fieldErrors = formErrorsFromApi(err);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        setError('Revisa los campos marcados.');
      } else {
        const message = getApiErrorMessage(err, 'No pudimos crear la propiedad. Inténtalo de nuevo.');
        // Without any answer the property may have been created: avoid a duplicate listing on retry.
        setError(
          getApiErrorStatus(err) === undefined
            ? `${message} Antes de reintentar, revisa «Propiedades» para no duplicar el anuncio.`
            : message,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <Screen title="Propiedad creada" back backHref="/(host)/properties">
        <Banner tone="success">{`«${created.title}» se creó y quedó en revisión.`}</Banner>
        <Text style={styles.body}>
          Nuestro equipo la revisará antes de publicarla. Para que los huéspedes la vean mejor, agrega fotos desde el
          panel web de anfitrión.
        </Text>
        <View style={styles.actions}>
          <Button size="lg" fullWidth onPress={() => router.replace('/(host)/properties')}>
            Ver mis propiedades
          </Button>
          <Button variant="secondary" size="lg" fullWidth onPress={() => void openExternalUrl(HOST_DASHBOARD_URL)}>
            Agregar fotos en el panel web
          </Button>
          <Button variant="ghost" size="lg" fullWidth onPress={resetForm}>
            Agregar otra propiedad
          </Button>
        </View>
      </Screen>
    );
  }

  const { title: titleLimits, description: descriptionLimits, city: cityLimits, guests } = PROPERTY_LIMITS;

  return (
    <Screen
      title="Nueva propiedad"
      back
      backHref="/(host)/properties"
      footer={
        <Button size="lg" fullWidth loading={loading} onPress={handleSubmit} accessibilityLabel="Crear propiedad">
          Crear propiedad
        </Button>
      }
    >
      <Text style={styles.intro}>
        Cuéntanos de tu alojamiento. Lo revisaremos antes de publicarlo para los huéspedes.
      </Text>
      {error ? <Banner tone="error">{error}</Banner> : null}

      <Input
        label="Título"
        value={title}
        onChangeText={setTitle}
        placeholder="Cabaña acogedora en el bosque"
        error={errors.title}
        maxLength={titleLimits.max}
        autoCapitalize="sentences"
        returnKeyType="next"
        onSubmitEditing={() => cityRef.current?.focus()}
        editable={!loading}
      />
      <Input
        ref={cityRef}
        label="Ciudad"
        value={city}
        onChangeText={setCity}
        placeholder="Guatapé"
        error={errors.city}
        maxLength={cityLimits.max}
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => descriptionRef.current?.focus()}
        editable={!loading}
      />
      <Input
        ref={descriptionRef}
        label="Descripción"
        value={description}
        onChangeText={setDescription}
        placeholder="Cuenta qué hace especial a tu propiedad"
        hint={`Entre ${descriptionLimits.min} y ${descriptionLimits.max} caracteres (${description.trim().length}).`}
        error={errors.description}
        multiline
        maxLength={descriptionLimits.max}
        autoCapitalize="sentences"
        editable={!loading}
      />
      <Input
        ref={priceRef}
        label="Precio por noche (COP)"
        value={price}
        onChangeText={setPrice}
        placeholder="350000"
        hint="En pesos colombianos, sin decimales."
        error={errors.price}
        keyboardType="number-pad"
        returnKeyType="done"
        editable={!loading}
      />

      <View style={styles.stepper}>
        <Stepper
          label="Máximo de huéspedes"
          value={maxGuests}
          min={guests.min}
          max={guests.max}
          onChange={setMaxGuests}
        />
        {errors.maxGuests ? <Text style={styles.errorText}>{errors.maxGuests}</Text> : null}
      </View>

      <Text style={styles.label}>Comodidades (opcional)</Text>
      <View style={styles.chips}>
        {AMENITY_OPTIONS.map(({ value, label }) => {
          const active = amenities.includes(value);
          return (
            <Pressable
              key={value}
              onPress={() => toggleAmenity(value)}
              disabled={loading}
              accessibilityRole="checkbox"
              accessibilityLabel={label}
              accessibilityState={{ checked: active, disabled: loading }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      {errors.amenities ? <Text style={styles.errorText}>{errors.amenities}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: typography.sizes.caption, lineHeight: 19, color: colors.muted, marginBottom: spacing.md },
  body: { fontSize: typography.sizes.body, lineHeight: 22, color: colors.slate, marginBottom: spacing.lg },
  actions: { gap: spacing.sm },
  stepper: { marginBottom: spacing.md },
  errorText: { fontSize: typography.sizes.caption, color: colors.error, marginTop: spacing.xs },
  label: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.slate,
    marginBottom: spacing.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.freshSoft, borderColor: colors.forest },
  chipText: { fontSize: typography.sizes.caption, color: colors.slate },
  chipTextActive: { color: colors.forest, fontWeight: typography.weights.semibold },
});