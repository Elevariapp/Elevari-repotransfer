import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { Banner } from '@/components/States';
import { WhatsAppLink } from '@/components/WhatsAppLink';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { deleteAccount } from '@/lib/session';
import { useAppStore } from '@/lib/store';

export default function AccountDeletionConfirmScreen() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  // Google accounts have no password: they confirm by typing their e-mail.
  const needsPassword = user?.has_password !== false;
  const [secret, setSecret] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [hasActiveBookings, setHasActiveBookings] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError('');
    setFieldError('');
    setHasActiveBookings(false);
    try {
      // On success the session is cleared and the route guards send the user to the login screen.
      await deleteAccount(needsPassword ? { password: secret } : { email: secret });
    } catch (err) {
      const code = getApiErrorCode(err);
      const message = getApiErrorMessage(err, 'No pudimos eliminar tu cuenta. Inténtalo de nuevo.');
      if (code === 'invalid_password' || code === 'invalid_confirmation') {
        setFieldError(message);
      } else {
        setError(message);
        setHasActiveBookings(code === 'active_bookings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (loading) return;
    if (!secret.trim()) {
      setFieldError(needsPassword ? 'Ingresa tu contraseña para confirmar.' : 'Escribe tu correo para confirmar.');
      return;
    }
    setFieldError('');

    Alert.alert('¿Eliminar tu cuenta?', 'Esta acción es permanente y no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void submit() },
    ]);
  };

  return (
    <Screen title="Confirmar eliminación" back backHref="/(guest)/profile">
      <Text style={styles.subtitle}>
        Esta acción es permanente. No podrás recuperar tu cuenta ni tus datos.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>¿Qué ocurrirá?</Text>
        <Text style={styles.body}>
          Tu perfil, reservas, listados y datos personales se eliminarán de forma permanente.
          Algunos datos podrán conservarse de forma anonimizada o por obligaciones legales y
          fiscales en Colombia.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Confirma que eres tú</Text>
        {error ? <Banner tone="error">{error}</Banner> : null}
        {hasActiveBookings ? (
          <View style={styles.actions}>
            <Button variant="secondary" fullWidth onPress={() => router.push('/(guest)/my-bookings')}>
              Ver mis reservas
            </Button>
            <WhatsAppLink label="Ayuda por WhatsApp" align="center" />
          </View>
        ) : null}

        {needsPassword ? (
          <Input
            label="Contraseña"
            value={secret}
            onChangeText={setSecret}
            error={fieldError || undefined}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={handleDelete}
            editable={!loading}
          />
        ) : (
          <Input
            label="Escribe tu correo para confirmar"
            value={secret}
            onChangeText={setSecret}
            placeholder={user?.email}
            hint="Tu cuenta se creó con Google y no tiene contraseña."
            error={fieldError || undefined}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="done"
            onSubmitEditing={handleDelete}
            editable={!loading}
          />
        )}
      </View>

      <Button
        variant="danger"
        size="lg"
        fullWidth
        loading={loading}
        onPress={handleDelete}
        accessibilityLabel="Sí, eliminar mi cuenta"
      >
        Sí, eliminar mi cuenta
      </Button>
      <Button variant="ghost" size="lg" fullWidth disabled={loading} onPress={() => router.back()} style={styles.cancel}>
        Cancelar
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: typography.sizes.caption,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: typography.sizes.body,
    color: colors.slate,
    lineHeight: 22,
  },
  actions: { gap: spacing.sm, marginBottom: spacing.md },
  cancel: { marginTop: spacing.sm },
});