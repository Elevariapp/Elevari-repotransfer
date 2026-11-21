import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, Text, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { TurnstileWebView, TurnstileWebViewHandle } from '@/components/TurnstileWebView';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { startSession } from '@/lib/session';
import type { AuthResponse } from '@/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const turnstileRef = useRef<TurnstileWebViewHandle>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = !loading && !!turnstileToken && !!email.trim() && !!password;

  const handleLogin = async () => {
    const cleanEmail = email.trim();
    if (!EMAIL_RE.test(cleanEmail)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (!turnstileToken) {
      setError('Completa la verificación de seguridad para continuar.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await api.post<AuthResponse>('/auth/login', {
        email: cleanEmail,
        password,
        turnstile_token: turnstileToken,
      });
      await startSession(response);
      router.replace('/');
    } catch (err) {
      setError(getErrorMessage(err, 'Error al iniciar sesión. Intenta de nuevo.'));
      // Turnstile tokens are single-use; request a fresh one for the next attempt.
      turnstileRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Bienvenido de vuelta</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Correo electrónico"
              placeholder="tu@correo.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              label="Contraseña"
              placeholder="••••••••"
              secureTextEntry
              textContentType="password"
              autoComplete="current-password"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TurnstileWebView ref={turnstileRef} onToken={setTurnstileToken} />

          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            variant="primary"
            size="lg"
            loading={loading}
            fullWidth
            onPress={handleLogin}
            disabled={!canSubmit}
          >
            Iniciar sesión
          </Button>

          <View style={styles.divider}>
            <Text style={styles.dividerText}>o</Text>
          </View>

          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onPress={() => router.push('/(auth)/register')}
          >
            Crear cuenta
          </Button>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    color: colors.muted,
  },
  form: {
    gap: spacing.md,
  },
  errorBanner: {
    backgroundColor: colors.errorSoft,
    borderRadius: 8,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  errorText: {
    fontSize: typography.sizes.caption,
    color: colors.error,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerText: {
    fontSize: typography.sizes.caption,
    color: colors.muted,
    marginHorizontal: spacing.sm,
  },
});
