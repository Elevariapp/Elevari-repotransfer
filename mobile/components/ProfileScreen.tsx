import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { SettingsGroup, SettingsRow } from '@/components/SettingsRow';
import { WhatsAppGlyph } from '@/components/WhatsAppGlyph';
import { getApiErrorMessage } from '@/lib/api';
import { colors, radius, spacing, typography } from '@/lib/design-tokens';
import { refreshUnreadCount } from '@/lib/notifications';
import type { Area } from '@/lib/routes';
import { becomeHost, signOut } from '@/lib/session';
import { useAppStore } from '@/lib/store';
import { HOST_DASHBOARD_URL, openExternalUrl, openWhatsAppSupport } from '@/lib/support';
import type { UserRole } from '@/lib/types';

const ROLE_LABELS: Record<UserRole, string> = {
  guest: 'Huésped',
  host: 'Anfitrión',
  admin: 'Administrador',
};

// Account screens and legal pages live in the `(guest)` group and are shared by both areas.
const SHARED = '/(guest)';

export function ProfileScreen({ area }: { area: Area }) {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const unread = useAppStore((state) => state.unreadNotifications);
  const [signingOut, setSigningOut] = useState(false);
  const [becomingHost, setBecomingHost] = useState(false);
  const userId = user?.id ?? null;

  // The badge may be stale after reading notifications or receiving new ones.
  useFocusEffect(
    useCallback(() => {
      if (userId) void refreshUnreadCount(userId);
    }, [userId]),
  );

  const open = (path: string) => router.push(`${SHARED}${path}`);

  const confirmSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Quieres cerrar tu sesión en este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: () => {
          setSigningOut(true);
          // The route guards send the user to the login screen as soon as the session is cleared.
          void signOut().finally(() => setSigningOut(false));
        },
      },
    ]);
  };

  const confirmBecomeHost = () => {
    Alert.alert(
      'Publica tu espacio',
      'Convertiremos tu cuenta en una cuenta de anfitrión. Seguirás pudiendo reservar como huésped.',
      [
        { text: 'Ahora no', style: 'cancel' },
        {
          text: 'Activar anfitrión',
          onPress: () => {
            if (becomingHost) return;
            setBecomingHost(true);
            becomeHost()
              .then(() => router.replace('/(host)'))
              .catch((err: unknown) =>
                Alert.alert('No pudimos activar tu cuenta de anfitrión', getApiErrorMessage(err)),
              )
              .finally(() => setBecomingHost(false));
          },
        },
      ],
    );
  };

  const displayName = user?.name?.trim() || 'Tu cuenta';
  const initial = (user?.name?.trim() || user?.email || '?').charAt(0).toUpperCase();
  const canHost = user?.role === 'host' || user?.role === 'admin';
  const version = Constants.expoConfig?.version;

  return (
    <Screen title="Perfil" tabbed>
      <View style={styles.profileCard} accessible accessibilityLabel={`${displayName}, ${user?.email ?? ''}`}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.userName}>{displayName}</Text>
        <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
        {user ? <Text style={styles.userRole}>{ROLE_LABELS[user.role]}</Text> : null}
      </View>

      <SettingsGroup heading="Mi cuenta">
        <SettingsRow title="Editar perfil" subtitle="Nombre y teléfono" onPress={() => open('/edit-profile')} />
        <SettingsRow
          title={user?.has_password === false ? 'Crear contraseña' : 'Cambiar contraseña'}
          onPress={() => open('/change-password')}
        />
        <SettingsRow title="Notificaciones" badge={unread} onPress={() => open('/notifications')} />
        <SettingsRow
          title="Preferencias de avisos"
          subtitle="Elige qué recibes por correo y en el celular"
          onPress={() => open('/notification-settings')}
        />
        {area === 'guest' ? (
          <SettingsRow title="Mis reservas" onPress={() => router.push('/(guest)/my-bookings')} last />
        ) : (
          <SettingsRow
            title="Explorar como huésped"
            subtitle="Ver Elevari como lo ven tus huéspedes"
            onPress={() => router.replace('/(guest)')}
            last
          />
        )}
      </SettingsGroup>

      <SettingsGroup heading="Pagos">
        <SettingsRow title="Pagos" subtitle="Historial de tus pagos" onPress={() => open('/payments')} />
        <SettingsRow title="Facturación" subtitle="Facturas de tus reservas" onPress={() => open('/billing')} last />
      </SettingsGroup>

      {area === 'guest' && canHost ? (
        <SettingsGroup heading="Anfitrión">
          <SettingsRow
            title="Panel de anfitrión"
            subtitle="Gestiona tus propiedades"
            onPress={() => router.replace('/(host)')}
            last
          />
        </SettingsGroup>
      ) : null}

      {area === 'guest' && !canHost ? (
        <SettingsGroup heading="Anfitrión">
          <SettingsRow
            title="Publica tu espacio"
            subtitle="Convierte tu cuenta en cuenta de anfitrión"
            onPress={confirmBecomeHost}
            last
          />
        </SettingsGroup>
      ) : null}

      {area === 'host' ? (
        <SettingsGroup heading="Anfitrión">
          <SettingsRow
            title="Panel web de anfitrión"
            subtitle="Calendario y pagos en elevari.live"
            onPress={() => void openExternalUrl(HOST_DASHBOARD_URL)}
            last
          />
        </SettingsGroup>
      ) : null}

      <SettingsGroup heading="Ayuda y legal">
        <SettingsRow
          title="Ayuda por WhatsApp"
          subtitle="Escríbenos, te respondemos pronto"
          trailing={<WhatsAppGlyph size={20} />}
          onPress={() => void openWhatsAppSupport()}
        />
        <SettingsRow title="Contacto y soporte" onPress={() => open('/legal/contact')} />
        <SettingsRow title="Términos y condiciones" onPress={() => open('/legal/terms')} />
        <SettingsRow title="Política de privacidad" onPress={() => open('/legal/privacy')} />
        <SettingsRow title="Política de reembolso" onPress={() => open('/legal/refund')} />
        <SettingsRow title="Moderación de contenido" onPress={() => open('/legal/content-moderation')} last />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow
          title="Eliminar mi cuenta"
          subtitle="Se borrarán tus datos de forma permanente"
          destructive
          onPress={() => open('/legal/account-deletion')}
          last
        />
      </SettingsGroup>

      <Button variant="secondary" size="lg" fullWidth loading={signingOut} onPress={confirmSignOut}>
        Cerrar sesión
      </Button>

      {version ? <Text style={styles.version}>{`Elevari · versión ${version}`}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.freshSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.forest },
  userName: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.xs },
  userEmail: { fontSize: typography.sizes.caption, color: colors.muted, marginBottom: spacing.xs },
  userRole: { fontSize: typography.sizes.caption, fontWeight: typography.weights.medium, color: colors.forest },
  version: { fontSize: typography.sizes.caption, color: colors.muted, textAlign: 'center', marginTop: spacing.lg },
});
