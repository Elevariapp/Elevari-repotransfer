interface StatusBadgeProps {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    APPROVED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    REJECTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${config.bg} ${config.text} ${config.border}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
