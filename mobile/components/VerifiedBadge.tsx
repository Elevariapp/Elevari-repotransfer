import { StyleSheet, Text, View } from 'react-native';

/** Blue verified check, same claim as the web badge: identity confirmed by Elevari. */
export function VerifiedBadge({ verified, compact = false }: { verified: boolean | null | undefined; compact?: boolean }) {
  if (!verified) return null;
  return (
    <View
      style={[styles.badge, compact && styles.badgeCompact]}
      accessible
      accessibilityLabel="Anfitrión con identidad verificada"
      testID="verified-badge"
    >
      <Text style={styles.tick}>✓</Text>
      {!compact && <Text style={styles.label}>Verificado</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(11, 103, 229, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(11, 103, 229, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeCompact: { paddingHorizontal: 5 },
  tick: { color: '#0B67E5', fontWeight: '700', fontSize: 12 },
  label: { color: '#0B67E5', fontWeight: '600', fontSize: 11 },
});
