import type { Metadata } from 'next';
import AccountSubpage from '@/components/account/AccountSubpage';
import SecurityForm from '@/components/account/SecurityForm';

export const metadata: Metadata = { title: 'Contraseña y seguridad' };

export default function SecurityPage() {
  return (
    <AccountSubpage
      eyebrow="Configuración"
      title="Contraseña y seguridad"
      description="Te avisaremos por correo cada vez que cambie la contraseña de tu cuenta."
    >
      <SecurityForm />
    </AccountSubpage>
  );
}
