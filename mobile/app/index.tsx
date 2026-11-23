import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/lib/design-tokens';
import { LOGIN_HREF, homeHref } from '@/lib/routes';
import { useAppStore } from '@/lib/store';

// Entry route: sends each visitor to the right area once the saved session has been checked.
export default function Index() {
  const isLoading = useAppStore((state) => state.isLoading);
  const user = useAppStore((state) => state.user);

  // Same colour as the native splash screen, so the hand-off does not flash.
  if (isLoading) return <View style={styles.splash} />;

  return <Redirect href={user ? homeHref(user.role) : LOGIN_HREF} />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.forest },
});
