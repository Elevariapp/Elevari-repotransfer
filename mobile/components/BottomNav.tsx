import { useRouter, useSegments } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/lib/design-tokens';

export interface BottomNavItem {
  // Name of the route inside the group (`index` for the group's home screen).
  key: string;
  label: string;
  glyph: string;
  href: string;
  badge?: number;
}

interface BottomNavProps {
  group: '(guest)' | '(host)';
  items: BottomNavItem[];
}

// Tab bar shown only on the main screens of a group; detail screens hide it.
export function BottomNav({ group, items }: BottomNavProps) {
  const segments = useSegments() as readonly string[];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (segments[0] !== group) return null;
  const current = segments[1] ?? 'index';
  if (!items.some((item) => item.key === current)) return null;

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}
    >
      {items.map((item) => {
        const active = item.key === current;
        const badge = item.badge ?? 0;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={badge > 0 ? `${item.label}, ${badge} sin leer` : item.label}
            onPress={() => {
              if (!active) router.replace(item.href);
            }}
            style={styles.item}
          >
            <View>
              <Text style={[styles.glyph, !active && styles.inactive]} importantForAccessibility="no">
                {item.glyph}
              </Text>
              {badge > 0 ? <View style={styles.dot} /> : null}
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  glyph: { fontSize: 20, textAlign: 'center' },
  inactive: { opacity: 0.55 },
  label: { fontSize: 12, color: colors.muted, marginTop: 2 },
  labelActive: { color: colors.forest, fontWeight: typography.weights.semibold },
  dot: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
});
