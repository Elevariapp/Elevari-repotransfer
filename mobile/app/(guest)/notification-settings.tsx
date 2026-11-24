import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { SettingsGroup } from '@/components/SettingsRow';
import { Banner, ErrorState, LoadingState } from '@/components/States';
import { getApiErrorMessage } from '@/lib/api';
import { isHostRole } from '@/lib/auth';
import { colors, spacing, typography } from '@/lib/design-tokens';
import {
  EMAIL_PREFERENCE_ROWS,
  PUSH_PREFERENCE_ROWS,
  preferencePatch,
  preferenceValue,
  visibleRows,
  withPreference,
  type PreferenceRow,
} from '@/lib/notification-preferences';
import { fetchNotificationPreferences, updateNotificationPreferences } from '@/lib/notifications';
import { useAppStore } from '@/lib/store';
import type { NotificationPreferences } from '@/lib/types';
import { useScreenResource } from '@/lib/use-resource';

const SAVED_MESSAGE_MS = 2500;

function PreferenceSwitch({
  row,
  value,
  busy,
  last,
  onToggle,
}: {
  row: PreferenceRow;
  value: boolean;
  busy: boolean;
  last: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      disabled={busy}
      accessibilityRole="switch"
      accessibilityLabel={row.label}
      accessibilityHint={row.hint}
      accessibilityState={{ checked: value, busy, disabled: busy }}
      style={({ pressed }) => [styles.row, !last && styles.divider, pressed && styles.pressed, busy && styles.busy]}
    >
      <View style={styles.texts}>
        <Text style={styles.label}>{row.label}</Text>
        <Text style={styles.hint}>{row.hint}</Text>
      </View>
      {/* The whole row is the control: the native switch only mirrors its state. */}
      <View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Switch value={value} trackColor={{ false: colors.border, true: colors.forest }} thumbColor={colors.surface} />
      </View>
    </Pressable>
  );
}

export default function NotificationSettingsScreen() {
  const isHost = useAppStore((state) => isHostRole(state.user?.role));
  const { data, loading, error, reload } = useScreenResource(
    fetchNotificationPreferences,
    'No pudimos cargar tus preferencias.',
  );
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The server is the source of truth whenever it is (re)loaded, unless a save is in flight.
  useEffect(() => {
    if (data && !savingId) setPrefs(data);
  }, [data, savingId]);

  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  const toggle = async (row: PreferenceRow) => {
    if (!prefs || savingId) return;
    const previous = preferenceValue(prefs, row);
    setSavingId(row.id);
    setSaveError('');
    setSaved(false);
    setPrefs(withPreference(prefs, row, !previous));

    try {
      setPrefs(await updateNotificationPreferences(preferencePatch(row, !previous)));
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), SAVED_MESSAGE_MS);
    } catch (err) {
      setPrefs((current) => (current ? withPreference(current, row, previous) : current));
      setSaveError(getApiErrorMessage(err, 'No pudimos guardar el cambio. Inténtalo de nuevo.'));
    } finally {
      setSavingId(null);
    }
  };

  const renderRows = (rows: readonly PreferenceRow[], current: NotificationPreferences) => {
    const shown = visibleRows(rows, isHost);
    return shown.map((row, index) => (
      <PreferenceSwitch
        key={row.id}
        row={row}
        value={preferenceValue(current, row)}
        busy={savingId !== null}
        last={index === shown.length - 1}
        onToggle={() => void toggle(row)}
      />
    ));
  };

  return (
    <Screen title="Preferencias" back backHref={isHost ? '/(host)/profile' : '/(guest)/profile'}>
      <Text style={styles.lead}>Elige qué avisos quieres recibir y por dónde. Los cambios se guardan al instante.</Text>

      {loading ? <LoadingState label="Cargando tus preferencias…" /> : null}
      {!loading && error && !prefs ? <ErrorState message={error} onRetry={reload} /> : null}

      {prefs ? (
        <>
          {saveError ? <Banner tone="error">{saveError}</Banner> : null}
          <SettingsGroup heading="Por correo">{renderRows(EMAIL_PREFERENCE_ROWS, prefs)}</SettingsGroup>
          <SettingsGroup heading="En la app del celular">{renderRows(PUSH_PREFERENCE_ROWS, prefs)}</SettingsGroup>
          <Text style={styles.note}>
            Los avisos de la app llegan cuando permites las notificaciones en tu dispositivo. Los correos de tus
            reservas (confirmación, cancelación y recibo) y los de seguridad de tu cuenta se envían siempre, para que
            no te pierdas nada importante.
          </Text>
          <Text style={styles.saved} accessibilityLiveRegion="polite">
            {saved ? 'Cambios guardados' : ''}
          </Text>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: typography.sizes.body, color: colors.slate, marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  pressed: { backgroundColor: colors.ivory },
  busy: { opacity: 0.6 },
  texts: { flex: 1 },
  label: { fontSize: typography.sizes.body, fontWeight: typography.weights.medium, color: colors.ink },
  hint: { fontSize: typography.sizes.caption, lineHeight: 19, color: colors.muted, marginTop: 2 },
  note: { fontSize: typography.sizes.caption, lineHeight: 19, color: colors.slate, marginBottom: spacing.md },
  saved: { minHeight: 20, fontSize: typography.sizes.caption, fontWeight: typography.weights.semibold, color: colors.forestDeep },
});
