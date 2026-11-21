import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { TurnstileWebView, TurnstileWebViewHandle } from '@/components/TurnstileWebView';
import { colors, spacing, typography, radius } from '@/lib/design-tokens';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { startSession } from '@/lib/session';
import type { AuthResponse } from '@/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const router = useRouter();
  const turnstileRef = useRef<TurnstileWebViewHandle>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'guest' | 'host'>('guest');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit =
    !loading && !!turnstileToken && !!name.trim() && !!email.trim() && !!password && !!confirmPassword;

  const validate = (): string | null => {
    if (!name.trim()) return 'Ingresa tu nombre.';
    if (!EMAIL_RE.test(email.trim())) return 'Ingresa un correo electrónico válido.';
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (password !== confirmPassword) return 'Las contraseñas no coinciden.';
    if (!turnstileToken) return 'Completa la verificación de seguridad para continuar.';
    return null;
  };

  const handleRegister = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await api.post<AuthResponse>('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        turnstile_token: turnstileToken,
      });
      await startSession(response);
      router.replace('/');
    } catch (err) {
      setError(getErrorMessage(err, 'Error al crear la cuenta.'));
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
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Únete a Elevari y empieza a explorar</Text>
          </View>

          <View style={styles.form}>
            <Input label="Nombre completo" placeholder="Juan Pérez" value={name} onChangeText={setName} autoComplete="name" />
            <Input label="Correo electrónico" placeholder="tu@correo.com" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} />
            <Input label="Contraseña" placeholder="••••••••" hint="Mínimo 8 caracteres" secureTextEntry autoComplete="new-password" value={password} onChangeText={setPassword} />
            <Input label="Confirmar contraseña" placeholder="••••••••" secureTextEntry autoComplete="new-password" value={confirmPassword} onChangeText={setConfirmPassword} />
            <View style={styles.roleSelector}>
              <Text style={styles.roleLabel}>Me registro como</Text>
              <View style={styles.roleOptions}>
                <TouchableOpacity style={[styles.roleOption, role === 'guest' && styles.roleOptionActive]} onPress={() => setRole('guest')}>
                  <Text style={[styles.roleOptionText, role === 'guest' && styles.roleOptionActiveText]}>Huésped</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.roleOption, role === 'host' && styles.roleOptionActive]} onPress={() => setRole('host')}>
                  <Text style={[styles.roleOptionText, role === 'host' && styles.roleOptionActiveText]}>Anfitrión</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TurnstileWebView ref={turnstileRef} onToken={setTurnstileToken} />

          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button variant="primary" size="lg" loading={loading} fullWidth onPress={handleRegister} disabled={!canSubmit}>
            Crear cuenta
          </Button>

          <View style={styles.divider}>
            <Text style={styles.dividerText}>o</Text>
          </View>

          <Button variant="ghost" size="lg" fullWidth onPress={() => router.push('/(auth)/login')}>
            Ya tengo cuenta
          </Button>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  title: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink, marginBottom: spacing.sm },
  subtitle: { fontSize: typography.sizes.body, color: colors.muted },
  form: { gap: spacing.md },
  roleSelector: { marginTop: spacing.sm },
  roleLabel: { fontSize: typography.sizes.caption, color: colors.muted, marginBottom: spacing.sm },
  roleOptions: { flexDirection: 'row', gap: spacing.sm },
  roleOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  roleOptionActive: { borderColor: colors.forest, backgroundColor: colors.freshSoft },
  roleOptionText: { fontSize: typography.sizes.caption, color: colors.muted, fontWeight: typography.weights.medium },
  roleOptionActiveText: { color: colors.forest },
  errorBanner: { backgroundColor: colors.errorSoft, borderRadius: 8, padding: spacing.md, marginVertical: spacing.md },
  errorText: { fontSize: typography.sizes.caption, color: colors.error },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dividerText: { fontSize: typography.sizes.caption, color: colors.muted, marginHorizontal: spacing.sm },
});
