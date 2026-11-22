import { Pressable, PressableProps, StyleSheet, Text, View, ViewProps, ActivityIndicator } from 'react-native';
import { colors, radius, spacing, typography, shadows } from '@/lib/design-tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
}

const variantStyles: Record<ButtonVariant, { bg: string; color: string; border?: string }> = {
  primary: { bg: colors.forest, color: colors.surface },
  secondary: { bg: colors.surface, color: colors.forest, border: colors.border },
  ghost: { bg: 'transparent', color: colors.muted },
  accent: { bg: colors.amber, color: colors.amberInk },
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
  ...props
}: ButtonProps) {
  const vs = variantStyles[variant];
  const ss = sizeStyles[size];

  return (
    <Pressable
      disabled={disabled || loading}
      style={[
        styles.container,
        {
          backgroundColor: vs.bg,
          height: ss.height,
          borderRadius: radius.md,
          ...(fullWidth && { width: '100%' }),
          ...(vs.border && { borderWidth: 1, borderColor: vs.border }),
          ...(style && { ...style }),
        },
        ...(disabled || loading ? [{ opacity: 0.6 }] : []),
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vs.color} style={styles.loading} />
      ) : (
        <Text style={[
          styles.text,
          { color: vs.color, fontSize: ss.fontSize, fontWeight: typography.weights.semibold },
        ]}>
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
  text: {
    textAlign: 'center',
  },
  loading: {
    marginRight: spacing.sm,
  },
});