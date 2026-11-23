import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Banner, ErrorState, LoadingState } from '@/components/States';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { fetchHostProperties } from '@/lib/host';
import { useAppStore } from '@/lib/store';
import { HOST_DASHBOARD_URL, openExternalUrl } from '@/lib/support';
import { useScreenResource } from '@/lib/use-resource';

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HostIndexScreen() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const { data, loading, refreshing, error, reload, refresh } = useScreenResource(
    fetchHostProperties,
    'No pudimos cargar tus propiedades.',
  );

  const properties = data ?? [];
  const published = properties.filter((property) => property.status === 'published').length;
  const inReview = properties.filter((property) => property.status === 'draft').length;
  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    <Screen title="Panel de anfitrión" tabbed refreshing={refreshing} onRefresh={refresh}>
      <Text style={styles.greeting}>{firstName ? `Hola, ${firstName}` : 'Hola'}</Text>
      <Text style={styles.subtitle}>Este es el resumen de tus propiedades en Elevari.</Text>

      {loading ? <LoadingState label="Cargando tu resumen…" /> : null}
      {!loading && error && !data ? <ErrorState message={error} onRetry={reload} /> : null}
      {!loading && data ? (
        <>
          {error ? <Banner tone="error">{error}</Banner> : null}
          <View style={styles.stats}>
            <Stat value={properties.length} label="Propiedades" />
            <Stat value={published} label="Publicadas" />
            <Stat value={inReview} label="En revisión" />
          </View>
          <View style={styles.actions}>
            <Button size="lg" fullWidth onPress={() => router.push('/(host)/property/new')}>
              Agregar propiedad
            </Button>
            <Button variant="secondary" size="lg" fullWidth onPress={() => router.replace('/(host)/properties')}>
              Ver mis propiedades
            </Button>
          </View>
        </>
      ) : null}

      <Card padded style={styles.note}>
        <Text style={styles.noteTitle}>Reservas, calendario y pagos</Text>
        <Text style={styles.noteBody}>
          Por ahora los gestionas desde el panel web de anfitrión. En la app puedes crear y revisar tus propiedades.
        </Text>
        <Button variant="secondary" fullWidth onPress={() => void openExternalUrl(HOST_DASHBOARD_URL)}>
          Abrir panel web
        </Button>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink },
  subtitle: { fontSize: typography.sizes.body, color: colors.muted, marginTop: spacing.xs, marginBottom: spacing.lg },
  stats: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statValue: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.forest },
  statLabel: { fontSize: typography.sizes.caption, color: colors.muted, marginTop: spacing.xs },
  actions: { gap: spacing.sm, marginBottom: spacing.lg },
  note: { gap: spacing.sm },
  noteTitle: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink },
  noteBody: { fontSize: typography.sizes.caption, lineHeight: 19, color: colors.slate, marginBottom: spacing.xs },
});