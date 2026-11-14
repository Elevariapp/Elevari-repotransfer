interface ActionButtonProps {
  onClick: () => void;
  label: string;
  variant: 'primary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

export default function ActionButton({
  onClick,
  label,
  variant,
  disabled = false,
  loading = false,
}: ActionButtonProps) {
  const base =
    'min-h-[40px] rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';

  const variantClasses = {
    primary: 'elevari-btn-primary !py-2',
    danger: 'elevari-btn-danger',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variantClasses[variant]}`}
    >
      {loading ? 'Procesando…' : label}
    </button>
  );
}
