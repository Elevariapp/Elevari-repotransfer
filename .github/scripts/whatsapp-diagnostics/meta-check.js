'use strict';

// What Meta has on file for the WhatsApp bot. Read-only: every call is a GET to the Graph API.
// Run by the "WhatsApp bot" job of .github/workflows/server-diagnostics.yml INSIDE the bot container
// (`docker exec -i <bot> node -`), so it uses exactly the credentials and the network the bot uses.
// The run log is public: this prints statuses, Meta's numeric error codes and the last digits of ids only,
// never a token, a secret, a full phone number or Meta's free-text error messages.

const clean = (value) => (typeof value === 'string' ? value.trim() : '');
const token = clean(process.env.WHATSAPP_TOKEN);
const phoneNumberId = clean(process.env.WHATSAPP_PHONE_NUMBER_ID);
const appSecret = clean(process.env.WHATSAPP_APP_SECRET);
const configuredWaba = clean(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID);
// The app id is not a secret and not part of the bot's environment: the workflow passes the server's META_APP_ID.
const configuredAppId = /^\d{5,20}$/.test(clean(process.env.META_APP_ID)) ? clean(process.env.META_APP_ID) : '';
const version = /^v\d+\.\d+$/.test(clean(process.env.GRAPH_API_VERSION)) ? clean(process.env.GRAPH_API_VERSION) : 'v21.0';
const WEBHOOK_PATH = '/webhook/whatsapp';

const problems = new Map();
const problem = (subject, text) => {
  if (!problems.has(subject)) problems.set(subject, text);
};
const say = (line = '') => console.log(line);
const tail = (value) => `…${String(value ?? '').replace(/\D/g, '').slice(-4)}`;
// Meta's numeric code and subcode only (debug_token calls the subcode "subcode", errors call it "error_subcode").
const describe = (error) => {
  const subcode = error?.error_subcode ?? error?.subcode;
  return `code ${error?.code ?? '?'}${subcode ? `/${subcode}` : ''}${error?.type ? ` ${error.type}` : ''}`;
};

