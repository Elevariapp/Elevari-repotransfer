type ElevariBlendProps = {
  size?: number | string;
  className?: string;
  fill?: string;
  title?: string;
};

/**
 * Elevari Blend — Concept 4 blend logo.
 * App Store-style rounded square with continuous loop + elevated amber point.
 * Brand colors: forest-deep plate, fresh loop, amber soft accent, amber dot.
 * See public/brand/logo-concept-4-blend.svg
 */
export default function ElevariBlend({
  size = 40,
  className,
  fill,
  title = 'Elevari',
}: ElevariBlendProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect width="512" height="512" rx="120" fill={fill ?? '#1E4835'} />
      <path
        d="M160 288C160 216 204 160 256 160C308 160 352 216 352 288"
        stroke="#5FA76A"
        strokeWidth="30"
        strokeLinecap="round"
      />
      <path
        d="M160 288C160 352 204 392 256 392C308 392 352 352 352 288"
        stroke="#5FA76A"
        strokeWidth="30"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M196 300H316"
        stroke="#F6E3B8"
        strokeWidth="22"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="256" cy="288" r="30" fill="#E9A820" />
      <circle cx="256" cy="160" r="14" fill="#E9A820" opacity="0.9" />
      <path
        d="M256 160C256 128 280 104 312 104C344 104 368 128 368 160"
        stroke="#F6E3B8"
        strokeWidth="18"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}