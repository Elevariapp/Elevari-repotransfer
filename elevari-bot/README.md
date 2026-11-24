# Elevari WhatsApp Business Bot

## Overview

WhatsApp Business concierge for Elevari S.A.S — a hospitality platform for property reservations in Colombia.

**WhatsApp Business:** +57 3232688534

The bot is deliberately subtle: it **only answers messages a guest sends first**, replies at most once per message, never sends marketing and never writes to anyone unprompted. Spanish is the default; English is detected from the guest's message.

## What the guest sees

| Guest sends | Bot replies |
|-------------|-------------|
| `hola`, `hi`, `menu`, `ayuda`, `help` | A welcome with a WhatsApp list ("Ver opciones" / "See options") of five options |
| `1`–`5`, an option title, or a natural phrase ("quiero cancelar mi reserva", "refund policy") | The matching answer: one short message with a link |
| `humano`, `asesor`, `agent`, `human`, "hablar con una persona" (option 5) | The support email `reserve@elevari.live` and a note that a person will answer during business hours. The bot then stays quiet for that guest for **12 hours** (except for `menu` / `stop`) |
| `stop`, `baja`, `parar`, `unsubscribe`, `cancelar suscripcion` | One confirmation, then silence until the guest sends `menu`, `hola`, `start` or `inicio` |
| Anything it does not understand | A short pointer to `menu`, at most once every 5 minutes per guest, otherwise silence |
| Audio, image, video, document, sticker, location… | One short "I can only read text messages" note, at most once every 5 minutes |
| "gracias", "ok", emoji only, reactions | Nothing |

Menu options (links are built from `PUBLIC_SITE_URL`):

1. Explorar y reservar → `/properties`
2. Mi reserva → `/account` (see bookings, finish a payment, cancel)
3. Pagos y reembolsos → `/legal/refund` (also the cancellation policy page)
4. Ser anfitrión → `/host`
5. Hablar con una persona → human handoff

All routing lives in `src/concierge.js` as a pure function (`route({ text, buttonId, now, state })` → `{ replies, state }`), so it is unit-tested without any network.

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `WHATSAPP_APP_SECRET` | Meta app secret; verifies the `X-Hub-Signature-256` header of every webhook POST | **Yes in production** (without it every POST is refused with 503) |
| `WHATSAPP_VERIFY_TOKEN` | Token you choose; Meta sends it when verifying the webhook | Yes |
| `WHATSAPP_TOKEN` | Cloud API access token (permanent system-user token) used to send replies | Yes (no replies without it) |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone number **ID** from Meta (not the phone number) | Yes (no replies without it) |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | WhatsApp Business Account ID | No (informational) |
| `PUBLIC_SITE_URL` | Base URL of the links sent to guests (default `https://elevari.live`, trailing slash is stripped) | No |
| `GRAPH_API_VERSION` | Graph API version (default `v21.0`) | No |
| `NODE_ENV` | `production` in Docker; makes `WHATSAPP_APP_SECRET` mandatory | No |
| `PORT` | Server port (default `3001`) | No |
| `HOST` | Bind address (default `0.0.0.0`) | No |

