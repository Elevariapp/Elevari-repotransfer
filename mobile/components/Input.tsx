import { StyleSheet, Text, TextInput, TextInputProps, View, ViewProps } from 'react-native';
import { colors, radius, spacing, typography } from '@/lib/design-tokens';

interface InputProps extends TextInputProps, ViewProps {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, style, ...props }: InputProps) {
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          error && { borderColor: colors.error },
        ]}
        {...props}
      />
      {hint && !error && (
        <Text style={styles.hint}>{hint}</Text>
      )}
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.slate,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.body,
    color: colors.ink,
    minHeight: 48,
  },
  hint: {
    fontSize: typography.sizes.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  error: {
    fontSize: typography.sizes.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});