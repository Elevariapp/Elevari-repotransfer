import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ElevariMark } from '@/components/ElevariMark';
import { spacing } from '@/lib/design-tokens';
import ScenicBackground from './ScenicBackground';
import { useCalm, useParallax, useStableWindow } from './motion';

/** The sheet's top corner radius; the scene runs this far below the visible hero so the corners sit on it. */
const SHEET_RADIUS = 28;
const SHEET = '#FFFBEB';
/** Shortest side, in dp, from which a screen counts as a tablet. */
const TABLET = 600;

interface SceneScreenProps {
  children: ReactNode;
}

/**
 * Auth screens over the Elevari scene. Portrait phones get the scene as a hero with the form on a cream sheet
 * rising from the bottom; landscape phones and tablets get a cream card over the full-bleed scene (high in the
 * sky on portrait tablets, so the sun and the lake stay in view). The form always sits on an opaque surface, so
 * its contrast never depends on the scene behind it.
 */
export function SceneScreen({ children }: SceneScreenProps) {
  const { width, height } = useStableWindow();
  const insets = useSafeAreaInsets();
  const [focused, setFocused] = useState(true);
  const calm = useCalm(!focused);
  const { parallax, handlers } = useParallax(calm);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const portrait = height >= width;
  const sheet = portrait && Math.min(width, height) < TABLET;
  const hero = Math.max(250, Math.min(420, Math.round(height * 0.4)));

  return (
    <View style={styles.root} {...handlers}>
      <StatusBar style="light" />
      <ScenicBackground
        paused={!focused}
        parallax={parallax}
        stageHeight={sheet ? hero + SHEET_RADIUS : undefined}
      />

      <View style={[styles.brand, { top: insets.top + spacing.md, left: Math.max(insets.left, 0) + spacing.lg }]}>
        <ElevariMark size={34} plain />
        <Text style={styles.brandName}>Elevari</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={
            sheet
              ? { flexGrow: 1, paddingTop: hero }
              : {
                  flexGrow: 1,
                  justifyContent: portrait ? 'flex-start' : 'center',
                  alignItems: 'center',
                  paddingTop: portrait ? Math.max(insets.top + 72, height * 0.1) : insets.top + spacing.md,
                  paddingBottom: insets.bottom + spacing.md,
                  paddingLeft: Math.max(insets.left, spacing.lg),
                  paddingRight: Math.max(insets.right, spacing.lg),
                }
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={
              sheet
                ? [styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]
                : [styles.card, { paddingBottom: spacing.lg }]
            }
          >
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#7C2D12' },
  flex: { flex: 1 },
  brand: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, pointerEvents: 'none' },
  brandName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(24, 8, 3, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  sheet: {
    flexGrow: 1,
    width: '100%',
    backgroundColor: SHEET,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    paddingHorizontal: spacing.lg,
    paddingTop: SHEET_RADIUS,
    shadowColor: '#180803',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: SHEET,
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    shadowColor: '#180803',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 12,
  },
});