async function graph(path, params = {}, bearer = token) {
  const url = new URL(`https://graph.facebook.com/${version}/${path}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  try {
    const response = await fetch(url, {
      headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
      signal: AbortSignal.timeout(8_000),
    });
    const json = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, json, error: json?.error };
  } catch (err) {
    return { ok: false, status: 0, json: {}, error: { type: err?.name, code: err?.code ?? err?.cause?.code } };
  }
}

// Only scheme, host and path: a callback URL may carry a secret in its query string.
function callback(value) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value ? '(not a URL)' : '(none)';
  }
}

const NEW_TOKEN =
  'Create a permanent System User token (Meta Business settings -> System users -> Generate token, with the ' +
  'whatsapp_business_messaging and whatsapp_business_management permissions), save it as the WHATSAPP_TOKEN secret and redeploy.';

// A rejected token cannot describe itself, but its app (app id + app secret) can still ask Meta what is wrong with it.
async function whyRejected() {
  if (!configuredAppId || !appSecret) return 'is expired or invalid';
  const asApp = await graph('debug_token', { input_token: token, access_token: `${configuredAppId}|${appSecret}` }, '');
  const data = asApp.json?.data;
  if (!asApp.ok || !data) {
    say(`   asked as app ${tail(configuredAppId)}: HTTP ${asApp.status}, ${describe(asApp.error)}`);
    return asApp.error?.code === 100 ? `does not belong to Meta app ${tail(configuredAppId)}, or is not an access token at all` : 'is expired or invalid';
  }
  const expired = data.expires_at ? new Date(data.expires_at * 1000) : null;
  say(`   asked as app ${tail(configuredAppId)}: valid ${data.is_valid === true ? 'yes' : 'NO'}, type ${data.type ?? '?'}, ${describe(data.error)}${expired ? `, expiry ${expired.toISOString().slice(0, 16)}Z` : ''}`);
  if (expired && expired.getTime() < Date.now()) {
    return `expired on ${expired.toISOString().slice(0, 16).replace('T', ' ')} UTC (the token shown on the API Setup page only lasts a day)`;
  }
  if (!data.type && !data.app_id) return 'is not something Meta recognises as an access token (check the whole token was pasted into the secret)';
  return 'was invalidated (its user logged out, changed password or lost access)';
}

async function checkToken() {
  say('== The access token (WHATSAPP_TOKEN)');
  const result = await graph('debug_token', { input_token: token });
  const data = result.json?.data;
  if (result.status === 0) {
    say(`   the container could not reach graph.facebook.com (${describe(result.error)})`);
    problem('network', 'the bot container cannot reach graph.facebook.com, so it cannot send replies either.');
    return null;
  }
  if (!result.ok || !data) {
    say(`   Meta rejects it: HTTP ${result.status}, ${describe(result.error)}`);
    if (result.error?.code !== 190) {
      const app = await graph('app', { fields: 'id' });
      return { works: true, appId: app.ok && app.json.id ? String(app.json.id) : configuredAppId, wabas: configuredWaba ? [configuredWaba] : [] };
    }
    problem('token', `WHATSAPP_TOKEN ${await whyRejected()}. Meta refuses every reply the bot tries to send, so customers get no answer. ${NEW_TOKEN}`);
    return { works: false, appId: configuredAppId, wabas: [] };
  }

  const scopes = Array.isArray(data.scopes) ? data.scopes : [];
  const expires = data.expires_at ? new Date(data.expires_at * 1000) : null;
  const hoursLeft = expires ? Math.round((expires.getTime() - Date.now()) / 3_600_000) : null;
  say(`   valid: ${data.is_valid === true ? 'yes' : 'NO'}   type: ${data.type ?? '?'}   app: ${tail(data.app_id)}`);
  say(`   expires: ${expires ? `${expires.toISOString().slice(0, 16)}Z (${hoursLeft} h from now)` : 'never'}`);
  say(`   permissions: messaging ${scopes.includes('whatsapp_business_messaging') ? 'yes' : 'NO'}, management ${scopes.includes('whatsapp_business_management') ? 'yes' : 'NO'}`);

  if (data.is_valid !== true) {
    problem('token', `WHATSAPP_TOKEN is no longer valid (${describe(data.error)}): Meta refuses every reply the bot tries to send. ${NEW_TOKEN}`);
  } else if (expires && hoursLeft < 72) {
    problem('token', `WHATSAPP_TOKEN is a temporary token that expires in ${hoursLeft} h; replies stop then. ${NEW_TOKEN}`);
  }
  if (!scopes.includes('whatsapp_business_messaging')) {
    problem('token_scope', 'WHATSAPP_TOKEN lacks the whatsapp_business_messaging permission: Meta will refuse every reply.');
  }

  const wabas = new Set(configuredWaba ? [configuredWaba] : []);
  for (const grant of Array.isArray(data.granular_scopes) ? data.granular_scopes : []) {
    if (!String(grant?.scope).startsWith('whatsapp_business_')) continue;
    for (const id of Array.isArray(grant.target_ids) ? grant.target_ids : []) wabas.add(String(id));
  }
  return { works: data.is_valid === true, appId: data.app_id ? String(data.app_id) : configuredAppId, wabas: [...wabas].slice(0, 3) };
}

async function checkPhoneNumber() {
  say();
  say(`== The phone number (WHATSAPP_PHONE_NUMBER_ID ${tail(phoneNumberId)})`);
  const basic = await graph(phoneNumberId, { fields: 'display_phone_number,quality_rating,code_verification_status' });
  if (!basic.ok) {
    say(`   Meta does not know this id as a phone number the token can use: HTTP ${basic.status}, ${describe(basic.error)}`);
    problem(
      'phone_id',
      'WHATSAPP_PHONE_NUMBER_ID is not a phone-number ID this token can use. It must be the "Phone number ID" from ' +
        'WhatsApp -> API Setup (not the WhatsApp Business Account ID, the app ID or the phone number itself). ' +
        'With a wrong id the bot ignores incoming messages and cannot reply.',
    );
    return null;
  }
  say(`   number ending ${tail(basic.json.display_phone_number)}   quality: ${basic.json.quality_rating ?? '?'}   code verification: ${basic.json.code_verification_status ?? '?'}`);

  // Newer fields: asked one by one so an API version that lacks one does not hide the others.
  const extra = {};
  for (const field of ['platform_type', 'status', 'account_mode', 'is_on_biz_app', 'health_status', 'webhook_configuration']) {
    const result = await graph(phoneNumberId, { fields: field });
    if (result.ok && result.json[field] !== undefined) extra[field] = result.json[field];
  }
  say(`   platform: ${extra.platform_type ?? '?'}   status: ${extra.status ?? '?'}   mode: ${extra.account_mode ?? '?'}   also on the WhatsApp Business app: ${extra.is_on_biz_app ?? '?'}`);

  if (extra.platform_type && extra.platform_type !== 'CLOUD_API') {
    problem(
      'platform',
      `the phone number is not registered on the WhatsApp Cloud API (platform ${extra.platform_type}). Messages to it go to the ` +
        'WhatsApp phone app, never to the bot. Register it in WhatsApp Manager -> Phone numbers (or POST /<phone-number-id>/register).',
    );
  }
  if (extra.status && extra.status !== 'CONNECTED') {
    problem('status', `the phone number's status is ${extra.status}, not CONNECTED: it cannot exchange messages through the Cloud API yet.`);
  }
  if (extra.account_mode === 'SANDBOX') {
    problem('sandbox', 'the phone number is in SANDBOX (test) mode: it only talks to the test recipients listed in Meta.');
  }

  const health = extra.health_status;
  if (health) {
    say(`   can send messages: ${health.can_send_message ?? '?'}`);
    for (const entity of Array.isArray(health.entities) ? health.entities : []) {
      const codes = (Array.isArray(entity.errors) ? entity.errors : []).map((error) => error?.error_code).filter(Boolean);
      if (entity.can_send_message !== 'AVAILABLE' || codes.length) {
        say(`     ${entity.entity_type}: ${entity.can_send_message}${codes.length ? ` (Meta error ${codes.join(', ')})` : ''}`);
      }
    }
    if (health.can_send_message === 'BLOCKED') {
      problem('health', 'Meta reports that this number CANNOT send messages (see "can send messages" above; details in WhatsApp Manager -> Account tools).');
    }
  }

  const hooks = extra.webhook_configuration;
  if (hooks) {
    say(`   webhook Meta will call: app ${callback(hooks.application)}${hooks.whatsapp_business_account ? `, account override ${callback(hooks.whatsapp_business_account)}` : ''}${hooks.phone_number ? `, number override ${callback(hooks.phone_number)}` : ''}`);
    const effective = hooks.phone_number || hooks.whatsapp_business_account || hooks.application;
    if (!effective) {
      problem(
        'webhook',
        'no webhook URL is registered in Meta for this number, so Meta has nowhere to send customer messages. In Meta for Developers -> ' +
          'your app -> WhatsApp -> Configuration: Callback URL https://elevari.live/webhook/whatsapp, verify token = WHATSAPP_VERIFY_TOKEN, ' +
          'Verify and save, then subscribe to "messages".',
      );
    } else if (!callback(effective).endsWith(WEBHOOK_PATH)) {
      problem('webhook', `Meta sends this number's messages to ${callback(effective)}, not to the bot (…${WEBHOOK_PATH}). Change the Callback URL in WhatsApp -> Configuration.`);
    }
  }
  return extra;
}

