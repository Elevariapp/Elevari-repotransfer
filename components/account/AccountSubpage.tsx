import Link from 'next/link';
import type { ReactNode } from 'react';

/** Back link, title and body shared by the /account sub-pages. */
export default function AccountSubpage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <>
      <Link
        href="/account"
        className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-elevari-forest hover:text-elevari-forest-deep"
      >
        <span aria-hidden>←</span> Mi cuenta
      </Link>
      <header className="mt-1">
        <p className="elevari-eyebrow">{eyebrow}</p>
        <h1 className="mt-1 font-display text-2xl text-elevari-slate sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-sm leading-relaxed text-elevari-muted">{description}</p>}
      </header>
      <div className="mt-6">{children}</div>
    </>
  );
}
