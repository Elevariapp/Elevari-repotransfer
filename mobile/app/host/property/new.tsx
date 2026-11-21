import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Alert } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ErrorBanner } from '@/components/StateViews';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import type { CreateHostPropertyBody } from '@/types';

export default function NewPropertyScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [maxGuests, setMaxGuests] = useState('2');
  const [amenities, setAmenities] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): CreateHostPropertyBody | string => {
    const cleanTitle = title.trim();
    const cleanCity = city.trim();
    const cleanDescription = description.trim();
    const pricePerNight = Number(price.replace(/[^\d.]/g, ''));
    const guests = Number(maxGuests);

    if (cleanTitle.length < 3 || cleanTitle.length > 120) return 'El título debe tener entre 3 y 120 caracteres.';
    if (cleanCity.length < 2 || cleanCity.length > 80) return 'Ingresa la ciudad (entre 2 y 80 caracteres).';
    if (!Number.isFinite(pricePerNight) || pricePerNight <= 0) return 'Ingresa un precio por noche válido.';
    if (cleanDescription.length < 20) return 'La descripción debe tener al menos 20 caracteres.';
    if (cleanDescription.length > 5000) return 'La descripción no puede superar 5000 caracteres.';
    if (!Number.isInteger(guests) || guests < 1 || guests > 20) return 'La capacidad debe estar entre 1 y 20 huéspedes.';

    return {
      title: cleanTitle,
      description: cleanDescription,
      city: cleanCity,
      price_per_night: pricePerNight,
      max_guests: guests,
      amenities: amenities
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    };
  };

  const handleSubmit = async () => {
    const result = validate();
    if (typeof result === 'string') {
      setError(result);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/host/properties', result);
      Alert.alert(
        'Propiedad creada',
        'Se guardó como borrador. Se publicará cuando el equipo de Elevari la revise.'
      );
      router.replace('/host/properties');
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos crear la propiedad.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Nueva propiedad</Text>
          <Text style={styles.subtitle}>Crea tu anuncio en Elevari</Text>
        </View>

        <View style={styles.form}>
          <Input label="Título" placeholder="Cabaña acogedora en el bosque" value={title} onChangeText={setTitle} maxLength={120} />
          <Input label="Ciudad" placeholder="Guatapé" value={city} onChangeText={setCity} maxLength={80} />
          <Input label="Precio por noche (COP)" placeholder="150000" keyboardType="number-pad" value={price} onChangeText={setPrice} />
          <Input
            label="Descripción"
            placeholder="Cuenta qué hace especial a tu propiedad"
            hint="Mínimo 20 caracteres"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
          <Input label="Capacidad (huéspedes)" placeholder="4" keyboardType="number-pad" value={maxGuests} onChangeText={setMaxGuests} maxLength={2} />
          <Input
            label="Comodidades"
            placeholder="wifi, jacuzzi, chimenea"
            hint="Sepáralas con comas (opcional)"
            autoCapitalize="none"
            value={amenities}
            onChangeText={setAmenities}
          />
        </View>

        <ErrorBanner message={error} />

        <Button variant="primary" size="lg" fullWidth loading={loading} disabled={loading} onPress={handleSubmit}>
          Crear propiedad
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  header: { marginBottom: spacing.lg },
  title: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink, marginBottom: spacing.xs },
  subtitle: { fontSize: typography.sizes.body, color: colors.muted },
  form: { gap: spacing.xs, marginBottom: spacing.sm },
});
