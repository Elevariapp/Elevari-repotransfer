import { redirect } from 'next/navigation';

export default function HeartbeatPage() {
  redirect('/health');
}
