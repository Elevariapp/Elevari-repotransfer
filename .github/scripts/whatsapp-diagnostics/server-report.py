#!/usr/bin/env python3
"""What the production server knows about the WhatsApp bot. Read-only.

Run on the server by the "WhatsApp bot" job of .github/workflows/server-diagnostics.yml (`python3 - <tag>` over SSH).
The run log is public, so this prints counts, HTTP statuses, event names and Meta's numeric error codes only:
never message text, phone numbers, IPs, query strings or tokens.

  1. the bot container and its /health flags
  2. every request nginx received for /webhook/whatsapp: is Meta calling at all, and what did it get?
  3. what the bot logged about those calls

nginx and the bot only keep their log since their last start, and every deploy restarts both.
"""
import json
import os
import re
import subprocess
import sys
from collections import Counter, OrderedDict

ROOT = os.environ.get('ELEVARI_ROOT', '/opt/elevari')
COMPOSE = ['docker', 'compose', '-f', 'docker-compose.prod.yml', '--env-file', '.env.production']
TAG = sys.argv[1] if len(sys.argv) > 1 else ''
WEBHOOK_PATH = '/webhook/whatsapp'

# Default nginx "combined" format; only the method, path, status and User-Agent are used.
ACCESS_LINE = re.compile(r'^\S+ - \S+ \[([^\]]+)\] "([A-Z]+) (\S+)[^"]*" (\d{3}) \S+ "[^"]*" "([^"]*)"')

GRAPH_HINTS = {
    0: 'the server could not reach graph.facebook.com (network, DNS or timeout)',
    10: 'the token has no permission for this number (it needs whatsapp_business_messaging)',
    100: 'Meta rejected the request: usually WHATSAPP_PHONE_NUMBER_ID is not a phone-number ID this token can use',
    190: 'the access token is expired or invalid: create a permanent System User token and update WHATSAPP_TOKEN',
    200: 'the token has no permission for this number (it needs whatsapp_business_messaging)',
    368: 'the account is temporarily blocked for policy violations',
    130429: 'rate limit reached',
    131026: 'WhatsApp could not deliver to that customer',
    131030: 'the customer is not in the allowed list: the number is still a test number or the app is in development mode',
    131031: 'the WhatsApp Business account is locked',
    131042: 'payment problem on the WhatsApp Business account',
    131045: 'the phone number is not correctly registered with the Cloud API',
    131047: 'more than 24 hours since the customer last wrote (only templates are allowed then)',
    133010: 'the phone number is not registered with the Cloud API',
}


def output(cmd, merge_stderr=False):
    try:
        done = subprocess.run(
            cmd,
            cwd=ROOT,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT if merge_stderr else subprocess.DEVNULL,
            timeout=60,
        )
        return done.stdout.decode('utf-8', 'replace').strip()
    except (OSError, subprocess.SubprocessError):
        return ''


def log_lines(container):
    """Streams a container's log (stdout and stderr) without loading it in memory."""
    try:
        proc = subprocess.Popen(
            ['docker', 'logs', container], stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.STDOUT
        )
    except OSError:
        return
    for raw in proc.stdout:
        yield raw.decode('utf-8', 'replace').rstrip('\n')
    proc.wait()


def inspect(container):
    fmt = '{{.State.Status}}|{{.State.StartedAt}}|{{.RestartCount}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}'
    parts = output(['docker', 'inspect', '-f', fmt, container]).split('|')
    return parts if len(parts) == 4 else None


def sender_of(user_agent):
    ua = user_agent.lower()
    if 'facebookexternalua' in ua or 'facebookplatform' in ua:
        return 'Meta'
    if ua.startswith('curl/'):
        return 'curl'
    return 'a browser' if 'mozilla' in ua else 'another client'


def webhook_traffic(nginx):
    """(who, what, status) -> [count, time of the last one] for every request to the webhook."""
    seen = OrderedDict()
    for line in log_lines(nginx):
        match = ACCESS_LINE.match(line)
        if not match:
            continue
        when, method, uri, status, user_agent = match.groups()
        path, _, query = uri.partition('?')
        if path != WEBHOOK_PATH:
            continue
        sender = sender_of(user_agent)
        if TAG and TAG in query:
            who = 'this check, asking as ' + sender
        else:
            who = sender
        if method == 'GET':
            what = 'verification (GET)' if 'hub.' in query else 'GET'
        else:
            what = 'message or status (POST)' if method == 'POST' else method
        entry = seen.setdefault((who, what, int(status)), [0, when])
        entry[0] += 1
        entry[1] = when
    return seen


def bot_events(bot):
    events = OrderedDict()
    for line in log_lines(bot):
        start = line.find('{')
        if start < 0:
            continue
        try:
            record = json.loads(line[start:])
        except ValueError:
            continue
        if not isinstance(record, dict) or not isinstance(record.get('event'), str):
            continue
        name = record['event']
        detail = ''
        if name == 'message.handled':
            detail = 'intent=%s replied=%s' % (record.get('intent'), str(record.get('replied')).lower())
        elif name.startswith('graph.'):
            detail = ' '.join('%s=%s' % (label, record[key]) for label, key in
                              (('http', 'status'), ('code', 'code'), ('subcode', 'subcode')) if record.get(key) is not None)
        elif name == 'webhook.signature_rejected':
            detail = 'reason=%s' % record.get('reason')
        elif name == 'config.replies_disabled':
            detail = 'missing=%s' % ','.join(str(item) for item in record.get('missing') or [])
        entry = events.setdefault((name, detail), [0, record.get('time'), record.get('status'), record.get('code')])
        entry[0] += 1
        entry[1] = record.get('time')
    return events


