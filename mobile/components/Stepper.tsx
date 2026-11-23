import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/lib/design-tokens';

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  hint?: string;
}

export function Stepper({ label, value, min, max, onChange, hint }: StepperProps) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <View style={styles.controls}>
        <Pressable
          onPress={() => canDecrease && onChange(value - 1)}
          disabled={!canDecrease}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Disminuir ${label.toLowerCase()}`}
          accessibilityState={{ disabled: !canDecrease }}
          style={[styles.button, !canDecrease && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>−</Text>
        </Pressable>
        <Text style={styles.value} accessibilityLiveRegion="polite">
          {value}
        </Text>
        <Pressable
          onPress={() => canIncrease && onChange(value + 1)}
          disabled={!canIncrease}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${label.toLowerCase()}`}
          accessibilityState={{ disabled: !canIncrease }}
          style={[styles.button, !canIncrease && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  texts: { flex: 1, paddingRight: spacing.md },
  label: { fontSize: typography.sizes.body, fontWeight: typography.weights.medium, color: colors.ink },
  hint: { fontSize: typography.sizes.caption, color: colors.muted, marginTop: 2 },
  controls: { flexDirection: 'row', alignItems: 'center' },
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { fontSize: 22, color: colors.forest, lineHeight: 24 },
  value: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
  },
});
