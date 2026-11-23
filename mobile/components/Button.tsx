import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, PressableProps, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/lib/design-tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const variantStyles: Record<ButtonVariant, { bg: string; color: string; border?: string }> = {
  primary: { bg: colors.forest, color: colors.surface },
  secondary: { bg: colors.surface, color: colors.forest, border: colors.border },
  ghost: { bg: 'transparent', color: colors.muted },
  accent: { bg: colors.amber, color: colors.amberInk },
  danger: { bg: colors.error, color: colors.surface },
};

const sizeStyles: Record<ButtonSize, { height: number; padding: number; fontSize: number }> = {
  sm: { height: 40, padding: 10, fontSize: typography.sizes.button },
  md: { height: 48, padding: 14, fontSize: typography.sizes.body },
  lg: { height: 56, padding: 18, fontSize: typography.sizes.body },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled = false,
  children,
  style,
  accessibilityLabel,
  ...props
}: ButtonProps) {
  const vs = variantStyles[variant];
  const ss = sizeStyles[size];
  const inactive = disabled || loading;

  return (
    <Pressable
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (typeof children === 'string' ? children : undefined)}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: vs.bg,
          height: ss.height,
          borderRadius: radius.md,
          opacity: inactive ? 0.6 : pressed ? 0.85 : 1,
        },
        fullWidth && styles.fullWidth,
        vs.border ? { borderWidth: 1, borderColor: vs.border } : null,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vs.color} />
      ) : (
        <Text
          style={[
            styles.text,
            { color: vs.color, fontSize: ss.fontSize, fontWeight: typography.weights.semibold },
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    textAlign: 'center',
  },
});