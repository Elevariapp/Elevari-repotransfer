import ScenicBackground from '@/components/scene/ScenicBackground';

type Props = {
  /** Unique per band on a page; the scene's SVG gradient ids derive from it. */
  idPrefix: string;
  children: React.ReactNode;
  className?: string;
};

/** A section with the Elevari horizon scene behind its content. */
export default function SceneBand({ idPrefix, children, className = '' }: Props) {
  return (
    <section className={`relative overflow-hidden min-h-[240px] ${className}`}>
      <ScenicBackground variant="lite" idPrefix={idPrefix} scrim="center" />
      <div className="relative">{children}</div>
    </section>
  );
}
