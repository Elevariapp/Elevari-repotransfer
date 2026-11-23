import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { colors, radius, spacing, typography } from '@/lib/design-tokens';

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={colors.forest} />
      <Text style={styles.message}>{label}</Text>
    </View>
  );
}

interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button variant="secondary" onPress={onAction}>
            {actionLabel}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({ message, onRetry, retryLabel = 'Reintentar' }: ErrorStateProps) {
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      <Text style={[styles.title, { color: colors.error }]}>Algo salió mal</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <View style={styles.action}>
          <Button variant="secondary" onPress={onRetry}>
            {retryLabel}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

type BannerTone = 'error' | 'success' | 'info';

const bannerColors: Record<BannerTone, { bg: string; fg: string; border: string }> = {
  error: { bg: colors.errorSoft, fg: colors.error, border: colors.error },
  success: { bg: '#DCFCE7', fg: '#166534', border: '#86EFAC' },
  info: { bg: colors.amberSoft, fg: colors.amberInk, border: colors.amber },
};

// Inline message shown above a form (server errors, confirmations, notices).
export function Banner({ tone = 'info', children }: { tone?: BannerTone; children: ReactNode }) {
  const palette = bannerColors[tone];
  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: palette.bg, borderColor: palette.border }]}
    >
      <Text style={[styles.bannerText, { color: palette.fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.sizes.caption,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 19,
  },
  action: { marginTop: spacing.sm, minWidth: 160 },
  banner: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  bannerText: {
    fontSize: typography.sizes.caption,
    lineHeight: 19,
    fontWeight: typography.weights.medium,
  },
});
