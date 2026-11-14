import Header from '@/components/Header';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="contenido" className="elevari-container py-8 lg:py-12">
        <div className="elevari-prose">{children}</div>
      </main>
    </>
  );
}
