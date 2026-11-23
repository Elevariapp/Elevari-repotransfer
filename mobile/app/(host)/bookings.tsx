import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { HOST_DASHBOARD_URL, openExternalUrl, openWhatsAppSupport } from '@/lib/support';

const HOST_SUPPORT_MESSAGE = 'Hola, soy anfitrión en Elevari y necesito ayuda con las reservas de mi propiedad.';

// The API has no host-bookings endpoint yet, so this screen explains where bookings are managed instead of faking a list.
export default function HostBookingsScreen() {
  const router = useRouter();

  return (
    <Screen title="Reservas" tabbed>
      <Card padded style={styles.card}>
        <Text style={styles.title}>Las reservas de tus propiedades</Text>
        <Text style={styles.body}>
          Por ahora las reservas, el calendario y los pagos de tus propiedades se gestionan desde el panel web de
          anfitrión.
        </Text>
        <Button fullWidth onPress={() => void openExternalUrl(HOST_DASHBOARD_URL)}>
          Abrir panel web
        </Button>
      </Card>

      <Card padded style={styles.card}>
        <Text style={styles.title}>Entérate de cada reserva nueva</Text>
        <Text style={styles.body}>
          Cuando un huésped reserve o cancele una de tus propiedades, lo verás en tus notificaciones.
        </Text>
        <Button variant="secondary" fullWidth onPress={() => router.push('/(guest)/notifications')}>
          Ver notificaciones
        </Button>
      </Card>

      <Button variant="ghost" fullWidth onPress={() => void openWhatsAppSupport(HOST_SUPPORT_MESSAGE)}>
        Ayuda por WhatsApp
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, marginBottom: spacing.md },
  title: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink },
  body: { fontSize: typography.sizes.caption, lineHeight: 19, color: colors.slate, marginBottom: spacing.xs },
});