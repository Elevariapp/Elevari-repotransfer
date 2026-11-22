import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors, spacing, typography } from '@/lib/design-tokens';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Política de privacidad</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Última actualización: 19 de noviembre de 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Responsable</Text>
          <Text style={styles.body}>
            Eleveri opera la plataforma de reservas de experiencias de glamping y refugios en
            Colombia. Para consultas sobre privacidad escríbenos a privacidad@elevari.live.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Datos que recopilamos</Text>
          <Text style={styles.body}>
            Datos de cuenta: nombre, correo electrónico, contraseña (hash) y rol (huésped o
            anfitrión). Datos de reserva: fechas, número de huéspedes, desglose de precios y estado
            de la reserva. Datos de pago: procesados por Wompi (tarjetas, PSE, Nequi y Bancolombia)
            en pesos colombianos; no almacenamos números completos de tarjeta. Contenido multimedia
            subido por anfitriones para describir sus espacios (fotos, descripciones). Datos
            técnicos: cookies de sesión, logs de acceso, dirección IP y métricas de uso (analytics).
            Datos de ubicación aproximada para mostrar propiedades cercanas (solo con tu
            consentimiento en la app móvil).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Uso de la información</Text>
          <Text style={styles.body}>
            Utilizamos tus datos para gestionar reservas, procesar pagos, emitir facturas cuando
            aplique, comunicar el estado de tu estadía, mejorar la plataforma, enviar notificaciones
            y cumplir obligaciones legales en Colombia.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Compartición con terceros</Text>
          <Text style={styles.body}>
            Compartimos datos solo con proveedores necesarios para el servicio: procesadores de pago
            (Wompi), almacenamiento de archivos, email transaccional, facturación (Alegra) y
            herramientas de analítica. No vendemos datos personales.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Tus derechos</Text>
          <Text style={styles.body}>
            Puedes solicitar acceso, corrección, supresión o portabilidad de tus datos
            contactándonos a privacidad@elevari.live. Responderemos conforme a la Ley 1581 de 2012 y
            normas complementarias sobre protección de datos en Colombia. También puedes solicitar la
            eliminación completa de tu cuenta desde la sección Eliminar mi cuenta.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Seguridad</Text>
          <Text style={styles.body}>
            Aplicamos autenticación segura, comunicación cifrada en tránsito (TLS) y controles de
            acceso por rol. Ningún sistema es 100% seguro; te recomendamos usar contraseñas fuertes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Retención de datos</Text>
          <Text style={styles.body}>
            Conservamos tus datos mientras sea necesario para los fines descritos en esta política o
            para cumplir obligaciones legales. Tras la eliminación de tu cuenta, los datos se
            anonimizan o se eliminan salvo requisitos legales de retención.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Transferencias internacionales</Text>
          <Text style={styles.body}>
            Algunos proveedores de servicios pueden estar ubicados fuera de Colombia. En esos casos,
            garantizamos que existan cláusulas contractuales tipo o mecanismos equivalentes de
            protección de datos.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  backButton: { padding: spacing.sm },
  backText: { fontSize: typography.sizes.body, color: colors.muted },
  title: {
    flex: 1,
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.ink,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  subtitle: {
    fontSize: typography.sizes.caption,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: typography.sizes.body,
    color: colors.slate,
    lineHeight: 22,
  },
});