def main():
    results = []
    if not os.path.isdir(ROOT):
        print('%s does not exist on this server' % ROOT)
        return

    bot = output(COMPOSE + ['ps', '-q', 'bot'])
    nginx = output(COMPOSE + ['ps', '-q', 'nginx'])

    print('== The bot container')
    state = inspect(bot) if bot else None
    if not state:
        print('   not found: the bot is not deployed')
        results.append('the bot container does not exist on the server. Deploy it (CI on b-main).')
    else:
        print('   state=%s health=%s restarts=%s started=%s' % (state[0], state[3], state[2], state[1][:19] + 'Z'))
        if state[0] != 'running':
            results.append('the bot container is not running (state=%s).' % state[0])

    flags = {}
    if state and state[0] == 'running':
        raw = output(['docker', 'exec', bot, 'wget', '-qO-', 'http://127.0.0.1:3001/health'])
        try:
            flags = json.loads(raw)
        except ValueError:
            flags = {}
        if flags:
            print('   /health: replies_enabled=%s signature_verification=%s verify_token=%s accepting_events=%s' % (
                str(flags.get('replies_enabled')).lower(), flags.get('signature_verification'),
                flags.get('verify_token'), str(flags.get('accepting_events')).lower()))
            if flags.get('accepting_events') is False:
                results.append('WHATSAPP_APP_SECRET is not set on the server: the bot refuses every message (503).')
            if flags.get('replies_enabled') is False:
                results.append('WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not set on the server: the bot cannot reply.')
            if flags.get('verify_token') == 'missing':
                results.append('WHATSAPP_VERIFY_TOKEN is not set on the server: Meta cannot verify the webhook.')
        else:
            print('   /health did not answer from inside the container')
            results.append('the bot is running but /health does not answer.')

    print()
    print('== Requests nginx received for %s' % WEBHOOK_PATH)
    traffic = OrderedDict()
    if not nginx:
        print('   nginx container not found')
    else:
        started = inspect(nginx)
        print('   (nginx log starts %s; each deploy restarts nginx and clears it)' % (started[1][:19] + 'Z' if started else '?'))
        traffic = webhook_traffic(nginx)
        if not traffic:
            print('   none')
        for (who, what, status), (count, when) in traffic.items():
            print('   %4d x %-34s %-26s -> %s   (last %s)' % (count, who, what, status, when[:20]))

    from_meta = {key: value for key, value in traffic.items() if key[0] == 'Meta'}
    posts = Counter()
    for (who, what, status), (count, _when) in from_meta.items():
        if what.startswith('message'):
            posts[status] += count
    probes_as_meta = sum(count for (who, _w, _s), (count, _t) in traffic.items() if who == 'this check, asking as Meta')
    if TAG:
        print('   This check\'s own requests "as Meta" that reached nginx: %d of 2' % probes_as_meta)

    print()
    print('== What the bot logged (since its last start)')
    events = bot_events(bot) if state and state[0] == 'running' else OrderedDict()
    if not events:
        print('   nothing')
    for (name, detail), (count, when, _status, _code) in events.items():
        print('   %4d x %-36s %-42s (last %s)' % (count, name, detail, str(when)[:19]))
    if events and any(who.startswith('this check') for (who, _w, _s) in traffic):
        print('   (webhook.verification_rejected and webhook.signature_rejected reason=missing include this check\'s own test requests)')

    names = Counter()
    for (name, _detail), (count, _when, _status, _code) in events.items():
        names[name] += count
    answered = sum(count for (name, detail), (count, _w, _s, _c) in events.items()
                   if name == 'message.handled' and 'replied=true' in detail)

    if not from_meta:
        results.append(
            'Meta has not called the webhook since nginx started. Send "hola" to the WhatsApp number and run this again '
            'within a few minutes. If it is still none, the messages stop before the server: Cloudflare is blocking Meta '
            '(public check above) or the webhook is not registered/subscribed in Meta (Meta check below).')
    if posts.get(401):
        results.append(
            'Meta is delivering messages but the bot rejects their signature (401 x %d): WHATSAPP_APP_SECRET is not the '
            'App Secret of the Meta app that owns this webhook.' % posts[401])
    if posts.get(503) and flags.get('accepting_events') is not False:
        results.append('Meta is delivering messages but the bot refuses them (503 x %d): WHATSAPP_APP_SECRET is missing.' % posts[503])
    if names.get('message.other_number_ignored'):
        results.append(
            'messages arrive for a phone-number ID that is not WHATSAPP_PHONE_NUMBER_ID, so the bot ignores them. '
            'Set WHATSAPP_PHONE_NUMBER_ID to the Phone number ID shown in Meta (WhatsApp -> API Setup).')
    failures = OrderedDict()
    for (name, _detail), (count, _when, status, code) in events.items():
        if name == 'graph.send_failed':
            key = code if isinstance(code, int) else (0 if status == 0 else None)
            failures[(status, code)] = GRAPH_HINTS.get(key, 'see the WhatsApp Cloud API error codes')
    for (status, code), hint in failures.items():
        results.append('the bot tried to answer but Meta refused (HTTP %s, code %s): %s.' % (status, code, hint))
    if answered:
        results.append('the bot answered %d customer message(s) since its last start: it is working.' % answered)
    elif posts.get(200) and not failures and not names.get('message.other_number_ignored'):
        results.append(
            'Meta\'s calls arrive and are accepted, but none was answered: they were delivery receipts, or messages the bot '
            'stays quiet on by design (thanks, emoji, a customer who asked for a person or sent STOP).')

    print()
    for line in results or ['nothing wrong seen from the server.']:
        print('RESULT: ' + line)


if __name__ == '__main__':
    main()
