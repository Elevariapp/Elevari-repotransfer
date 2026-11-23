import type { Metadata } from 'next';
import AccountSubpage from '@/components/account/AccountSubpage';
import ProfileForm from '@/components/account/ProfileForm';

export const metadata: Metadata = { title: 'Editar perfil' };

export default function ProfilePage() {
  return (
    <AccountSubpage
      eyebrow="Configuración"
      title="Editar perfil"
      description="Mantén tus datos al día para que podamos contactarte sobre tus reservas."
    >
      <ProfileForm />
    </AccountSubpage>
  );
}
