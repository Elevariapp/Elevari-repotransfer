import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { colors, spacing, typography } from '@/lib/design-tokens';

export function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.forest} />
    </View>
  );
}

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <Button variant="secondary" size="md" onPress={onRetry}>
          Reintentar
        </Button>
      )}
    </View>
  );
}

interface EmptyViewProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyView({ title, subtitle, actionLabel, onAction }: EmptyViewProps) {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onPress={onAction}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  errorText: { fontSize: typography.sizes.body, color: colors.error, textAlign: 'center', marginBottom: spacing.md },
  emptyTitle: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink, marginBottom: spacing.sm, textAlign: 'center' },
  emptySubtitle: { fontSize: typography.sizes.body, color: colors.muted, marginBottom: spacing.lg, textAlign: 'center' },
  banner: { backgroundColor: colors.errorSoft, borderRadius: 8, padding: spacing.md, marginBottom: spacing.md },
  bannerText: { fontSize: typography.sizes.caption, color: colors.error },
});
