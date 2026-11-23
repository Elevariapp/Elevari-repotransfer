import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInputInstance, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Banner } from '@/components/States';
import { SceneScreen } from '@/components/scene/SceneScreen';
import { getApiErrorMessage } from '@/lib/api';
import { normalizeEmail } from '@/lib/auth';
import { colors, spacing, typography, radius } from '@/lib/design-tokens';
import { signUp } from '@/lib/session';
import { LEGAL_URLS, openExternalUrl } from '@/lib/support';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(name: string, email: string, password: string, confirmPassword: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!name.trim()) errors.name = 'Ingresa tu nombre.';
  else if (name.trim().length > 120) errors.name = 'El nombre no puede superar 120 caracteres.';

  if (!email) errors.email = 'Ingresa tu correo electrónico.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Revisa el formato del correo (nombre@correo.com).';

  if (password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres.';
  else if (password.length > 128) errors.password = 'La contraseña no puede superar 128 caracteres.';

  if (!confirmPassword) errors.confirmPassword = 'Repite tu contraseña.';
  else if (confirmPassword !== password) errors.confirmPassword = 'Las contraseñas no coinciden.';
  return errors;
}

export default function RegisterScreen() {
  const router = useRouter();
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'guest' | 'host'>('guest');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (loading) return;

    const address = normalizeEmail(email);
    const errors = validate(name, address, password, confirmPassword);
    setFieldErrors(errors);
    setError('');
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      // The group layouts send the new user to the right home screen.
      await signUp({ email: address, password, name: name.trim(), role });
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos crear tu cuenta. Inténtalo de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SceneScreen>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Crear cuenta
        </Text>
        <Text style={styles.subtitle}>Únete a Elevari y empieza a explorar</Text>
      </View>

      <Input
        label="Nombre completo"
        placeholder="Juan Pérez"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        value={name}
        onChangeText={setName}
        onSubmitEditing={() => emailRef.current?.focus()}
        error={fieldErrors.name}
      />
      <Input
        ref={emailRef}
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
        error={fieldErrors.email}
      />
      <Input
        ref={passwordRef}
        label="Contraseña"
        placeholder="Mínimo 8 caracteres"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={() => confirmRef.current?.focus()}
        error={fieldErrors.password}
      />
      <Input
        ref={confirmRef}
        label="Confirmar contraseña"
        placeholder="Repite tu contraseña"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        onSubmitEditing={handleRegister}
        error={fieldErrors.confirmPassword}
      />

      <View style={styles.roleSelector}>
        <Text style={styles.roleLabel}>Me registro como</Text>
        <View style={styles.roleOptions} accessibilityRole="radiogroup">
          {(
            [
              { value: 'guest', label: 'Huésped' },
              { value: 'host', label: 'Anfitrión' },
            ] as const
          ).map((option) => {
            const selected = role === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.roleOption, selected && styles.roleOptionActive]}
                onPress={() => setRole(option.value)}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ selected }}
              >
                <Text style={[styles.roleOptionText, selected && styles.roleOptionActiveText]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {error ? <Banner tone="error">{error}</Banner> : null}

      <Button variant="primary" size="lg" loading={loading} fullWidth onPress={handleRegister}>
        Crear cuenta
      </Button>

      <Text style={styles.legal}>
        Al crear tu cuenta aceptas los{' '}
        <Text
          style={styles.legalLink}
          accessibilityRole="link"
          onPress={() => void openExternalUrl(LEGAL_URLS.terms)}
        >
          Términos y condiciones
        </Text>{' '}
        y la{' '}
        <Text
          style={styles.legalLink}
          accessibilityRole="link"
          onPress={() => void openExternalUrl(LEGAL_URLS.privacy)}
        >
          Política de privacidad
        </Text>
        .
      </Text>

      <View style={styles.divider}>
        <Text style={styles.dividerText}>o</Text>
      </View>

      <Button variant="ghost" size="lg" fullWidth onPress={() => router.replace('/(auth)/login')}>
        Ya tengo cuenta
      </Button>
    </SceneScreen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: spacing.lg },
  title: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink, marginBottom: spacing.sm },
  subtitle: { fontSize: typography.sizes.body, color: colors.muted },
  roleSelector: { marginBottom: spacing.md },
  roleLabel: { fontSize: typography.sizes.caption, color: colors.muted, marginBottom: spacing.sm },
  roleOptions: { flexDirection: 'row', gap: spacing.sm },
  roleOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  roleOptionActive: { borderColor: colors.forest, backgroundColor: colors.freshSoft },
  roleOptionText: { fontSize: typography.sizes.caption, color: colors.muted, fontWeight: typography.weights.medium },
  roleOptionActiveText: { color: colors.forest },
  legal: { marginTop: spacing.md, fontSize: typography.sizes.caption, color: colors.muted, textAlign: 'center', lineHeight: 19 },
  legalLink: { color: colors.forest, fontWeight: typography.weights.semibold },
  divider: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: spacing.md },
  dividerText: { fontSize: typography.sizes.caption, color: colors.muted, marginHorizontal: spacing.sm },
});