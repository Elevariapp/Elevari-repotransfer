import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { colors, spacing, typography } from '@/lib/design-tokens';

export default function HostIndexScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Panel de Anfitrión</Text>
        <Text style={styles.subtitle}>Gestiona tus propiedades y reservas</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  title: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink, marginBottom: spacing.sm },
  subtitle: { fontSize: typography.sizes.body, color: colors.muted },
});