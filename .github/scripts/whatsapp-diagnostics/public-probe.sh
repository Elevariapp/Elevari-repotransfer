#!/usr/bin/env bash
# Who answers at the WhatsApp webhook: the bot, or Cloudflare before the request ever gets there?
# Run on a GitHub runner by the "WhatsApp bot" job of .github/workflows/server-diagnostics.yml. It needs no secrets and
# changes nothing: the GET carries a deliberately wrong verify token and the POST is unsigned, so the bot refuses both.
# Every request is sent the way Meta sends it (User-Agent "facebookexternalua") and, for contrast, as curl and as a
# browser. A runner is not Meta, so the last word is server-report.py: it shows what Meta itself got.
# Env: DOMAIN (default elevari.live), BASE_URL (default https://$DOMAIN), TAG (marks these requests in nginx's log).
set -u

DOMAIN="${DOMAIN:-elevari.live}"
BASE_URL="${BASE_URL:-https://$DOMAIN}"
TAG="${TAG:-diag$(date +%s)}"
HOOK="$BASE_URL/webhook/whatsapp"
BROWSER_UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT

# Sends one request, prints who answered and sets $who to bot, cloudflare or unknown.
ask() {
  local label="$1" code body
  shift
  : > "$scratch/head"
  : > "$scratch/body"
  code=$(curl -sS -m 20 -o "$scratch/body" -D "$scratch/head" -w '%{http_code}' "$@" 2>/dev/null) || code=000
  body=$(head -c 200 "$scratch/body" | tr -d '\r\n')

  who=unknown
  local said="unexpected answer"
  if grep -qiE '^cf-mitigated: *challenge' "$scratch/head" || grep -qi 'just a moment' "$scratch/body"; then
    who=cloudflare
    said="STOPPED BY CLOUDFLARE with a challenge page; it never reached the bot"
  elif [ "$code" = 403 ] && grep -qiE '^server: *cloudflare' "$scratch/head" && [ "$body" != Forbidden ]; then
    who=cloudflare
    said="BLOCKED BY CLOUDFLARE; it never reached the bot"
  elif [ "$code" = 403 ] && [ "$body" = Forbidden ]; then
    who=bot
    said="the bot answered (it refused the wrong verify token, as it should)"
  elif [ "$code" = 401 ] && [[ "$body" == *invalid_signature* ]]; then
    who=bot
    said="the bot answered (it refused the unsigned request, as it should)"
  elif [ "$code" = 503 ] && [[ "$body" == *webhook_signature_not_configured* ]]; then
    who=bot
    said="the bot answered, but it refuses every message: WHATSAPP_APP_SECRET is not set on the server"
  elif [ "$code" = 000 ]; then
    said="no answer (timeout or connection error)"
  elif [ "$code" = 502 ] || [ "$code" = 504 ]; then
    said="the server answered but the bot did not (is its container running?)"
  fi
  echo "   $label -> HTTP $code: $said"
}

echo "== The bot's own status ($BASE_URL/bot/health; flags only, it never shows values)"
code=$(curl -sS -m 20 -A "$BROWSER_UA" -o "$scratch/health" -w '%{http_code}' "$BASE_URL/bot/health?diag=$TAG" 2>/dev/null) || code=000
if [ "$(head -c 1 "$scratch/health")" = '{' ]; then
  echo "   HTTP $code $(head -c 300 "$scratch/health" | tr -d '\r\n')"
else
  echo "   HTTP $code (not the bot's answer)"
fi
echo
echo "== Who answers at $HOOK"

meta=unknown
probe_as() {
  local name="$1" get
  shift
  echo "-- asked $name"
  ask "verification GET" "$@" "$HOOK?hub.mode=subscribe&hub.verify_token=wrong-on-purpose&hub.challenge=1&diag=$TAG"
  get=$who
  ask "message POST    " "$@" -X POST -H 'Content-Type: application/json' --data '{}' "$HOOK?diag=$TAG"
  if [ "$name" = "the way Meta asks (User-Agent: facebookexternalua)" ]; then
    if [ "$get" = cloudflare ] || [ "$who" = cloudflare ]; then
      meta=cloudflare
    elif [ "$get" = bot ] && [ "$who" = bot ]; then
      meta=bot
    fi
  fi
}
probe_as "the way Meta asks (User-Agent: facebookexternalua)" -A facebookexternalua
probe_as "as plain curl"
probe_as "as a browser" -A "$BROWSER_UA"

echo
case "$meta" in
  cloudflare)
    echo "RESULT: Cloudflare stops requests that look like Meta's before they reach the bot. While it does, Meta can"
    echo "        neither verify the webhook nor deliver customer messages, so the bot stays silent."
    echo "        Fix it in Cloudflare: see \"If the bot does not answer\" in elevari-bot/README.md."
    ;;
  bot)
    echo "RESULT: requests that look like Meta's reach the bot. From GitHub's network, Cloudflare is not in the way."
    ;;
  *)
    echo "RESULT: inconclusive from GitHub's network (see the answers above)."
    ;;
esac
echo "        (A GitHub runner is not Meta: the server report below shows what Meta itself got.)"