The `bot` service in `docker-compose.prod.yml` passes variables to the container one by one, so every variable above must be listed there (and in the server's production env file).

The bot **always boots**, even with an empty environment (the CI smoke test relies on it). Missing values are reported once in the startup log and as flags in `/health`, never as a crash. Without `WHATSAPP_TOKEN` or `WHATSAPP_PHONE_NUMBER_ID` replies are disabled and the Graph API is never called.

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Liveness probe (Docker healthcheck, `/bot/health` via nginx). Always 200 |
| `/webhook/whatsapp` | GET | Meta verification handshake (`hub.mode`, `hub.verify_token`, `hub.challenge`) |
| `/webhook/whatsapp` | POST | Inbound messages and delivery statuses from Meta |

nginx exposes only `/bot/health` and `/webhook/whatsapp`. The old `/chat` placeholder has been removed.

`/health` returns flags only, never values:

```json
{
  "status": "ok",
  "service": "elevari-bot",
  "replies_enabled": true,
  "signature_verification": "enabled",
  "verify_token": "configured",
  "accepting_events": true
}
```

`replies_enabled: false` or `signature_verification: "missing"` means variables are missing. `accepting_events: false` means production without `WHATSAPP_APP_SECRET`: webhooks are being refused.

## How webhooks are handled

1. **Authenticate.** `X-Hub-Signature-256` must equal `sha256=` + the HMAC-SHA256 of the *raw* request body keyed with `WHATSAPP_APP_SECRET` (compared in constant time). Invalid or missing → `401`, nothing is processed.
   - No secret and `NODE_ENV=production` → every POST gets `503` and the bot logs a `config.app_secret_missing` error at startup: it never acts on unauthenticated webhooks in production.
   - No secret outside production → processed with a warning (local development only).
2. **Acknowledge.** An authentic POST gets `200 EVENT_RECEIVED` immediately and is processed afterwards, so Meta never times out and retries.
3. **Filter.** Redelivered message ids (10 minutes), senders above 15 messages per minute (silently dropped), delivery statuses and messages for other numbers of the same Meta app are ignored.
4. **Reply.** The concierge picks at most one reply, sent with `POST https://graph.facebook.com/{version}/{PHONE_NUMBER_ID}/messages` (10 s timeout, one retry on network error / 429 / 5xx). If WhatsApp rejects the interactive list, the menu is re-sent as numbered text. The inbound message is marked as read (best effort).

Logs are one JSON object per line. They never contain message text, profile names, tokens or full phone numbers (numbers are masked to the last 4 digits).

## Connecting Meta (one time)

1. [Meta for Developers](https://developers.facebook.com/apps) → your app → **WhatsApp → API Setup**: copy the **Phone number ID** (`WHATSAPP_PHONE_NUMBER_ID`) and the **WhatsApp Business Account ID** (`WHATSAPP_BUSINESS_ACCOUNT_ID`).
2. Create a permanent access token for a system user with the `whatsapp_business_messaging` permission (`WHATSAPP_TOKEN`).
3. **App settings → Basic → App secret** → `WHATSAPP_APP_SECRET`.
4. Generate a long random string → `WHATSAPP_VERIFY_TOKEN`.
5. Add the values to the server's production env file and redeploy.
6. **WhatsApp → Configuration → Webhook**: callback URL `https://elevari.live/webhook/whatsapp`, verify token = `WHATSAPP_VERIFY_TOKEN`, **Verify and save**, then subscribe to the **messages** field.
7. Send `hola` to +57 3232688534 and check that the menu arrives.

The domain is behind Cloudflare, and Meta's servers cannot solve a challenge page: if Cloudflare challenges them, step 6 fails with 403 and no customer message ever reaches the bot. See the next section.

## If the bot does not answer

The bot fails silently on purpose (it never writes to a customer unless everything checks out), so a healthy container says little. Run **Actions → Server diagnostics → Run workflow** and open the **WhatsApp bot** job (the same report is on the run's summary page). It is read-only, prints no values, and ends each part with a `RESULT:` line:

1. **Who answers at the webhook** — the two requests Meta makes (verification `GET`, message `POST`) sent with Meta's User-Agent (`facebookexternalua`) from GitHub's network. The bot refuses both on purpose; what matters is whether the bot or Cloudflare answered.
2. **What reached the server** — every request nginx received for `/webhook/whatsapp` and what the bot logged about it (event names and Meta's error codes only). nginx and the bot keep logs only since their last start and every deploy restarts them, so send `hola` to the number first and run the workflow a minute later.
3. **What Meta has on file** — read-only Graph API questions asked from inside the bot container with the bot's own credentials: is the token valid and permanent, is `WHATSAPP_PHONE_NUMBER_ID` a number on the Cloud API, is the webhook registered with the `messages` field, is the app subscribed to the WhatsApp account, does `WHATSAPP_APP_SECRET` belong to the app.

| What the report shows | Cause | Fix |
|-----------------------|-------|-----|
| "Stopped by Cloudflare" for the requests asked the way Meta asks, and no request from Meta in nginx | Cloudflare challenges non-browser clients | Cloudflare → **Security → Events**, filter by path `/webhook/whatsapp`, and read which service acted. **Bot Fight Mode** cannot be skipped by a WAF rule: turn the setting off, or add an IP Access rule with action *Allow* for Meta's network (ASN `AS32934`), or move to a plan with Super Bot Fight Mode and skip it for this path. A **custom or managed rule** / **Security Level**: add a WAF custom rule `http.request.uri.path eq "/webhook/whatsapp"` with action *Skip* |
| No request from Meta, and the webhook is "not registered" or `messages` is not subscribed | Step 6 of *Connecting Meta* was never completed | Do step 6 (it only succeeds once Cloudflare lets Meta in) |
| No request from Meta, everything registered | The Meta app is in Dev mode ("some webhooks will not be sent if your app is in Dev mode", Meta docs), or it is not subscribed to the WhatsApp account | Switch the app to **Live**; save the webhook again in WhatsApp → Configuration |
| Platform is not `CLOUD_API`, or status is not `CONNECTED` | The number is not registered with the Cloud API (it may still be in use on the WhatsApp Business phone app, where its messages then go) | Register the number: WhatsApp Manager → Phone numbers |
| Meta's `POST` gets `401`, `webhook.signature_rejected reason=mismatch` | `WHATSAPP_APP_SECRET` is not this app's secret | App settings → Basic → App secret → update the secret, redeploy |
| `message.other_number_ignored` | `WHATSAPP_PHONE_NUMBER_ID` is not the number's ID | Use the *Phone number ID* from WhatsApp → API Setup (the report lists it) |
| `graph.send_failed` with `code=190` | The access token expired (the one from API Setup lasts 24 hours) | Create a permanent System User token, update `WHATSAPP_TOKEN`, redeploy |
| `graph.send_failed` with `code=131030` | Test number or Dev-mode app: only allow-listed recipients | Add a real number and switch the app to Live |
| `message.handled … replied=true` | The bot is answering | Nothing: see *What the guest sees* for the messages it deliberately stays quiet on |

The secrets live in the repository's Actions secrets and reach the server on the next deploy (CI on `b-main`).

## Known limitations

- **State is in memory.** Opt-outs, the 12-hour handoff silence, de-duplication, rate limits and cooldowns live in the bot process (bounded; the oldest entries are evicted). They are lost on restart or redeploy and require a single bot instance. Persisting them (Redis or the database) is a future item; until then a guest who opted out may receive a reply to their next message after a redeploy.
- **Handoff only silences the bot.** A person must answer from the WhatsApp Business app or the `reserve@elevari.live` inbox.
- A send that timed out and was retried can, rarely, be delivered twice.

## Placement

There is no floating WhatsApp button. A quiet hairline glyph with a text label sits in contextual places: header, footer, the property booking card, FAQ and contact pages, checkout and the booking confirmation, the app's support entries and the email help line and footer. The complete list is in `docs/HANDOVER.md`.

## UX Design

- Quiet glyph and text link, never a green bubble or a floating widget
- Opt-in greeting, not auto-initiated
- Clear CTA: "Escríbenos por WhatsApp", with the page's own prefilled message
- Respects user privacy — no data shared without consent

## Development

```bash
cd elevari-bot
npm ci
cp .env.example .env   # placeholders only; .env is git-ignored
# Edit .env with your Meta Cloud API credentials
npm run dev            # loads .env (needs Node 22.9+)
npm run check          # syntax check (also run by CI)
npm test               # node:test, fully offline: the Graph API is mocked
```

Without `WHATSAPP_APP_SECRET` the bot processes webhooks unsigned and logs a warning (non-production only). To try it end to end from a phone, expose `/webhook/whatsapp` through an HTTPS tunnel and register it in Meta as described above.

Code map: `src/index.js` (entry point) · `src/app.js` (Express app, webhook pipeline, `/health`) · `src/concierge.js` (pure routing and copy) · `src/whatsapp.js` (Graph API client) · `src/webhook.js` (payload parser) · `src/signature.js` · `src/store.js` (TTL map, rate limiter) · `src/logger.js` · `src/config/index.js`.

## Deployment

The bot ships in the main stack (`docker-compose.prod.yml`, service `bot`) and is deployed by the `b-main` CI pipeline via `deploy/scripts/deploy-prod.sh`. See `deploy/DEPLOYMENT_PRODUCTION.md`.
