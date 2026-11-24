import type { Metadata } from 'next';
import AccountSubpage from '@/components/account/AccountSubpage';
import NotificationPreferencesForm from '@/components/account/NotificationPreferencesForm';

export const metadata: Metadata = { title: 'Notificaciones' };

export default function NotificationsPage() {
  return (
    <AccountSubpage
      eyebrow="Configuración"
      title="Notificaciones"
      description="Elige qué avisos quieres recibir y por dónde. Los cambios se guardan al instante."
    >
      <NotificationPreferencesForm />
    </AccountSubpage>
  );
}
