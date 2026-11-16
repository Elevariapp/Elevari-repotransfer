import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, shadows, spacing } from '@/lib/design-tokens';

export type CardElevation = 'flat' | 'card' | 'floating';

interface CardProps extends ViewProps {
  elevation?: CardElevation;
  padded?: boolean;
  children: React.ReactNode;
}

const elevationStyles: Record<CardElevation, any> = {
  flat: {},
  card: shadows.card,
  floating: shadows.floating,
};

export function Card({ elevation = 'card', padded = false, children, style, ...props }: CardProps) {
  return (
    <View
      style={[
        styles.container,
        elevationStyles[elevation],
        padded && { padding: spacing.md },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});