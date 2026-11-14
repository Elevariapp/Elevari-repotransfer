'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const adminLinks = [
  { href: '/admin', label: 'Resumen', exact: true },
  { href: '/admin/properties', label: 'Propiedades' },
  { href: '/admin/moderation', label: 'Media' },
  { href: '/admin/bookings', label: 'Reservas' },
  { href: '/admin/invoices', label: 'Facturas' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {adminLinks.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? 'bg-elevari-forest-deep text-white'
                : 'border border-elevari-border bg-white text-elevari-slate hover:border-elevari-forest'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
