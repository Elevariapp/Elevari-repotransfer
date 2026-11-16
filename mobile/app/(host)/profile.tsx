import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { Button } from '@/components/Button';
import { colors, spacing, typography, radius, shadows } from '@/lib/design-tokens';
import { authStorage } from '@/lib/auth';
import { useAppStore } from '@/lib/store';

export default function HostProfileScreen() {
  const { logout } = useAppStore();

  const handleLogout = async () => {
    await authStorage.logout();
    logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil de Anfitrión</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarPlaceholder} />
        <Text style={styles.userName}>Anfitrión Waná</Text>
        <Text style={styles.userEmail}>Gestiona tus propiedades</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Mis propiedades</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Mis reservas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Ganancias</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Configuración</Text>
        </TouchableOpacity>
      </View>

      <Button variant="secondary" size="lg" fullWidth onPress={handleLogout}>
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
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.amberSoft, marginBottom: spacing.md },
  userName: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.xs },
  userEmail: { fontSize: typography.sizes.caption, color: colors.muted },
  menu: { marginBottom: spacing.lg },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuItemText: { fontSize: typography.sizes.body, color: colors.slate, marginLeft: spacing.md },
});