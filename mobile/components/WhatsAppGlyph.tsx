import Svg, { Path } from 'react-native-svg';
import { colors } from '@/lib/design-tokens';

// The same two paths as components/whatsapp/WhatsAppGlyph.tsx on the web (a hairline bubble with a solid
// handset, no plate and no brand green). tests/whatsapp.test.ts fails when the two drawings drift apart.
const BUBBLE = 'M4.3 27.7 L5.72 21.97 A11.9 11.9 0 1 1 10.19 26.3 Z';
const HANDSET =
  'M21.97 18.72c-.32-.16-1.92-.95-2.22-1.06-.3-.1-.52-.16-.73.17-.22.32-.84 1.05-1.03 1.27-.19.21-.38.24-.7.08-.33-.16-1.37-.5-2.6-1.6-.96-.86-1.6-1.9-1.8-2.22-.18-.32-.02-.5.14-.66.15-.14.33-.38.5-.57.16-.19.21-.32.32-.54.1-.21.05-.4-.03-.57-.08-.16-.73-1.76-1-2.4-.26-.63-.53-.54-.73-.55h-.62c-.21 0-.56.08-.86.4-.3.32-1.13 1.1-1.13 2.7 0 1.6 1.16 3.14 1.32 3.36.16.21 2.28 3.48 5.53 4.88.77.33 1.38.53 1.85.68.78.25 1.49.21 2.05.13.62-.09 1.92-.78 2.19-1.54.27-.75.27-1.4.19-1.54-.08-.13-.3-.21-.62-.37z';

interface WhatsAppGlyphProps {
  size?: number;
  color?: string;
}

export function WhatsAppGlyph({ size = 20, color = colors.forest }: WhatsAppGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <Path d={BUBBLE} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={HANDSET} fill={color} />
    </Svg>
  );
}
