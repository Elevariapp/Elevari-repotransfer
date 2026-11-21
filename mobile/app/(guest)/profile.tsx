import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Button } from '@/components/Button';
import { colors, spacing, typography, radius, shadows } from '@/lib/design-tokens';
import { endSession } from '@/lib/session';
import { useAppStore } from '@/lib/store';

const ROLE_LABELS = { guest: 'Huésped', host: 'Anfitrión', admin: 'Administrador' } as const;

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);

  const handleLogout = async () => {
    // The root layout swaps to the login screen as soon as the session ends.
    await endSession();
  };

  const canHost = user?.role === 'host' || user?.role === 'admin';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.avatarPlaceholder} />
        <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        {!!user && <Text style={styles.userRole}>{ROLE_LABELS[user.role]}</Text>}
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/my-bookings')}>
          <Text style={styles.menuItemText}>Mis reservas</Text>
        </TouchableOpacity>
        {canHost && (
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/host')}>
            <Text style={styles.menuItemText}>Panel de anfitrión</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/legal/terms')}>
          <Text style={styles.menuItemText}>Términos y condiciones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/legal/privacy')}>
          <Text style={styles.menuItemText}>Política de privacidad</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/legal/refund')}>
          <Text style={styles.menuItemText}>Política de reembolso</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/legal/faq')}>
          <Text style={styles.menuItemText}>Preguntas frecuentes</Text>
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

      <Button variant="secondary" size="lg" fullWidth onPress={handleLogout}>
        Cerrar sesión
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: spacing.lg },
  profileCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', ...shadows.card, marginBottom: spacing.lg },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.freshSoft, marginBottom: spacing.md },
  userName: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.xs },
  userEmail: { fontSize: typography.sizes.caption, color: colors.muted, marginBottom: spacing.xs },
  userRole: { fontSize: typography.sizes.caption, fontWeight: typography.weights.medium, color: colors.forest },
  menu: { marginBottom: spacing.lg },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuItemText: { fontSize: typography.sizes.body, color: colors.slate },
});
