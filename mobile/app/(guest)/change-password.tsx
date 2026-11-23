import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInputInstance } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { Banner } from '@/components/States';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { changePassword } from '@/lib/session';
import { useAppStore } from '@/lib/store';

interface FieldErrors {
  current?: string;
  next?: string;
  confirm?: string;
}

function validate(requiresCurrent: boolean, current: string, next: string, confirm: string): FieldErrors {
  const errors: FieldErrors = {};
  if (requiresCurrent && !current) errors.current = 'Ingresa tu contraseña actual.';

  if (next.length < 8) errors.next = 'La contraseña debe tener al menos 8 caracteres.';
  else if (next.length > 128) errors.next = 'La contraseña no puede superar 128 caracteres.';
  else if (requiresCurrent && next === current) errors.next = 'La nueva contraseña debe ser distinta a la actual.';

  if (!confirm) errors.confirm = 'Repite la nueva contraseña.';
  else if (confirm !== next) errors.confirm = 'Las contraseñas no coinciden.';
  return errors;
}

export default function ChangePasswordScreen() {
  const hasPassword = useAppStore((state) => state.user?.has_password !== false);
  const nextRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const title = hasPassword ? 'Cambiar contraseña' : 'Crear contraseña';

  const handleSubmit = async () => {
    if (loading) return;

    const errors = validate(hasPassword, current, next, confirm);
    setFieldErrors(errors);
    setError('');
    setSuccess('');
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await changePassword({ currentPassword: hasPassword ? current : undefined, newPassword: next });
      setSuccess(
        hasPassword
          ? 'Tu contraseña se cambió correctamente. Te enviamos un aviso a tu correo.'
          : 'Tu contraseña se creó correctamente. Ya puedes iniciar sesión también con tu correo.',
      );
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      const message = getApiErrorMessage(err, 'No pudimos cambiar tu contraseña. Inténtalo de nuevo.');
      // A wrong current password is a field problem, not a session problem.
      if (getApiErrorCode(err) === 'invalid_current_password') setFieldErrors({ current: message });
      else setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title={title}
      back
      backHref="/(guest)/profile"
      footer={
        <Button size="lg" fullWidth loading={loading} onPress={handleSubmit} accessibilityLabel={title}>
          {title}
        </Button>
      }
    >
      {error ? <Banner tone="error">{error}</Banner> : null}
      {success ? <Banner tone="success">{success}</Banner> : null}

      {!hasPassword ? (
        <Text style={styles.intro}>
          Tu cuenta se creó con Google y todavía no tiene contraseña. Crea una para poder iniciar sesión también con tu
          correo.
        </Text>
      ) : null}

      {hasPassword ? (
        <Input
          label="Contraseña actual"
          value={current}
          onChangeText={setCurrent}
          error={fieldErrors.current}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="next"
          onSubmitEditing={() => nextRef.current?.focus()}
          editable={!loading}
        />
      ) : null}
      <Input
        ref={nextRef}
        label="Nueva contraseña"
        value={next}
        onChangeText={setNext}
        hint="Entre 8 y 128 caracteres."
        error={fieldErrors.next}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        editable={!loading}
      />
      <Input
        ref={confirmRef}
        label="Repite la nueva contraseña"
        value={confirm}
        onChangeText={setConfirm}
        error={fieldErrors.confirm}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        editable={!loading}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontSize: typography.sizes.caption,
    lineHeight: 19,
    color: colors.muted,
    marginBottom: spacing.md,
  },
});