async function checkAccount(appId, wabas) {
  say();
  say('== The WhatsApp Business Account');
  if (!wabas.length) {
    say('   not checked: WHATSAPP_BUSINESS_ACCOUNT_ID is not set and the token does not name an account');
    return;
  }
  for (const waba of wabas) {
    const apps = await graph(`${waba}/subscribed_apps`);
    if (!apps.ok) {
      say(`   account ${tail(waba)}: subscribed apps not readable (HTTP ${apps.status}, ${describe(apps.error)})`);
    } else {
      const ids = (Array.isArray(apps.json.data) ? apps.json.data : []).map((item) => String(item?.whatsapp_business_api_data?.id ?? ''));
      const subscribed = Boolean(appId) && ids.includes(appId);
      say(`   account ${tail(waba)}: ${ids.length} app(s) subscribed to its webhooks; this app: ${subscribed ? 'yes' : 'NO'}`);
      if (!subscribed) {
        problem(
          'subscribed_apps',
          `the Meta app is not subscribed to WhatsApp account ${tail(waba)}, so Meta sends it no messages. Open WhatsApp -> Configuration ` +
            'in the app and save the webhook again (or POST /<account-id>/subscribed_apps with the token).',
        );
      }
    }

    const numbers = await graph(`${waba}/phone_numbers`, { fields: 'id,display_phone_number' });
    if (!numbers.ok) continue;
    const list = Array.isArray(numbers.json.data) ? numbers.json.data : [];
    for (const number of list) {
      say(`     number ending ${tail(number.display_phone_number)} -> Phone number ID ${number.id}${String(number.id) === phoneNumberId ? '   <- configured' : ''}`);
    }
    if (list.length && !list.some((number) => String(number.id) === phoneNumberId)) {
      // More useful than the generic "not a phone-number ID" verdict: say which id is the right one.
      const right = list.map((number) => `number ending ${tail(number.display_phone_number)} = ${number.id}`).join('; ');
      problems.set(
        'phone_id',
        `WHATSAPP_PHONE_NUMBER_ID is wrong: it is not a number of WhatsApp account ${tail(waba)} (${right}). With a wrong id the bot ` +
          'ignores incoming messages and cannot reply. Set the WHATSAPP_PHONE_NUMBER_ID repository secret to the right id and redeploy.',
      );
    }
  }
}

