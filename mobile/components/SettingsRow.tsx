import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/lib/design-tokens';

interface SettingsRowProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
  // Unread/pending counter shown as a pill before the chevron.
  badge?: number;
  destructive?: boolean;
  last?: boolean;
}

export function SettingsRow({ title, subtitle, onPress, badge = 0, destructive = false, last = false }: SettingsRowProps) {
  const label = badge > 0 ? `${title}, ${badge} sin leer` : title;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={subtitle}
      style={({ pressed }) => [styles.row, !last && styles.divider, pressed && styles.pressed]}
    >
      <View style={styles.texts}>
        <Text style={[styles.title, destructive && styles.destructive]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : String(badge)}</Text>
        </View>
      ) : null}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

// Groups rows in one rounded card, with an optional small heading.
export function SettingsGroup({ heading, children }: { heading?: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      {heading ? <Text style={styles.heading}>{heading}</Text> : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: spacing.lg },
  heading: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  pressed: { backgroundColor: colors.ivory },
  texts: { flex: 1 },
  title: { fontSize: typography.sizes.body, color: colors.ink, fontWeight: typography.weights.medium },
  destructive: { color: colors.error },
  subtitle: { fontSize: typography.sizes.caption, color: colors.muted, marginTop: 2 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginRight: spacing.sm,
  },
  badgeText: { color: colors.surface, fontSize: 12, fontWeight: typography.weights.bold },
  chevron: { fontSize: 22, color: colors.muted, marginLeft: spacing.xs },
});
