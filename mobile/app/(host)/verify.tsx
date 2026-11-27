import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Banner, ErrorState, LoadingState } from '@/components/States';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { openExternalUrl, WEBSITE_URL } from '@/lib/support';
import { useScreenResource } from '@/lib/use-resource';
import {
  VERIFY_URL,
  fetchVerificationStatus,
  verificationHeadline,
  type VerificationStatus,
} from '@/lib/verification';

export default function VerifyScreen() {
  const { data, loading, refreshing, error, reload, refresh } = useScreenResource<VerificationStatus>(
    fetchVerificationStatus,
    'No pudimos consultar tu verificación.',
  );

  const verified = Boolean(data?.id_verified);
  const pending = data?.verification_status === 'pending';
  const rejected = data?.verification_status === 'rejected';

  return (
    <Screen title="Verificación de identidad" tabbed refreshing={refreshing} onRefresh={refresh}>
      {loading ? <LoadingState label="Consultando tu verificación…" /> : null}
      {!loading && error && !data ? <ErrorState message={error} onRetry={reload} /> : null}

      {!loading && data ? (
        <>
          {error ? <Banner tone="error">{error}</Banner> : null}

          <Card padded style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.title}>Tu identidad</Text>
              <VerifiedBadge verified={verified} />
            </View>
            <Text style={styles.body}>{verificationHeadline(data)}</Text>

            {verified ? (
              <Text style={styles.hint}>
                Tu insignia azul ya está activa. Los huéspedes ven que tu identidad fue confirmada por
                Elevari.
              </Text>
            ) : pending ? (
              <Text style={styles.hint}>
                La revisión es automática y suele tardar segundos. Si necesita una mirada humana, la
                tienes en máximo 1 hora.
              </Text>
            ) : rejected ? (
              <Text style={styles.hint}>
                Revisa que el documento sea legible y que el número de identificación coincida con el
                nombre, y vuelve a enviarlo.
              </Text>
            ) : (
              <Text style={styles.hint}>
                Verifica tu identidad una vez y obtén la insignia azul. Documento + selfie, revisión en
                máximo 1 hora.
              </Text>
            )}
          </Card>

          {!verified ? (
            <Button size="lg" fullWidth onPress={() => void openExternalUrl(VERIFY_URL)}>
              {pending ? 'Ver el estado en el navegador' : 'Verificar mi identidad'}
            </Button>
          ) : null}

          <Button
            variant="secondary"
            fullWidth
            onPress={() => void openExternalUrl(`${WEBSITE_URL}/legal/content-moderation`)}
          >
            Cómo revisamos el contenido
          </Button>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  title: { fontFamily: typography.display, fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.slate },
  body: { fontSize: typography.sizes.body, color: colors.slate },
  hint: { fontSize: typography.sizes.caption, color: colors.muted, lineHeight: 20 },
});
