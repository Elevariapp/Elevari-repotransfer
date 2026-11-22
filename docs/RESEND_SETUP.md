# Resend Email Setup

## Brand Configuration

### Brand Colors
| Element | Color | Hex |
|---------|-------|-----|
| Primary | Forest | `#D97706` |
| Secondary | Slate | `#0F172A` |
| Accent | Amber | `#D97706` |
| Button Background | Forest | `#D97706` |
| Button Text | White | `#FFFFFF` |
| Link Color | Forest | `#D97706` |
| Footer Background | Slate | `#0F172A` |
| Footer Text | Ivory | `#FEF3C7` |

### Logo
- **URL:** `https://raw.githubusercontent.com/Elevariapp/Elevari-repotransfer/b-main/public/brand/logo-concept-4-blend.svg`
- **File:** `public/brand/logo-concept-4-blend.svg`

### Company Information
- **Company:** Elevari S.A.S
- **NIT:** 902088849
- **Address:** CR 5 NO. 16 14 OF 711 ED EL GLOBO, BOGOTÁ, D.C, código postal 111711
- **Support Email:** soporte@elevari.com
- **WhatsApp:** +57 3232688534

## Email Templates

All templates are located in `api/src/lib/email-templates/`:

| File | Purpose |
|------|---------|
| `brand.ts` | Brand colors, logo URL, company info |
| `layout.ts` | Email shell/layout with header/footer branding |
| `index.ts` | Template exports |
| `booking-confirmation.ts` | Booking confirmation email |
| `booking-cancellation.ts` | Booking cancellation email |
| `check-in-reminder.ts` | Check-in reminder email |
| `invoice-receipt.ts` | Invoice/receipt email |
| `password-changed.ts` | Password changed notification |
| `password-reset.ts` | Password reset email |
| `welcome.ts` | Welcome email |

## Sender Configuration

See `api/src/lib/email.ts` for sender name/email configuration.

**Sender:** Elevari S.A.S <noreply@elevari.com>

## Environment Variables

```bash
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@elevari.com
RESEND_FROM_NAME=Elevari S.A.S
```

## Usage

```typescript
import { TRANSACTIONAL_EMAILS } from './api/src/lib/transactional-emails';

const html = TRANSACTIONAL_EMAILS.bookingConfirmation({
  bookingId: 'BK-12345',
  propertyName: 'Glamping Mountain View',
  checkIn: '2024-01-15',
  checkOut: '2024-01-18',
  total: '$150.000 COP',
  guestName: 'Juan Pérez',
});
```