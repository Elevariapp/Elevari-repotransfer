import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { colors, spacing, typography, radius } from '@/lib/design-tokens';
import { api } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import { useAppStore } from '@/lib/store';

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser, setAuthenticated } = useAppStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'guest' | 'host'>('guest');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await api.post<{ token: string; user: any }>('/auth/register', {
        name, email, password, role,
      });
      await authStorage.setToken(response.token);
      await authStorage.setUser(response.user);
      setUser(response.user);
      setAuthenticated(true);
      router.replace('/(guest)');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Únete a Waná y empieza a explorar</Text>
          </View>

          <View style={styles.form}>
            <Input label="Nombre completo" placeholder="Juan Pérez" value={name} onChangeText={setName} />
            <Input label="Correo electrónico" placeholder="tu@correo.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <Input label="Contraseña" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />
            <Input label="Confirmar contraseña" placeholder="••••••••" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
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

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button variant="primary" size="lg" loading={loading} fullWidth onPress={handleRegister} disabled={loading}>
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
  errorBanner: { backgroundColor: colors.errorSoft, borderRadius: 8, padding: spacing.md, marginBottom: spacing.md },
  errorText: { fontSize: typography.sizes.caption, color: colors.error },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dividerText: { fontSize: typography.sizes.caption, color: colors.muted, marginHorizontal: spacing.sm },
});