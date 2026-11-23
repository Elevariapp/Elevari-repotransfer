import { useRef, useState } from 'react';
import { StyleSheet, TextInputInstance } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { Banner } from '@/components/States';
import { getApiErrorMessage } from '@/lib/api';
import { spacing } from '@/lib/design-tokens';
import { updateProfile } from '@/lib/session';
import { useAppStore } from '@/lib/store';

const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;

interface FieldErrors {
  name?: string;
  phone?: string;
}

function validate(name: string, phone: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!name) errors.name = 'Ingresa tu nombre.';
  else if (name.length > 120) errors.name = 'El nombre no puede superar 120 caracteres.';

  if (phone && !PHONE_PATTERN.test(phone)) {
    errors.phone = 'Usa entre 7 y 20 dígitos; puedes incluir +, espacios, paréntesis o guiones.';
  }
  return errors;
}

export default function EditProfileScreen() {
  const user = useAppStore((state) => state.user);
  const phoneRef = useRef<TextInputInstance>(null);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  const unchanged = trimmedName === (user?.name ?? '') && trimmedPhone === (user?.phone ?? '');

  const handleSave = async () => {
    if (loading || unchanged) return;

    const errors = validate(trimmedName, trimmedPhone);
    setFieldErrors(errors);
    setError('');
    setSaved(false);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const updated = await updateProfile({ name: trimmedName, phone: trimmedPhone || null });
      setName(updated.name ?? '');
      setPhone(updated.phone ?? '');
      setSaved(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos guardar tus cambios. Inténtalo de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="Editar perfil"
      back
      backHref="/(guest)/profile"
      footer={
        <Button
          size="lg"
          fullWidth
          loading={loading}
          disabled={unchanged}
          onPress={handleSave}
          accessibilityLabel="Guardar cambios"
        >
          Guardar cambios
        </Button>
      }
    >
      {error ? <Banner tone="error">{error}</Banner> : null}
      {saved && unchanged ? <Banner tone="success">Tu perfil se actualizó correctamente.</Banner> : null}

      <Input
        label="Nombre"
        value={name}
        onChangeText={(value) => {
          setName(value);
          setSaved(false);
        }}
        placeholder="Tu nombre completo"
        error={fieldErrors.name}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        maxLength={120}
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
        editable={!loading}
      />
      <Input
        ref={phoneRef}
        label="Teléfono (opcional)"
        value={phone}
        onChangeText={(value) => {
          setPhone(value);
          setSaved(false);
        }}
        placeholder="+57 300 123 4567"
        hint="Lo usamos para coordinar tus reservas."
        error={fieldErrors.phone}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        maxLength={20}
        returnKeyType="done"
        onSubmitEditing={handleSave}
        editable={!loading}
      />
      <Input
        label="Correo electrónico"
        value={user?.email ?? ''}
        editable={false}
        hint="Para cambiar tu correo escríbenos por WhatsApp desde Perfil."
        style={styles.readonly}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  readonly: { marginTop: spacing.xs },
});
