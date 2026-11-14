import Link from 'next/link';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  emoji?: string;
};

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  emoji = '🌿',
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-elevari-border bg-gradient-to-b from-elevari-ivory to-elevari-sand/40 p-10 text-center sm:p-12">
      <p className="text-4xl" aria-hidden>
        {emoji}
      </p>
      <h2 className="mt-4 font-display text-xl text-elevari-slate">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-elevari-muted leading-relaxed">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="wana-btn-primary mt-6 inline-flex">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
