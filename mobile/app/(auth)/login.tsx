import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { SceneScreen } from '@/components/scene/SceneScreen';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { api } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import { useAppStore } from '@/lib/store';
import * as SplashScreen from 'expo-splash-screen';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser, setAuthenticated } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await api.post<{ token: string; user: any }>('/auth/login', {
        email,
        password,
      });
      await authStorage.setToken(response.token);
      await authStorage.setUser(response.user);
      setUser(response.user);
      setAuthenticated(true);
      router.replace('/(guest)');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SceneScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Bienvenido de vuelta</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
      </View>

      <Input
        label="Correo electrónico"
        placeholder="tu@correo.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        error={error.includes('correo') ? error : undefined}
      />
      <Input
        label="Contraseña"
        placeholder="••••••••"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        error={error.includes('contraseña') ? error : undefined}
      />

      {error && (
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
        disabled={loading}
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
  errorBanner: {
    backgroundColor: colors.errorSoft,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.sizes.caption,
    color: colors.error,
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