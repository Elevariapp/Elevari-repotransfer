import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { WHATSAPP_NUMBER, whatsappContext, whatsappUrl } from '@/lib/whatsapp';

function glyphPaths(file: string) {
  const source = readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  const grab = (name: string) => source.match(new RegExp(`const ${name} =\\s*'([^']+)'`))?.[1];
  return { bubble: grab('BUBBLE'), handset: grab('HANDSET') };
}

describe('WhatsApp glyph', () => {
  it('is drawn with the same paths on the web and in the mobile app', () => {
    const web = glyphPaths('components/whatsapp/WhatsAppGlyph.tsx');
    expect(web.bubble).toBeTruthy();
    expect(web.handset).toBeTruthy();
    expect(glyphPaths('mobile/components/WhatsAppGlyph.tsx')).toEqual(web);
  });
});

describe('WhatsApp links', () => {
  it('builds a wa.me URL with the prefilled message encoded', () => {
    expect(whatsappUrl()).toBe(`https://wa.me/${WHATSAPP_NUMBER}`);
    expect(whatsappUrl('Hola, ¿qué tal?')).toBe(`https://wa.me/${WHATSAPP_NUMBER}?text=Hola%2C%20%C2%BFqu%C3%A9%20tal%3F`);
  });

  it('puts the property page address in the message about that space', () => {
    const { message } = whatsappContext('/properties/glamping-wana');
    expect(message).toContain('/properties/glamping-wana');
  });

  it('names the booking on the payment and confirmation pages', () => {
    expect(whatsappContext('/checkout/bk_123').message).toContain('bk_123');
    expect(whatsappContext('/checkout/bk_123/success').message).toContain('bk_123');
  });

  it('falls back to the general greeting elsewhere', () => {
    expect(whatsappContext('/legal/faq').label).toBe('Escríbenos por WhatsApp');
  });
});
