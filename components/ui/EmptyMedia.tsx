type Props = {
  label?: string;
  className?: string;
};

export default function EmptyMedia({ label = 'Sin imagen', className = '' }: Props) {
  return (
    <div
      className={`wana-empty-media aspect-[4/3] w-full rounded-2xl ring-1 ring-wana-border/50 ${className}`}
    >
      <span className="text-2xl text-elevari-amber">✦</span>
      <span>{label}</span>
    </div>
  );
}
