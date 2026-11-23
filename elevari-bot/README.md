# Elevari WhatsApp Business AI Bot

## Overview

WhatsApp Business AI Bot for Elevari S.A.S — a hospitality platform for managing property reservations.

## Configuration

### Phone Number
**WhatsApp Business:** +57 3232688534

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `WHATSAPP_TOKEN` | Meta Cloud API access token | Yes |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone number ID from Meta | Yes |
| `WHATSAPP_VERIFY_TOKEN` | Webhook verification token | Yes |
| `PORT` | Server port (default: 3001) | No |
| `HOST` | Server host (default: 0.0.0.0) | No |

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Liveness probe (Docker healthcheck, `/bot/health` via nginx) |
| `/webhook/whatsapp` | GET/POST | Meta Cloud API webhook |
| `/chat` | POST | Chat endpoint for AI concierge (internal only, not exposed by nginx) |

## Placement

The WhatsApp button appears only on important pages:
- Reservation/booking pages
- Cancellation pages
- Support/contact pages
- Checkout/payment pages

## UX Design

- Subtle floating button or chat widget
- Opt-in greeting, not auto-initiated
- Clear CTA: "Talk to AI Concierge on WhatsApp"
- Respects user privacy — no data shared without consent

## Installation

```bash
cd elevari-bot
npm install
cp .env.example .env
# Edit .env with your Meta Cloud API credentials
npm run dev
```

## Deployment

The bot ships in the main stack (`docker-compose.prod.yml`, service `bot`) and is deployed by the `b-main` CI pipeline via `deploy/scripts/deploy-prod.sh`. See `deploy/DEPLOYMENT_PRODUCTION.md`.
