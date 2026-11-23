import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Banner } from '@/components/States';
import { SceneScreen } from '@/components/scene/SceneScreen';
import { api, getApiErrorMessage } from '@/lib/api';
import { normalizeEmail } from '@/lib/auth';
import { colors, spacing, typography } from '@/lib/design-tokens';
import type { SuccessResponse } from '@/lib/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;

    const address = normalizeEmail(email);
    const nextEmailError = !address
      ? 'Ingresa tu correo electrónico.'
      : !EMAIL_PATTERN.test(address)
        ? 'Revisa el formato del correo (nombre@correo.com).'
        : '';
    setEmailError(nextEmailError);
    setError('');
    if (nextEmailError) return;

    setLoading(true);
    try {
      const response = await api.post<SuccessResponse>('/auth/forgot-password', { email: address });
      setMessage(response.message ?? '');
      setSentTo(address);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos enviar el correo. Inténtalo de nuevo en unos minutos.'));
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => router.replace('/(auth)/login');

  return (
    <SceneScreen>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {sentTo ? 'Revisa tu correo' : 'Recupera tu contraseña'}
        </Text>
        <Text style={styles.subtitle}>
          {sentTo
            ? `Si ${sentTo} tiene una cuenta en Elevari, te enviamos un enlace para crear una contraseña nueva.`
            : 'Ingresa tu correo y te enviaremos un enlace para crear una contraseña nueva.'}
        </Text>
      </View>

      {sentTo ? (
        <>
          <Banner tone="success">
            {message || 'Si el correo existe, recibirás las instrucciones en unos minutos.'}
          </Banner>
          <Text style={styles.hint}>
            El enlace abre la página de Elevari en tu navegador. Si no lo ves, revisa la carpeta de spam.
          </Text>
          <Button variant="primary" size="lg" fullWidth onPress={goToLogin}>
            Volver a iniciar sesión
          </Button>
          <View style={styles.spacer} />
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onPress={() => {
              setSentTo(null);
              setMessage('');
            }}
          >
            Usar otro correo
          </Button>
        </>
      ) : (
        <>
          <Input
            label="Correo electrónico"
            placeholder="tu@correo.com"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            returnKeyType="send"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={handleSubmit}
            error={emailError || undefined}
          />

          {error ? <Banner tone="error">{error}</Banner> : null}

          <Button variant="primary" size="lg" loading={loading} fullWidth onPress={handleSubmit}>
            Enviar enlace
          </Button>
          <View style={styles.spacer} />
          <Button variant="ghost" size="lg" fullWidth onPress={goToLogin}>
            Volver a iniciar sesión
          </Button>
        </>
      )}
    </SceneScreen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: spacing.lg },
  title: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.ink,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: { fontSize: typography.sizes.body, color: colors.muted, textAlign: 'center' },
  hint: { fontSize: typography.sizes.caption, color: colors.muted, textAlign: 'center', marginBottom: spacing.md, lineHeight: 19 },
  spacer: { height: spacing.sm },
});
