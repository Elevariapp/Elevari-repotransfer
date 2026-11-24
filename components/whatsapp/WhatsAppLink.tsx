import WhatsAppGlyph from '@/components/whatsapp/WhatsAppGlyph';
import { whatsappUrl } from '@/lib/whatsapp';

/**
 * surface: terracotta on light pages, amber in the dark theme (the forest token flips), 4.0:1 or better on white, cream, sand and the dark surfaces.
 * onDark: cream for the always-dark terracotta header and footer and for night scenes, 4.6:1 or better there.
 */
export type WhatsAppTone = 'surface' | 'onDark';

const COLOR: Record<WhatsAppTone, string> = {
  surface: 'text-elevari-forest focus-visible:outline-elevari-forest',
  onDark: 'text-[var(--elevari-champagne-light)] focus-visible:outline-[var(--elevari-champagne-light)]',
};
const ICON_HOVER: Record<WhatsAppTone, string> = {
  surface: 'hover:bg-elevari-forest/10',
  onDark: 'hover:bg-white/10 hover:text-white',
};
const INLINE_HOVER: Record<WhatsAppTone, string> = {
  surface: 'hover:text-elevari-forest hover:decoration-current',
  onDark: 'hover:text-white hover:decoration-current',
};

type Props = {
  /** Accessible name of the glyph-only link; the visible text of the inline one. */
  label: string;
  /** Prefilled message: whatsappContext() in lib/whatsapp.ts knows the right words for each page. */
  message?: string;
  /**
   * icon: the bare glyph in a 44px transparent hit area.
   * inline: the glyph beside a text link that stands on its own line.
   * flow: the glyph and text inside a sentence, kept on the text baseline with a faint underline.
   */
  variant?: 'icon' | 'inline' | 'flow';
  tone?: WhatsAppTone;
  /** inline only: a faint always-on underline (flow always has one). */
  underline?: boolean;
  /** Glyph size in px: 22 for the icon variant, 18 for inline, 14 for flow, unless set. */
  iconSize?: number;
  className?: string;
};

export default function WhatsAppLink({
  label,
  message,
  variant = 'inline',
  tone = 'surface',
  underline = false,
  iconSize,
  className = '',
}: Props) {
  const href = whatsappUrl(message);

  if (variant === 'icon') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label} (se abre WhatsApp)`}
        title={label}
        className={`group inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-200 motion-reduce:transition-none ${COLOR[tone]} ${ICON_HOVER[tone]} ${className}`}
      >
        <WhatsAppGlyph
          size={iconSize ?? 22}
          className="transition-transform duration-200 motion-safe:group-hover:scale-105 motion-reduce:transition-none"
        />
      </a>
    );
  }

  if (variant === 'flow') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`whitespace-nowrap rounded-sm font-semibold underline decoration-current/40 decoration-1 underline-offset-4 transition-colors duration-200 motion-reduce:transition-none ${COLOR[tone]} ${INLINE_HOVER[tone]} ${className}`}
      >
        <WhatsAppGlyph size={iconSize ?? 14} className="mr-1.5 inline-block align-[-0.15em]" />
        {label}
        <span className="sr-only"> (se abre WhatsApp)</span>
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center gap-2 rounded-sm font-medium underline-offset-4 decoration-1 transition-colors duration-200 motion-reduce:transition-none hover:underline ${
        underline ? 'underline decoration-current/40' : ''
      } ${COLOR[tone]} ${INLINE_HOVER[tone]} ${className}`}
    >
      <WhatsAppGlyph size={iconSize ?? 18} className="shrink-0" />
      <span>
        {label}
        <span className="sr-only"> (se abre WhatsApp)</span>
      </span>
    </a>
  );
}
