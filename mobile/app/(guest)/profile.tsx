import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors, spacing, typography, radius, shadows } from '@/lib/design-tokens';
import { authStorage } from '@/lib/auth';
import { useAppStore } from '@/lib/store';
import { User } from '@/lib/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAppStore();
  const [storedUser, setStoredUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authStorage.getUser().then(setStoredUser).finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await authStorage.logout();
    logout();
    router.replace('/(auth)/login');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.forest} style={styles.loading} />
      </SafeAreaView>
    );
  }

  const currentUser = storedUser || user;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarPlaceholder} />
        <Text style={styles.userName}>{currentUser?.name || 'Usuario'}</Text>
        <Text style={styles.userEmail}>{currentUser?.email || ''}</Text>
        <Text style={styles.userRole}>{currentUser?.role === 'host' ? 'Anfitrión' : 'Huésped'}</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/my-bookings')}>
          <Text style={styles.menuItemText}>Mis reservas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/legal/terms')}>
          <Text style={styles.menuItemText}>Términos y condiciones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/legal/privacy')}>
          <Text style={styles.menuItemText}>Política de privacidad</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/legal/refund')}>
          <Text style={styles.menuItemText}>Política de reembolso</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/legal/account-deletion')}>
          <Text style={styles.menuItemText}>Eliminar mi cuenta</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/legal/content-moderation')}>
          <Text style={styles.menuItemText}>Moderación de contenido</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/legal/contact')}>
          <Text style={styles.menuItemText}>Contacto y soporte</Text>
        </TouchableOpacity>
      </View>

      <Button
        variant="secondary"
        size="lg"
        fullWidth
        onPress={handleLogout}
      >
        Cerrar sesión
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, marginBottom: spacing.lg },
  title: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink },
  profileCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', ...shadows.card, marginBottom: spacing.lg },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.freshSoft, marginBottom: spacing.md },
  userName: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.xs },
  userEmail: { fontSize: typography.sizes.caption, color: colors.muted, marginBottom: spacing.xs },
  userRole: { fontSize: typography.sizes.caption, fontWeight: typography.weights.medium, color: colors.forest },
  menu: { marginBottom: spacing.lg },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuItemText: { fontSize: typography.sizes.body, color: colors.slate, marginLeft: spacing.md },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});