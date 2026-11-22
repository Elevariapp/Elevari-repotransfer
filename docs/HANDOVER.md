# Elevari Handover Documentation

## Brand Assets

### Logo
- **Primary Logo:** `public/brand/logo-concept-4-blend.svg` (Concept 4 Blend)
- **Component:** `components/brand/ElevariBlend.tsx`
- **Mark Component:** `components/brand/ElevariMark.tsx`
- **Logo Component:** `components/brand/Logo.tsx`
- **WhatsApp Button:** `components/brand/WhatsAppButton.tsx`
- **Cinematic Background:** `components/brand/CinematicBackground.tsx`
- **Google Map:** `components/brand/GoogleMap.tsx`

### Brand Colors
| Element | Color | Hex |
|---------|-------|-----|
| Primary | Amber | `#F59E0B` |
| Dark | Amber Dark | `#D97706` |
| Light | Amber Light | `#FCD34D` |
| Secondary | Slate 900 | `#0F172A` |
| Text | Slate 600 | `#475569` |
| Background | Slate 50 | `#F8FAFC` |

### Company Information
- **Company:** Elevari S.A.S
- **NIT:** 902088849
- **Address:** CR 5 NO. 16 14 OF 711 ED EL GLOBO, BOGOTÁ, D.C, código postal 111711
- **Support Email:** reserve@elevari.live
- **WhatsApp:** +57 3232688534

### Store Documentation
- **Developed by:** Armada AI S.A.S, NIT: 902056540
- **Powered by:** IMPOSSIBLY CORP, D-U-N-S #: 06-969-4845

## Email Templates (Resend)

### Location
`api/src/lib/email-templates/`

### Files
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

### Sender
`api/src/lib/email.ts` — Elevari S.A.S <reserve@elevari.live>

### Environment Variables
```bash
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=reserve@elevari.live
RESEND_FROM_NAME=Elevari S.A.S
```

## WhatsApp Business Integration

### Configuration
- **Phone:** +57 3232688534
- **Bot Location:** `elevari-bot/`
- **Config:** `elevari-bot/src/config/index.js`
- **Webhook:** `/webhook/whatsapp` (Meta Cloud API)
- **Chat:** `/chat`

### Environment Variables
```bash
WHATSAPP_TOKEN=your_meta_cloud_api_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_verify_token
```

### Placement
WhatsApp button appears only on:
- Reservation/booking pages
- Cancellation pages
- Support/contact pages
- Checkout/payment pages

## Google Maps Integration

### Component
`components/brand/GoogleMap.tsx`

### Environment Variables
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Usage
```tsx
import GoogleMap from '@/components/brand/GoogleMap';

<GoogleMap
  latitude={4.7110}
  longitude={-74.0721}
  address="CR 5 NO. 16 14 OF 711 ED EL GLOBO, BOGOTÁ"
/>
```

## Registration Page Cinematic Background

### Component
`components/brand/CinematicBackground.tsx`

### Page
`app/registration/page.tsx`

### Features
- Mountains and nature landscapes background
- Amber gradient overlay matching brand colors
- CSS animations (parallax, slow zoom, particle overlays)
- Dark overlay for text readability
- Respects `prefers-reduced-motion`
- Responsive design

## Placeholder Audit

Confirmed: Only intentional placeholders exist:
- Secret placeholders in documentation (API keys, tokens)
- Legitimate form input placeholders
- Documentation references

No removal candidates found.

## Production Deployment (Hetzner)

### Despliegue automático (GitHub Actions)

Cada push a la rama `b-main` activa el pipeline de CI/CD que despliega automáticamente en Hetzner. También puedes desplegar manualmente desde la pestaña **Actions → Deploy to Hetzner Production → Run workflow**.

### Secrets requeridos en GitHub

Vaya a **Settings → Secrets and variables → Actions → New repository secret** y añada:

| Secret | Valor ejemplo |
|--------|--------------|
| `HETZNER_IP` | `2.29.165.225` |
| `HETZNER_USER` | `root` |
| `HETZNER_SSH_KEY` | Contenido completo de `~/.ssh/id_ed25519_elevari_hetzner` |

### `.env.production` (no commitear)

Este archivo es gitignorado y nunca se sube a GitHub. Copialo manualmente al servidor:

```bash
scp .env.production root@2.29.165.225:/opt/elevari/.env.production
```

### Flujo de deploy

1. Push a `b-main` (o clic en "Run workflow" en Actions)
2. CI corre: build API, build web, validar env staging, typecheck mobile
3. Si todo pasa, SSH a Hetzner y ejecuta:
   - `git pull origin b-main`
   - `npm run go-live:validate`
   - `npm run go-live:deploy` (build + docker compose up -d)
   - Health check: `curl http://localhost/health`

### Contact
- **Support:** reserve@elevari.live
- **WhatsApp:** +57 3232688534