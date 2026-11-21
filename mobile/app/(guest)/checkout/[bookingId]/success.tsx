import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { LoadingView } from '@/components/StateViews';

/**
 * Wompi redirects to https://elevari.live/checkout/:bookingId/success. When Android opens
 * that link in the app, return to the checkout screen that is waiting for the payment
 * (or open it in "resume" mode if the app was restarted in the meantime).
 */
export default function CheckoutReturnScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  useEffect(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/checkout/${bookingId}?resume=1`);
    }
  }, [router, bookingId]);

  return <LoadingView />;
}
