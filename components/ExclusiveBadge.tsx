export default function ExclusiveBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`elevari-premium-badge ${className}`}>
      <span aria-hidden>✦</span>
      Experiencia exclusiva
    </span>
  );
}
