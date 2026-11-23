import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/lib/design-tokens';

export type ChipTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const palette: Record<ChipTone, { bg: string; fg: string }> = {
  success: { bg: '#DCFCE7', fg: '#166534' },
  warning: { bg: colors.amberSoft, fg: colors.amberInk },
  danger: { bg: colors.errorSoft, fg: colors.error },
  neutral: { bg: '#F1F5F9', fg: colors.muted },
  info: { bg: '#DBEAFE', fg: '#1E40AF' },
};

interface StatusChipProps {
  label: string;
  tone?: ChipTone;
}

export function StatusChip({ label, tone = 'neutral' }: StatusChipProps) {
  const colorsForTone = palette[tone];
  return (
    <View
      style={[styles.chip, { backgroundColor: colorsForTone.bg }]}
      accessible
      accessibilityLabel={`Estado: ${label}`}
    >
      <Text style={[styles.label, { color: colorsForTone.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: typography.weights.semibold,
  },
});
