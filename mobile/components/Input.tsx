import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputInstance, TextInputProps, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/lib/design-tokens';

interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<TextInputInstance, InputProps>(function Input(
  { label, hint, error, style, secureTextEntry, multiline, accessibilityLabel, editable = true, ...props },
  ref,
) {
  const [revealed, setRevealed] = useState(false);
  const hasToggle = Boolean(secureTextEntry);

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          error ? { borderColor: colors.error } : null,
          !editable && styles.fieldDisabled,
        ]}
      >
        <TextInput
          ref={ref}
          style={[styles.input, multiline && styles.inputMultiline]}
          placeholderTextColor={colors.muted}
          accessibilityLabel={accessibilityLabel ?? label}
          secureTextEntry={hasToggle && !revealed}
          multiline={multiline}
          editable={editable}
          {...props}
        />
        {hasToggle ? (
          <Pressable
            onPress={() => setRevealed((value) => !value)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>{revealed ? 'Ocultar' : 'Mostrar'}</Text>
          </Pressable>
        ) : null}
      </View>
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

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
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  fieldMultiline: {
    alignItems: 'flex-start',
  },
  fieldDisabled: {
    backgroundColor: colors.freshSoft,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.body,
    color: colors.ink,
  },
  inputMultiline: {
    minHeight: 112,
    textAlignVertical: 'top',
  },
  toggle: {
    marginLeft: spacing.sm,
    paddingVertical: spacing.sm,
  },
  toggleText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.forest,
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