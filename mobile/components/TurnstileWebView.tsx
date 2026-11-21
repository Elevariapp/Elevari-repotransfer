import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { colors, radius, spacing, typography } from '@/lib/design-tokens';
import { SITE_URL, TURNSTILE_SITE_KEY } from '@/lib/config';

export interface TurnstileWebViewHandle {
  /** Discards the current token and renders a fresh widget (tokens are single-use). */
  reset: () => void;
}

interface TurnstileWebViewProps {
  /** Called with a fresh token, or null once the token is no longer usable. */
  onToken: (token: string | null) => void;
  onError?: (message: string) => void;
}

const LOAD_TIMEOUT_MS = 20000;
const ALLOWED_HOSTS = ['elevari.live', 'cloudflare.com'];

function buildHtml(siteKey: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  html, body { margin: 0; padding: 0; background: transparent; }
  body { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
</style>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>
</head>
<body>
<div id="turnstile-box"></div>
<script>
  function send(payload) {
    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
  }
  function mount() {
    if (!window.turnstile) { setTimeout(mount, 100); return; }
    window.turnstile.render('#turnstile-box', {
      sitekey: ${JSON.stringify(siteKey)},
      language: 'es',
      callback: function (token) { send({ type: 'token', token: token }); },
      'expired-callback': function () { send({ type: 'expired' }); },
      'timeout-callback': function () { send({ type: 'expired' }); },
      'error-callback': function (code) { send({ type: 'error', code: String(code) }); return true; }
    });
    send({ type: 'ready' });
  }
  mount();
</script>
</body>
</html>`;
}

function isAllowedUrl(url: string): boolean {
  if (url === 'about:blank') return true;
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== 'https:') return false;
    return ALLOWED_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

export const TurnstileWebView = forwardRef<TurnstileWebViewHandle, TurnstileWebViewProps>(
  function TurnstileWebView({ onToken, onError }, ref) {
    const [nonce, setNonce] = useState(0);
    const [ready, setReady] = useState(false);
    const [verified, setVerified] = useState(false);
    const [failed, setFailed] = useState(false);
    const readyRef = useRef(false);
    const onTokenRef = useRef(onToken);
    const onErrorRef = useRef(onError);
    onTokenRef.current = onToken;
    onErrorRef.current = onError;
    const html = useMemo(() => buildHtml(TURNSTILE_SITE_KEY), []);

    const reload = useCallback(() => {
      readyRef.current = false;
      setReady(false);
      setVerified(false);
      setFailed(false);
      onTokenRef.current(null);
      setNonce((n) => n + 1);
    }, []);

    useImperativeHandle(ref, () => ({ reset: reload }), [reload]);

    const fail = useCallback((message: string) => {
      setFailed(true);
      setVerified(false);
      onTokenRef.current(null);
      onErrorRef.current?.(message);
    }, []);

    useEffect(() => {
      const timer = setTimeout(() => {
        if (!readyRef.current) fail('No se pudo cargar la verificación de seguridad.');
      }, LOAD_TIMEOUT_MS);
      return () => clearTimeout(timer);
    }, [nonce, fail]);

    const handleMessage = (event: WebViewMessageEvent) => {
      let message: { type?: string; token?: string };
      try {
        message = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      switch (message.type) {
        case 'ready':
          readyRef.current = true;
          setReady(true);
          break;
        case 'token':
          if (message.token) {
            setVerified(true);
            setFailed(false);
            onTokenRef.current(message.token);
          }
          break;
        case 'expired':
          setVerified(false);
          onTokenRef.current(null);
          break;
        case 'error':
          fail('La verificación de seguridad falló. Inténtalo de nuevo.');
          break;
      }
    };

    return (
      <View style={styles.wrapper}>
        {failed ? (
          <View style={styles.box}>
            <Text style={styles.errorText}>No se pudo completar la verificación de seguridad.</Text>
            <TouchableOpacity onPress={reload} accessibilityRole="button">
              <Text style={styles.retry}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.box}>
            <WebView
              key={nonce}
              style={styles.webview}
              source={{ html, baseUrl: SITE_URL }}
              originWhitelist={['https://*', 'about:*']}
              javaScriptEnabled
              domStorageEnabled
              setSupportMultipleWindows={false}
              scrollEnabled={false}
              overScrollMode="never"
              androidLayerType="hardware"
              onMessage={handleMessage}
              onShouldStartLoadWithRequest={(request) => isAllowedUrl(request.url)}
              onError={() => fail('No se pudo cargar la verificación de seguridad.')}
              onHttpError={() => fail('No se pudo cargar la verificación de seguridad.')}
            />
            {!ready && (
              <View style={styles.overlay} pointerEvents="none">
                <ActivityIndicator size="small" color={colors.forest} />
              </View>
            )}
          </View>
        )}
        {verified && <Text style={styles.okText}>Verificación completada</Text>}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  wrapper: { marginVertical: spacing.sm },
  box: {
    height: 74,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webview: { width: '100%', height: 74, backgroundColor: 'transparent' },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: typography.sizes.caption, color: colors.error, marginBottom: spacing.xs },
  retry: { fontSize: typography.sizes.caption, color: colors.forest, fontWeight: typography.weights.semibold },
  okText: { fontSize: typography.sizes.caption, color: colors.success, marginTop: spacing.xs, textAlign: 'center' },
});
