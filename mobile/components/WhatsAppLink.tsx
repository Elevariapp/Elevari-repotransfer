import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { WhatsAppGlyph } from '@/components/WhatsAppGlyph';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { openWhatsAppSupport } from '@/lib/support';

interface WhatsAppLinkProps {
  /** Visible text; the screen reader adds that it opens WhatsApp. */
  label: string;
  /** Prefilled message: the same words the web uses (lib/support.ts keeps them together). */
  message?: string;
  /** sm matches the 13pt text links of the checkout footer; md (default) suits body copy. */
  size?: 'sm' | 'md';
  align?: 'start' | 'center';
  style?: StyleProp<ViewStyle>;
}

/**
 * The quiet WhatsApp entry: a small terracotta glyph and a text link, never a button or a green badge.
 * Linking.openURL on the wa.me address opens WhatsApp when it is installed and the browser page
 * otherwise, so no app.json `queries` entry is needed (that is only for Linking.canOpenURL).
 */
export function WhatsAppLink({ label, message, size = 'md', align = 'start', style }: WhatsAppLinkProps) {
  return (
    <Pressable
      onPress={() => void openWhatsAppSupport(message)}
      accessibilityRole="link"
      accessibilityLabel={`${label} (se abre WhatsApp)`}
      style={({ pressed }) => [styles.row, align === 'center' && styles.center, pressed && styles.pressed, style]}
    >
      <WhatsAppGlyph size={size === 'sm' ? 16 : 18} />
      <Text style={[styles.text, size === 'sm' && styles.textSmall]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    minHeight: 44,
  },
  center: { alignSelf: 'center' },
  pressed: { opacity: 0.6 },
  text: { fontSize: typography.sizes.button, color: colors.forest, fontWeight: typography.weights.semibold },
  textSmall: { fontSize: typography.sizes.caption },
});
