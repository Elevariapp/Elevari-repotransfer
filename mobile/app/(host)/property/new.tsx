import { StyleSheet, View, Text, SafeAreaView, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { colors, spacing, typography } from '@/lib/design-tokens';

export default function NewPropertyScreen() {
  return (
    <KeyboardAvoidingView behavior="padding" style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Nueva propiedad</Text>
            <Text style={styles.subtitle}>Crea tu anuncio en Waná</Text>
          </View>

          <View style={styles.form}>
            <Input label="Título" placeholder="Cabaña acogedora en el bosque" />
            <Input label="Ubicación" placeholder="Guatapé, Antioquia" />
            <Input label="Precio por noche (COP)" placeholder="150000" keyboardType="numeric" />
            <Input label="Descripción" placeholder="Cuenta qué hace especial a tu propiedad" />
            <Input label="Capacidad" placeholder="4 huéspedes" keyboardType="numeric" />
            <Input label="Habitaciones" placeholder="2" keyboardType="numeric" />
            <Input label="Baños" placeholder="1" keyboardType="numeric" />
          </View>

          <Button variant="primary" size="lg" fullWidth onPress={() => {}}>
            Publicar propiedad
          </Button>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  title: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink, marginBottom: spacing.sm },
  subtitle: { fontSize: typography.sizes.body, color: colors.muted },
  form: { gap: spacing.md },
});