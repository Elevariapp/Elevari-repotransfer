export default function AuthDivider({ label = 'o' }: { label?: string }) {
  return (
    <div className="elevari-auth-divider" role="separator" aria-label={label}>
      <span className="elevari-auth-divider-label">{label}</span>
    </div>
  );
}
