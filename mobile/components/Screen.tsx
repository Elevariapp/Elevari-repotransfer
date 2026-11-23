import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/lib/design-tokens';

interface ScreenProps {
  children: ReactNode;
  title?: string;
  // Shows a back arrow; `backHref` is used when there is no history (deep link, cold start).
  back?: boolean;
  backHref?: string;
  headerRight?: ReactNode;
  // Sticky area under the content (e.g. the main call-to-action); it rises above the keyboard.
  footer?: ReactNode;
  // Pass `false` when the screen renders its own FlatList.
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  // A bottom tab bar sits under this screen and already covers the bottom safe-area inset.
  tabbed?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({
  children,
  title,
  back = false,
  backHref,
  headerRight,
  footer,
  scroll = true,
  refreshing = false,
  onRefresh,
  tabbed = false,
  contentStyle,
}: ScreenProps) {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(backHref ?? '/');
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.root} edges={tabbed ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right']}>
        {title ? (
          <View style={styles.header}>
            {back ? (
              <Pressable
                onPress={goBack}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Volver"
                style={styles.backButton}
              >
                <Text style={styles.backText}>←</Text>
              </Pressable>
            ) : null}
            <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
            {headerRight}
          </View>
        ) : null}

        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.forest}
                  colors={[colors.forest]}
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={styles.flex}>{children}</View>
        )}

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: { paddingVertical: spacing.sm, paddingRight: spacing.md },
  backText: { fontSize: typography.sizes.heading, color: colors.muted },
  title: {
    flex: 1,
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.ink,
  },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
