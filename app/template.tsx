/**
 * Page wrapper: intentionally animation-free so first paint is not delayed.
 * Per-section animation stays in the section components.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