async function checkAppWebhook(appId) {
  say();
  say("== The app's webhook subscription (asked with app id + WHATSAPP_APP_SECRET)");
  if (!appId || !appSecret) {
    say('   not checked: the app id or WHATSAPP_APP_SECRET is not available');
    return;
  }
  const result = await graph(`${appId}/subscriptions`, { access_token: `${appId}|${appSecret}` }, '');
  if (!result.ok) {
    say(`   Meta refused app id + secret: HTTP ${result.status}, ${describe(result.error)}`);
    if (result.error?.code === 190) {
      problem(
        'app_secret',
        `Meta does not accept WHATSAPP_APP_SECRET as the App Secret of app ${tail(appId)}. If that is the app connected to WhatsApp, the bot ` +
          'rejects every incoming message (401). Copy the secret from the app -> App settings -> Basic -> App secret, update it and redeploy.',
      );
    }
    return;
  }
  say('   WHATSAPP_APP_SECRET belongs to this app: yes');
  const entry = (Array.isArray(result.json.data) ? result.json.data : []).find((item) => item?.object === 'whatsapp_business_account');
  if (!entry) {
    say('   WhatsApp webhook: not registered');
    problem(
      'webhook',
      'the Meta app has no WhatsApp webhook registered, so Meta has nowhere to send customer messages. In Meta for Developers -> your app -> ' +
        'WhatsApp -> Configuration: Callback URL https://elevari.live/webhook/whatsapp, verify token = WHATSAPP_VERIFY_TOKEN, Verify and save, ' +
        'then subscribe to "messages".',
    );
    return;
  }
  const fields = (Array.isArray(entry.fields) ? entry.fields : []).map((field) => field?.name).filter(Boolean);
  say(`   WhatsApp webhook: ${callback(entry.callback_url)}   active: ${entry.active === true ? 'yes' : 'NO'}   "messages" subscribed: ${fields.includes('messages') ? 'yes' : 'NO'}`);
  if (!callback(entry.callback_url).endsWith(WEBHOOK_PATH)) {
    problem('webhook', `the app's WhatsApp webhook points to ${callback(entry.callback_url)}, not to the bot (…${WEBHOOK_PATH}). Change the Callback URL in WhatsApp -> Configuration.`);
  }
  if (entry.active !== true) problem('webhook_active', "the app's WhatsApp webhook is registered but not active: verify and save it again in WhatsApp -> Configuration.");
  if (!fields.includes('messages')) {
    problem('webhook_fields', 'the webhook is registered but not subscribed to the "messages" field, so customer messages are never sent to it. Subscribe to "messages" in WhatsApp -> Configuration -> Webhook fields.');
  }
}

async function main() {
  say("== Meta's side (read-only questions to the Graph API, asked from the bot container)");
  if (!token || !phoneNumberId) {
    say('   not checked: WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not set in the bot container');
    say('RESULT: WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing on the server: the bot cannot reply.');
    return;
  }
  say();
  const identity = await checkToken();
  if (identity?.works) {
    await checkPhoneNumber();
    await checkAccount(identity.appId, identity.wabas);
  } else if (identity) {
    say();
    say('== The phone number and the WhatsApp Business Account');
    say('   not checked: Meta only answers these questions to a valid access token');
  }
  if (identity) await checkAppWebhook(identity.appId);
  say();
  for (const text of problems.size ? problems.values() : ["nothing wrong seen on Meta's side."]) say(`RESULT: ${text}`);
}

main().catch((err) => {
  say(`RESULT: the Meta check stopped unexpectedly (${err?.name ?? 'error'}).`);
});
