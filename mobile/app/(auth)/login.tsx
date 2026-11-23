import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInputInstance, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Banner } from '@/components/States';
import { SceneScreen } from '@/components/scene/SceneScreen';
import { getApiErrorMessage } from '@/lib/api';
import { normalizeEmail } from '@/lib/auth';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { signIn } from '@/lib/session';
import { useAppStore } from '@/lib/store';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const notice = useAppStore((state) => state.sessionNotice);
  const passwordRef = useRef<TextInputInstance>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;

    const address = normalizeEmail(email);
    const nextEmailError = !address
      ? 'Ingresa tu correo electrónico.'
      : !EMAIL_PATTERN.test(address)
        ? 'Revisa el formato del correo (nombre@correo.com).'
        : '';
    const nextPasswordError = password ? '' : 'Ingresa tu contraseña.';
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setError('');
    if (nextEmailError || nextPasswordError) return;

    setLoading(true);
    try {
      // The group layouts send the signed-in user to the right home screen.
      await signIn(address, password);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos iniciar sesión. Inténtalo de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SceneScreen>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Bienvenido de vuelta
        </Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
      </View>

      {notice ? <Banner tone="info">{notice}</Banner> : null}

      <Input
        label="Correo electrónico"
        placeholder="tu@correo.com"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        returnKeyType="next"
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={emailError || undefined}
      />
      <Input
        ref={passwordRef}
        label="Contraseña"
        placeholder="••••••••"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={handleLogin}
        error={passwordError || undefined}
      />

      <Pressable
        onPress={() => router.push('/(auth)/forgot-password')}
        accessibilityRole="link"
        accessibilityLabel="¿Olvidaste tu contraseña?"
        hitSlop={8}
        style={styles.forgot}
      >
        <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
      </Pressable>

      {error ? <Banner tone="error">{error}</Banner> : null}

      <Button variant="primary" size="lg" loading={loading} fullWidth onPress={handleLogin}>
        Iniciar sesión
      </Button>

      <View style={styles.divider}>
        <Text style={styles.dividerText}>o</Text>
      </View>

      <Button variant="ghost" size="lg" fullWidth onPress={() => router.push('/(auth)/register')}>
        Crear cuenta
      </Button>
    </SceneScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
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
  forgot: {
    alignSelf: 'flex-end',
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  forgotText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.forest,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  dividerText: {
    fontSize: typography.sizes.caption,
    color: colors.muted,
    marginHorizontal: spacing.sm,
  },
});